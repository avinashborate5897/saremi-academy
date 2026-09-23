import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { TeacherProfile, ClassSession, TrialBookingRecord, EnrollmentRecord } from '../types';
import { detectSessionConflict, sanitizeFirestorePayload } from './sessionService';
import { triggerTransactionalNotification } from './firestoreService';
import { recordAuditLog } from './adminFirestoreService';
import { dispatchNotification } from './notificationService';

export interface TeacherAssignmentCandidate {
  teacher: TeacherProfile;
  score: number;
  activeWorkload: number;
  isQualified: boolean;
  hasConflict: boolean;
  conflictReason?: string;
}

export interface AutoAssignmentResult {
  success: boolean;
  assignedTeacher: TeacherProfile | null;
  matchScore: number;
  reason: string;
  requiresAdminAttention: boolean;
  candidatesEvaluated: number;
  proposedDate?: string;
  proposedTime?: string;
}

/**
 * Normalizes course/instrument query into standard musical disciplines
 */
export function normalizeDiscipline(input: string = ''): 'vocals' | 'piano' | 'guitar' | 'tabla' | 'violin' | 'general' {
  const lower = input.toLowerCase();
  if (lower.includes('vocal') || lower.includes('sing') || lower.includes('voice') || lower.includes('riyaaz') || lower.includes('sargam') || lower.includes('raag') || lower.includes('hindustani') || lower.includes('carnatic') || lower.includes('bhajan')) {
    return 'vocals';
  }
  if (lower.includes('piano') || lower.includes('keyboard') || lower.includes('keys') || lower.includes('western classical')) {
    return 'piano';
  }
  if (lower.includes('guitar') || lower.includes('acoustic') || lower.includes('fingerstyle') || lower.includes('chords')) {
    return 'guitar';
  }
  if (lower.includes('tabla') || lower.includes('percussion') || lower.includes('rhythm') || lower.includes('taal') || lower.includes('teentaal')) {
    return 'tabla';
  }
  if (lower.includes('violin') || lower.includes('strings')) {
    return 'violin';
  }
  return 'general';
}

/**
 * Checks if a teacher is qualified for the given course/instrument
 */
export function isTeacherQualified(teacher: TeacherProfile, requestedDiscipline: string, courseTitle: string = ''): boolean {
  const discipline = normalizeDiscipline(requestedDiscipline || courseTitle);
  const spec = (teacher.specialization || '').toLowerCase();
  const bio = (teacher.bio || '').toLowerCase();
  const courses = (teacher.courses || []).map((c) => c.toLowerCase());
  const combined = `${spec} ${bio} ${courses.join(' ')}`;

  switch (discipline) {
    case 'vocals':
      return combined.includes('vocal') || combined.includes('voice') || combined.includes('sing') || combined.includes('gharan');
    case 'piano':
      return combined.includes('piano') || combined.includes('keyboard');
    case 'guitar':
      return combined.includes('guitar');
    case 'tabla':
      return combined.includes('tabla') || combined.includes('percussion') || combined.includes('rhythm');
    case 'violin':
      return combined.includes('violin') || combined.includes('strings');
    default:
      return true;
  }
}

/**
 * Fetches all available active teachers strictly from Firestore 'teachers' collection
 * and verifies that each teacher possesses a corresponding, verified account in '/users/{uid}'
 * with role === 'teacher' and status !== 'inactive'.
 */
export async function getActiveTeachers(): Promise<TeacherProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'teachers'));
    if (!snap.empty) {
      const rawTeachers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherProfile));
      const activeCandidates = rawTeachers.filter((t) => t.id && t.active !== false && (t as any).status !== 'inactive');

      if (activeCandidates.length === 0) return [];

      // Validate corresponding /users/{uid} document for every candidate teacher
      const verifiedTeachers: TeacherProfile[] = [];

      for (const teacher of activeCandidates) {
        const teacherUid = teacher.id;
        if (!teacherUid || teacherUid.trim().length === 0) continue;

        try {
          const userDocSnap = await getDoc(doc(db, 'users', teacherUid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Invariant verification: /users/{uid} must have role === 'teacher' and not be inactive/banned
            if (userData.role === 'teacher' && userData.status !== 'inactive' && userData.status !== 'banned') {
              verifiedTeachers.push({
                ...teacher,
                name: teacher.name || userData.name || 'Faculty Mentor',
                email: teacher.email || userData.email || '',
                phone: teacher.phone || userData.phone || '',
                specialization: teacher.specialization || userData.specialization || 'Classical Music'
              });
            } else {
              console.warn(`[Faculty Validation] Excluded /teachers/${teacherUid}: matching /users/${teacherUid} role is "${userData.role}" (expected "teacher").`);
            }
          } else {
            console.warn(`[Faculty Validation] Excluded orphan /teachers/${teacherUid}: no matching /users/${teacherUid} document found in database.`);
          }
        } catch (vErr) {
          console.warn(`[Faculty Validation] Error verifying /users/${teacherUid}:`, vErr);
        }
      }

      return verifiedTeachers;
    }
  } catch (err) {
    console.warn('Teacher fetch query note:', err);
  }

  // Strictly return empty array if no verified active teachers exist
  return [];
}

/**
 * Automates teacher selection based on:
 * 1. Instrument / Course qualification
 * 2. Teacher availability & conflict prevention
 * 3. Workload balancing (fewer active sessions = higher priority)
 */
export async function findBestTeacherForSlot(params: {
  discipline: string;
  courseTitle?: string;
  targetDate: string; // YYYY-MM-DD or 'Flexible'
  targetTime: string; // HH:mm or 'Flexible'
  durationMinutes?: number;
  studentId?: string;
  preferredTeacherId?: string;
  demoTeacherId?: string;
  adminOverrideTeacherId?: string;
}): Promise<AutoAssignmentResult> {
  const {
    discipline,
    courseTitle = '',
    targetDate,
    targetTime,
    durationMinutes = 45,
    studentId = '',
    preferredTeacherId,
    demoTeacherId,
    adminOverrideTeacherId
  } = params;

  const allTeachers = await getActiveTeachers();
  if (allTeachers.length === 0) {
    return {
      success: false,
      assignedTeacher: null,
      matchScore: 0,
      reason: 'No real teacher account is available for this instrument/time slot.',
      requiresAdminAttention: true,
      candidatesEvaluated: 0
    };
  }

  // 1. Admin Override Check (Authoritative override bypasses automated heuristics)
  if (adminOverrideTeacherId) {
    const overrideTeacher = allTeachers.find((t) => t.id === adminOverrideTeacherId);
    if (overrideTeacher) {
      return {
        success: true,
        assignedTeacher: overrideTeacher,
        matchScore: 100,
        reason: `Admin Override: Authoritatively assigned Guru ${overrideTeacher.name}.`,
        requiresAdminAttention: false,
        candidatesEvaluated: allTeachers.length
      };
    }
  }

  // Retrieve current active sessions to compute workload & check conflicts
  let allSessions: ClassSession[] = [];
  try {
    const sessionsSnap = await getDocs(collection(db, 'classes'));
    allSessions = sessionsSnap.docs.map((d) => d.data() as ClassSession);
  } catch (err) {
    console.warn('Class sessions retrieval warning:', err);
  }

  const isSpecificSlot = targetDate && targetDate !== 'Flexible' && targetTime && targetTime !== 'Flexible';

  // Format scheduledAt candidate timestamp if slot is specific
  const cleanTime = targetTime.includes(':') ? targetTime.replace(/[^0-9:]/g, '').slice(0, 5) : '18:00';
  const scheduledAt = isSpecificSlot ? `${targetDate}T${cleanTime}:00` : '';

  const candidates: TeacherAssignmentCandidate[] = [];

  for (const teacher of allTeachers) {
    const qualified = isTeacherQualified(teacher, discipline, courseTitle);
    if (!qualified) {
      continue;
    }

    // Workload calculation: count active or upcoming classes
    const teacherClasses = allSessions.filter(
      (s) => s.teacherId === teacher.id && (s.status === 'scheduled' || s.status === 'live')
    );
    const activeWorkload = teacherClasses.length;
    const maxCapacity = (teacher as any).maxCapacity || (teacher as any).maxStudents || 25;

    // Requirement: Exclude teachers at or above max active capacity
    if (activeWorkload >= maxCapacity) {
      continue;
    }

    // Availability & Conflict Check
    let hasConflict = false;
    let conflictReason: string | undefined;

    if (isSpecificSlot && scheduledAt) {
      const conflictCheck = detectSessionConflict(
        {
          teacherId: teacher.id,
          studentId: studentId || 'prospective_student',
          scheduledAt,
          durationMinutes
        },
        allSessions
      );

      if (conflictCheck.hasConflict) {
        hasConflict = true;
        conflictReason = conflictCheck.reason;
      }
    }

    // Normalized Score Calculation (0 - 100):
    // 1. Qualification base: 40 points
    let rawScore = 40;

    // 2. Discipline exact specialization match: +10 points
    const spec = (teacher.specialization || '').toLowerCase();
    const normDisc = normalizeDiscipline(discipline || courseTitle);
    if (spec.includes(normDisc)) {
      rawScore += 10;
    }

    // 3. Demo Teacher Continuity Bonus: +25 points
    if (demoTeacherId && teacher.id === demoTeacherId) {
      rawScore += 25;
    }

    // 4. Preferred Teacher Affinity Bonus: +15 points
    if (preferredTeacherId && teacher.id === preferredTeacherId) {
      rawScore += 15;
    }

    // 5. Workload Balancing (fewer active sessions = higher priority): up to +15 points
    const capacityRatio = Math.max(0, 1 - (activeWorkload / maxCapacity));
    rawScore += Math.round(15 * capacityRatio);

    // 6. Rating Score: up to +5 points
    const rating = Number(teacher.rating) || 5;
    rawScore += Math.round(5 * (Math.min(5, Math.max(1, rating)) / 5));

    // 7. Schedule Conflict Penalty
    if (hasConflict) {
      rawScore = Math.max(0, rawScore - 60);
    }

    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    candidates.push({
      teacher,
      score: normalizedScore,
      activeWorkload,
      isQualified: qualified,
      hasConflict,
      conflictReason
    });
  }

  if (candidates.length === 0) {
    return {
      success: false,
      assignedTeacher: null,
      matchScore: 0,
      reason: `No qualified teachers within capacity limits found for discipline "${discipline}". Flagged for administrative allocation.`,
      requiresAdminAttention: true,
      candidatesEvaluated: allTeachers.length
    };
  }

  // Filter out conflicting candidates first if non-conflicting qualified candidates exist
  const nonConflicting = candidates.filter((c) => !c.hasConflict);
  const candidatePool = nonConflicting.length > 0 ? nonConflicting : candidates;

  // Sort candidates by score descending
  candidatePool.sort((a, b) => b.score - a.score);
  const bestCandidate = candidatePool[0];

  if (bestCandidate.hasConflict) {
    return {
      success: false,
      assignedTeacher: null,
      matchScore: bestCandidate.score,
      reason: `All qualified teachers have a schedule conflict at ${targetDate} ${targetTime}.`,
      requiresAdminAttention: true,
      candidatesEvaluated: candidates.length
    };
  }

  return {
    success: true,
    assignedTeacher: bestCandidate.teacher,
    matchScore: bestCandidate.score,
    reason: `Automated match: ${bestCandidate.teacher.name} is qualified in ${discipline} (score: ${bestCandidate.score}/100, active workload: ${bestCandidate.activeWorkload} classes).`,
    requiresAdminAttention: false,
    candidatesEvaluated: candidates.length
  };
}

/**
 * Core Automated Free Demo Scheduling Transaction Logic
 * 
 * Performs an atomic Firestore transaction that:
 * 1. Reads & validates /teachers and /users collections to verify faculty qualification and active status.
 * 2. Runs strict availability and time conflict checks.
 * 3. Atomically writes to /trial_bookings, /classes, and /live_classes.
 * 4. Provisions the Agora 1:1 Live Acoustic Studio room.
 */
export async function scheduleDemoWithTransaction(params: {
  bookingId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  studentId?: string;
  courseName: string;
  program?: string;
  preferredDate?: string;
  preferredTime?: string;
  learningGoal?: string;
}): Promise<{
  assigned: boolean;
  teacher?: TeacherProfile;
  classSession?: ClassSession;
  reason: string;
}> {
  const {
    bookingId,
    studentName,
    studentEmail = '',
    studentPhone = '',
    studentId,
    courseName,
    program = 'Adults Foundation',
    preferredDate = 'Flexible',
    preferredTime = 'Flexible',
    learningGoal = ''
  } = params;

  const now = new Date().toISOString();
  const cleanBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const effectiveStudentId = studentId || `std_trial_${cleanBookingId}`;
  const classId = `cls_trial_${cleanBookingId}`;
  const channelName = `saremi_trial_${cleanBookingId}`;
  const trialRef = doc(db, 'trial_bookings', bookingId);

  // 1. Evaluate Candidate Teachers & Time Slot Conflicts
  const matchResult = await findBestTeacherForSlot({
    discipline: courseName,
    courseTitle: courseName,
    targetDate: preferredDate,
    targetTime: preferredTime,
    durationMinutes: 30,
    studentId: effectiveStudentId
  });

  const candidateTeacher = matchResult.assignedTeacher;
  const targetDate = preferredDate !== 'Flexible' ? preferredDate : new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
  const targetTime = preferredTime !== 'Flexible' ? preferredTime : '18:00';
  const scheduledAt = `${targetDate}T${targetTime.includes(':') ? targetTime : '18:00'}:00`;

  let transactionAssigned = false;
  let finalTeacher: TeacherProfile | undefined = undefined;
  let finalSession: ClassSession | undefined = undefined;
  let finalReason = matchResult.reason;

  try {
    await runTransaction(db, async (transaction) => {
      // --- ALL READS FIRST (Strict Firestore Transaction Protocol) ---
      const trialSnap = await transaction.get(trialRef);

      let teacherDocSnap: any = null;
      let userDocSnap: any = null;
      let studentUserSnap: any = null;

      if (candidateTeacher?.id) {
        teacherDocSnap = await transaction.get(doc(db, 'teachers', candidateTeacher.id));
        userDocSnap = await transaction.get(doc(db, 'users', candidateTeacher.id));
      }

      if (studentId && !studentId.startsWith('std_trial_')) {
        try {
          studentUserSnap = await transaction.get(doc(db, 'users', studentId));
        } catch {
          // non-critical read
        }
      }

      const classDocRef = doc(db, 'classes', classId);
      const liveClassDocRef = doc(db, 'live_classes', classId);
      const classSnap = await transaction.get(classDocRef);
      const liveClassSnap = await transaction.get(liveClassDocRef);

      // --- INVARIANT VALIDATION & CONFLICT VERIFICATION ---
      let canAssign = Boolean(matchResult.success && candidateTeacher);

      if (canAssign && candidateTeacher?.id) {
        // Invariant 1: /teachers/{id} document must exist and not be inactive
        if (!teacherDocSnap?.exists()) {
          canAssign = false;
          finalReason = `Candidate teacher ${candidateTeacher.name} (/teachers/${candidateTeacher.id}) not found in live database.`;
        } else if (teacherDocSnap.data()?.active === false || teacherDocSnap.data()?.status === 'inactive') {
          canAssign = false;
          finalReason = `Candidate teacher ${candidateTeacher.name} is currently inactive.`;
        }

        // Invariant 2: /users/{id} document must exist with role === 'teacher'
        if (canAssign) {
          if (!userDocSnap?.exists()) {
            canAssign = false;
            finalReason = `Associated user account for faculty ${candidateTeacher.name} (/users/${candidateTeacher.id}) does not exist.`;
          } else {
            const uData = userDocSnap.data();
            if (uData.role !== 'teacher' || uData.status === 'inactive' || uData.status === 'banned') {
              canAssign = false;
              finalReason = `Faculty ${candidateTeacher.name} has invalid user role (${uData.role}) or status (${uData.status}).`;
            }
          }
        }
      }

      // --- ALL WRITES AFTER READS ---
      if (canAssign && candidateTeacher) {
        transactionAssigned = true;
        finalTeacher = candidateTeacher;

        const session: ClassSession = {
          id: classId,
          sessionId: classId,
          studentId: effectiveStudentId,
          studentName,
          studentEmail,
          teacherId: candidateTeacher.id,
          teacherName: candidateTeacher.name,
          courseId: courseName.toLowerCase().replace(/\s+/g, '-'),
          courseTitle: `${courseName} (${program})`,
          scheduledAt,
          date: targetDate,
          time: targetTime.includes('IST') ? targetTime : `${targetTime} IST`,
          durationMinutes: 30,
          duration: 30,
          status: 'scheduled',
          isTrial: true,
          trialId: bookingId,
          roomId: channelName,
          meetingUrl: channelName,
          agoraChannelName: channelName,
          agoraAppId: process.env.AGORA_APP_ID || 'agora-saremi-prod',
          topic: `1:1 Live Demo Evaluation: ${courseName}`,
          sessionType: 'trial',
          createdAt: (classSnap.exists() && classSnap.data()?.createdAt) || now,
          updatedAt: now,
          autoAssigned: true,
          autoAssignmentReason: matchResult.reason
        };
        (session as any).studentPhone = studentPhone;

        finalSession = session;
        const cleanSession = sanitizeFirestorePayload(session);

        // Transaction write to /classes and /live_classes
        transaction.set(classDocRef, cleanSession, { merge: true });
        transaction.set(liveClassDocRef, cleanSession, { merge: true });

        // Transaction write to /trial_bookings
        const trialUpdateData = {
          id: bookingId,
          studentName,
          studentId: effectiveStudentId,
          email: studentEmail,
          phone: studentPhone,
          courseName,
          discipline: courseName,
          teacherId: candidateTeacher.id,
          teacherName: candidateTeacher.name,
          date: targetDate,
          time: targetTime,
          preferredDate,
          preferredTime,
          proposedDate: targetDate,
          proposedStartTime: targetTime,
          status: 'slot_proposed' as const,
          assignmentStatus: 'slot_proposed' as const,
          roomId: channelName,
          meetingUrl: channelName,
          classId,
          autoAssigned: true,
          needsAdminAttention: false,
          rescheduleRequested: false,
          updatedAt: now,
          createdAt: (trialSnap.exists() && trialSnap.data()?.createdAt) || now,
          bookingCreatedAt: (trialSnap.exists() && trialSnap.data()?.bookingCreatedAt) || now
        };

        transaction.set(trialRef, trialUpdateData, { merge: true });
      } else {
        // Fallback: Flag for Admin Attention Required
        transactionAssigned = false;
        finalReason = finalReason || matchResult.reason;

        const unassignedData = {
          id: bookingId,
          studentName,
          studentId: effectiveStudentId,
          email: studentEmail,
          phone: studentPhone,
          courseName,
          discipline: courseName,
          preferredDate,
          preferredTime,
          date: targetDate,
          time: targetTime,
          status: 'unassigned' as const,
          assignmentStatus: 'unassigned' as const,
          needsAdminAttention: true,
          attentionReason: finalReason,
          rescheduleRequested: false,
          unassignedAt: now,
          updatedAt: now,
          createdAt: (trialSnap.exists() && trialSnap.data()?.createdAt) || now,
          bookingCreatedAt: (trialSnap.exists() && trialSnap.data()?.bookingCreatedAt) || now
        };

        transaction.set(trialRef, unassignedData, { merge: true });
      }
    });

    // --- POST-TRANSACTION ASYNC SIDE EFFECTS (Notifications & Audit Logs) ---
    if (transactionAssigned && finalTeacher) {
      try {
        await dispatchNotification({
          userId: finalTeacher.id,
          recipientRole: 'teacher',
          recipientName: finalTeacher.name,
          recipientEmail: finalTeacher.email || '',
          recipientPhone: finalTeacher.phone || '',
          type: 'teacher_class_assigned',
          title: 'New Free Demo Assigned',
          message: `You have a new Free Demo trial assigned with prospective student ${studentName} for ${courseName} on ${targetDate} at ${targetTime} IST.`,
          link: '/teacher/schedule',
          channels: ['in_app']
        });
      } catch (nErr) {
        console.warn('Teacher notification dispatch notice:', nErr);
      }

      if (effectiveStudentId && effectiveStudentId !== 'prospective_student') {
        try {
          await dispatchNotification({
            userId: effectiveStudentId,
            recipientRole: 'student',
            recipientName: studentName,
            recipientEmail: studentEmail,
            recipientPhone: studentPhone,
            type: 'demo_booking_confirmation',
            title: 'Free Demo Slot Available',
            message: `Your Free Demo slot for ${courseName} with Guru ${finalTeacher.name} is ready for ${targetDate} at ${targetTime} IST. Confirm your slot in the portal to finalize.`,
            link: '/app/classes',
            channels: ['in_app']
          });
        } catch (nErr) {
          console.warn('Student notification dispatch notice:', nErr);
        }
      }

      recordAuditLog(
        { id: 'system_engine', name: 'Saremi Smart Scheduling Engine', role: 'system' },
        'trial_auto_assigned',
        'class',
        bookingId,
        `Auto-assigned ${finalTeacher.name} to ${studentName} for demo (${courseName}) at ${targetDate} ${targetTime}`
      );

      return {
        assigned: true,
        teacher: finalTeacher,
        classSession: finalSession,
        reason: matchResult.reason
      };
    } else {
      try {
        await dispatchNotification({
          userId: 'admin',
          recipientRole: 'admin',
          recipientName: 'Administrator',
          type: 'admin_new_demo_booking',
          title: 'Action Required: Unassigned Free Demo',
          message: `Free Demo booking for ${studentName} (${courseName}) requires manual faculty allocation: ${finalReason}`,
          link: '/admin/trials',
          channels: ['in_app']
        });
      } catch (nErr) {
        console.warn('Admin notification dispatch notice:', nErr);
      }

      return {
        assigned: false,
        reason: finalReason
      };
    }
  } catch (err: any) {
    console.error('Free demo transaction scheduling error:', err);

    // Fallback to server endpoint if client-side transaction hits permission or network restrictions
    try {
      const resp = await fetch('/api/trials/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (resp.ok) {
        const resData = await resp.json();
        return {
          assigned: Boolean(resData.assigned),
          teacher: resData.teacher ? { id: resData.teacher.id, name: resData.teacher.name } as any : undefined,
          reason: resData.reason || 'Server-side scheduling executed successfully'
        };
      }
    } catch (serverErr) {
      console.warn('Server auto-schedule fallback notice:', serverErr);
    }

    return {
      assigned: false,
      reason: `Transaction error: ${err.message || 'Scheduling failed'}`
    };
  }
}

/**
 * Automates teacher assignment & session provisioning for Free Demo requests
 * Delegates directly to the transactional engine.
 */
export async function autoAssignAndProvisionDemo(params: {
  bookingId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  studentId?: string;
  courseName: string;
  program?: string;
  preferredDate?: string;
  preferredTime?: string;
  learningGoal?: string;
}): Promise<{
  assigned: boolean;
  teacher?: TeacherProfile;
  classSession?: ClassSession;
  reason: string;
}> {
  // Primary execution: Call secure server endpoint using Firebase Admin SDK
  try {
    const resp = await fetch('/api/trials/auto-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (resp.ok) {
      const resData = await resp.json();
      return {
        assigned: Boolean(resData.assigned),
        teacher: resData.teacher ? { id: resData.teacher.id, name: resData.teacher.name } as any : undefined,
        reason: resData.reason || 'Server-side scheduling executed successfully'
      };
    }
  } catch (serverErr) {
    console.warn('Server auto-schedule primary notice, falling back to client transaction:', serverErr);
  }

  // Fallback execution: Client-side transaction
  return scheduleDemoWithTransaction(params);
}
