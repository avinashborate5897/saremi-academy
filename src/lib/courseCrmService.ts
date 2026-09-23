import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Lead,
  LeadStatus,
  LeadNote,
  TrialBookingRecord,
  TrialAssessment,
  CourseLevel,
  EnrollmentRecord,
  Course,
  TeacherProfile,
  ClassSession,
  UserProfile
} from '../types';
import { COURSES_DATA, TEACHERS_DATA } from '../data/coursesData';
import { triggerTransactionalNotification } from './firestoreService';
import { dispatchNotification } from './notificationService';

/**
 * =============================================================
 * LEADS & CRM PIPELINE
 * =============================================================
 */

export async function createLeadInFirestore(lead: Omit<Lead, 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const path = `leads/${lead.id}`;
  const now = new Date().toISOString();
  const fullLead: Lead = {
    ...lead,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'leads', lead.id), fullLead);
    return fullLead;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return fullLead;
  }
}

export function subscribeToLeads(
  onSuccess: (leads: Lead[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'leads';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const leads = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));
        leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onSuccess(leads);
      } else {
        onSuccess([]);
      }
    },
    (error) => {
      console.warn('Real-time leads listener notice:', error.message);
      if (onError) onError(error);
      onSuccess([]);
    }
  );
  return unsubscribe;
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  noteText?: string,
  authorName: string = 'Staff Counselor'
): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    if (noteText) {
      await addLeadNote(leadId, `Status transitioned to "${newStatus}". ${noteText}`, authorName);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addLeadNote(
  leadId: string,
  content: string,
  authorName: string = 'Admissions Officer'
): Promise<LeadNote> {
  const noteId = `note-${Date.now()}`;
  const path = `lead_notes/${noteId}`;
  const note: LeadNote = {
    id: noteId,
    leadId,
    authorName,
    content,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'lead_notes', noteId), note);
    return note;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return note;
  }
}

export function subscribeToLeadNotes(
  leadId: string,
  onSuccess: (notes: LeadNote[]) => void
): () => void {
  const path = 'lead_notes';
  const q = query(collection(db, path), where('leadId', '==', leadId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LeadNote));
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(notes);
    },
    (err) => {
      console.warn('Lead notes subscription notice:', err.message);
      onSuccess([]);
    }
  );
  return unsubscribe;
}

/**
 * =============================================================
 * FREE TRIAL BOOKINGS
 * =============================================================
 */

export async function submitFreeTrialBooking(
  booking: Omit<TrialBookingRecord, 'id' | 'createdAt' | 'status'>
): Promise<TrialBookingRecord> {
  const bookingId = `tb-${Date.now()}`;
  const path = `trial_bookings/${bookingId}`;
  const now = new Date().toISOString();

  const record: TrialBookingRecord = {
    ...booking,
    id: bookingId,
    status: 'scheduled',
    meetingUrl: `saremi-studio-${bookingId}`,
    createdAt: now
  };

  try {
    // 1. Create Trial Booking in Firestore
    await setDoc(doc(db, 'trial_bookings', bookingId), record);

    // 2. Also register / sync into CRM leads pipeline as "Trial Scheduled"
    const leadId = booking.leadId || `lead-${Date.now()}`;
    await createLeadInFirestore({
      id: leadId,
      student_name: booking.studentName,
      parent_name: booking.parentName || '',
      phone: booking.phone,
      email: booking.email,
      age: booking.age,
      course: booking.courseName,
      course_id: booking.courseId,
      level: booking.level,
      teacher: booking.teacherName || 'Assigned Guru',
      teacher_id: booking.teacherId || '',
      preferred_date: booking.date,
      preferred_time: booking.time,
      timezone: booking.timezone,
      learning_goal: booking.learningGoal || '',
      status: 'Trial Scheduled',
      source: 'Free Trial Funnel',
      notes: `Booked 1:1 Diagnostic for ${booking.courseName} on ${booking.date} at ${booking.time} (${booking.timezone})`
    });

    // 3. Dispatch automated confirmation email
    await triggerTransactionalNotification({
      id: `email-${Date.now()}`,
      recipientEmail: booking.email,
      recipientName: booking.studentName,
      subject: `Trial Lesson Confirmed: ${booking.courseName} with Saremi Academy`,
      type: 'trial_booking_confirmation',
      sentAt: now,
      content: `Namaste ${booking.studentName},\n\nYour complimentary 1:1 Diagnostic Trial Lesson has been booked:\n\nCourse: ${booking.courseName}\nLevel: ${booking.level}\nTeacher: ${booking.teacherName || 'Assigned Maestro'}\nSlot: ${booking.date} at ${booking.time} (${booking.timezone})\n\nLive Classroom Studio: Saremi In-App Agora Live Studio (Access directly from your Student Sanctuary)\n\nWarm regards,\nSaremi Academy Admissions Desk`
    });

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return record;
  }
}

export function subscribeToTrialBookings(
  onSuccess: (trials: TrialBookingRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'trial_bookings';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TrialBookingRecord));
      records.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onSuccess(records);
    },
    (err) => {
      console.warn('Trial bookings subscriber notice:', err.message);
      if (onError) onError(err);
      onSuccess([]);
    }
  );
  return unsubscribe;
}

/**
 * Subscribes to real-time trial bookings for a specific student (by UID or email)
 */
export function subscribeToStudentTrialBookings(
  studentIdOrSuccess: string | ((trials: TrialBookingRecord[]) => void),
  studentEmailOrSuccess?: string | ((trials: TrialBookingRecord[]) => void),
  onSuccessCb?: (trials: TrialBookingRecord[]) => void
): () => void {
  let studentId = '';
  let studentEmail = '';
  let onSuccess: (trials: TrialBookingRecord[]) => void = () => {};

  if (typeof studentIdOrSuccess === 'function') {
    onSuccess = studentIdOrSuccess;
  } else {
    studentId = (studentIdOrSuccess || '').trim();
    if (typeof studentEmailOrSuccess === 'function') {
      onSuccess = studentEmailOrSuccess;
    } else {
      studentEmail = (studentEmailOrSuccess || '').trim();
      if (onSuccessCb) onSuccess = onSuccessCb;
    }
  }

  if (!studentId && !studentEmail) {
    onSuccess([]);
    return () => {};
  }

  const idLower = studentId.toLowerCase();
  const emailLower = studentEmail.toLowerCase();

  return subscribeToTrialBookings((allTrials) => {
    const studentTrials = allTrials.filter((t) => {
      const matchId = studentId && (t.studentId === studentId || t.userId === studentId || (t.studentId && t.studentId.toLowerCase() === idLower));
      const matchEmail = studentEmail && (
        (t.email && t.email.toLowerCase().trim() === emailLower) ||
        (t.studentEmail && t.studentEmail.toLowerCase().trim() === emailLower)
      );
      return Boolean(matchId || matchEmail);
    });
    onSuccess(studentTrials);
  });
}

/**
 * Confirms a proposed slot for a Free Demo booking (by student or admin)
 */
export async function confirmTrialBookingSlot(params: {
  bookingId: string;
  confirmedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { bookingId, confirmedBy } = params;
  const now = new Date().toISOString();
  const trialRef = doc(db, 'trial_bookings', bookingId);
  const cleanBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const classId = `cls_trial_${cleanBookingId}`;

  try {
    let trial: TrialBookingRecord | null = null;
    try {
      const trialSnap = await getDoc(trialRef);
      if (trialSnap.exists()) {
        trial = trialSnap.data() as TrialBookingRecord;
      }
    } catch (readErr) {
      console.warn('Direct trial read notice:', readErr);
    }

    // 1. Update trial_bookings doc to confirmed
    const trialUpdateData: any = {
      status: 'confirmed',
      assignmentStatus: 'confirmed',
      confirmedAt: now,
      confirmedBy: confirmedBy || trial?.studentId || 'student',
      rescheduleRequested: false,
      updatedAt: now
    };

    await setDoc(trialRef, trialUpdateData, { merge: true });

    // 2. Ensure class session in 'classes' is scheduled & live-ready
    const channelName = trial?.roomId || `saremi_trial_${cleanBookingId}`;
    const targetDate = trial?.proposedDate || trial?.date || new Date().toISOString().split('T')[0];
    const targetTime = trial?.proposedStartTime || trial?.time || '18:00';
    const scheduledAt = targetDate.includes('T') ? targetDate : `${targetDate}T${targetTime.includes(':') ? targetTime : '18:00'}:00`;

    const cleanClassData = {
      id: classId,
      sessionId: classId,
      studentId: trial?.studentId || `std_trial_${cleanBookingId}`,
      studentName: trial?.studentName || 'Student',
      studentEmail: trial?.email || trial?.studentEmail || '',
      studentPhone: trial?.phone || trial?.studentPhone || '',
      teacherId: trial?.teacherId || 'faculty_mentor',
      teacherName: trial?.teacherName || 'Assigned Guru',
      courseId: trial?.courseId || 'course_trial',
      courseTitle: trial?.courseName ? `${trial.courseName} (1:1 Free Demo)` : '1:1 Free Demo',
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
      topic: `1:1 Live Demo: ${trial?.courseName || 'Music Demo'}`,
      sessionType: 'trial',
      updatedAt: now
    };

    try {
      await setDoc(doc(db, 'classes', classId), cleanClassData, { merge: true });
      await setDoc(doc(db, 'live_classes', classId), cleanClassData, { merge: true });
    } catch (clsErr) {
      console.warn('Non-blocking class session provision notice:', clsErr);
    }

    // 3. Dispatch in-app notification to Teacher
    if (trial?.teacherId) {
      try {
        await dispatchNotification({
          userId: trial.teacherId,
          recipientRole: 'teacher',
          recipientName: trial.teacherName,
          type: 'teacher_class_assigned',
          title: 'Free Demo Confirmed by Student',
          message: `${trial.studentName} has confirmed their Free Demo for ${trial.courseName} on ${targetDate} at ${targetTime} IST.`,
          link: '/teacher/schedule',
          channels: ['in_app']
        });
      } catch (nErr) {
        console.warn('Teacher notification dispatch notice:', nErr);
      }
    }

    // 4. Dispatch in-app notification to Student
    if (trial?.studentId && trial.studentId !== 'prospective_student') {
      try {
        await dispatchNotification({
          userId: trial.studentId,
          recipientRole: 'student',
          recipientName: trial.studentName,
          type: 'demo_booking_confirmation',
          title: 'Free Demo Slot Confirmed',
          message: `Your Free Demo with Guru ${trial.teacherName || 'Faculty Mentor'} is confirmed for ${targetDate} at ${targetTime} IST. Join live from your portal at class time!`,
          link: '/app/classes',
          channels: ['in_app']
        });
      } catch (nErr) {
        console.warn('Student notification dispatch notice:', nErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to confirm trial booking slot:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Requests a reschedule for a Free Demo booking
 */
export async function requestTrialReschedule(params: {
  bookingId: string;
  reason?: string;
  requestedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { bookingId, reason = 'Student requested reschedule', requestedBy } = params;
  const now = new Date().toISOString();
  const trialRef = doc(db, 'trial_bookings', bookingId);
  const cleanBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const classId = `cls_trial_${cleanBookingId}`;

  try {
    const trialSnap = await getDoc(trialRef);
    if (!trialSnap.exists()) {
      return { success: false, error: 'Trial booking not found' };
    }
    const trial = trialSnap.data() as TrialBookingRecord;

    // 1. Update trial_bookings document
    await updateDoc(trialRef, {
      status: 'reschedule_requested',
      rescheduleRequested: true,
      rescheduleReason: reason,
      needsAdminAttention: true,
      attentionReason: `Reschedule requested by student: ${reason}`,
      updatedAt: now
    });

    // 2. Update class session if exists
    try {
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        await updateDoc(classRef, {
          status: 'rescheduled',
          rescheduleReason: reason,
          updatedAt: now
        });
      }
    } catch {
      // non-blocking
    }

    // 3. Dispatch notification to Admin
    await dispatchNotification({
      userId: 'admin',
      recipientRole: 'admin',
      recipientName: 'Administrator',
      type: 'admin_booking_changed',
      title: 'Free Demo Reschedule Requested',
      message: `${trial.studentName} requested to reschedule their Free Demo for ${trial.courseName}. Reason: ${reason}`,
      link: '/admin/trials',
      channels: ['in_app']
    });

    // 4. Dispatch notification to Teacher
    if (trial.teacherId) {
      await dispatchNotification({
        userId: trial.teacherId,
        recipientRole: 'teacher',
        recipientName: trial.teacherName,
        type: 'teacher_class_rescheduled',
        title: 'Free Demo Rescheduled',
        message: `Student ${trial.studentName} has requested a reschedule for their Free Demo (${trial.courseName}). Our team will assign a revised slot.`,
        link: '/teacher/schedule',
        channels: ['in_app']
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to request trial reschedule:', err);
    return { success: false, error: err.message };
  }
}

export async function assignTeacherAndScheduleTrial(params: {
  trialId: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  studentId?: string;
}): Promise<void> {
  const { trialId, teacherId, teacherName, date, time } = params;
  const now = new Date().toISOString();

  // Validate that teacher has a verified account in /users
  const teacherUserSnap = await getDoc(doc(db, 'users', teacherId));
  if (!teacherUserSnap.exists()) {
    throw new Error(`Cannot assign teacher: No account found in users database for ID "${teacherId}".`);
  }
  const teacherUserData = teacherUserSnap.data();
  if (teacherUserData.role !== 'teacher' || teacherUserData.status === 'inactive' || teacherUserData.status === 'banned') {
    throw new Error(`Cannot assign teacher: Account "${teacherId}" is not an active verified faculty mentor.`);
  }

  // 1. Fetch current trial booking
  const trialRef = doc(db, 'trial_bookings', trialId);
  const trialSnap = await getDoc(trialRef);
  if (!trialSnap.exists()) {
    throw new Error('Trial booking not found');
  }
  const trial = trialSnap.data() as TrialBookingRecord;

  const effectiveStudentId = trial.studentId || trial.userId || params.studentId || `std_trial_${trialId}`;
  const roomId = `saremi_trial_${trialId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // 2. Update trial booking
  await updateDoc(trialRef, {
    teacherId,
    teacherName,
    date,
    time,
    status: 'scheduled',
    roomId,
    meetingUrl: roomId,
    studentId: effectiveStudentId,
    updatedAt: now
  });

  // 3. Create / update class session in 'classes' and 'live_classes'
  const classId = `cls_trial_${trialId}`;
  const scheduledAt = date.includes('T') ? date : `${date}T${time.includes(':') ? time : '18:00'}:00`;

  const classSession: ClassSession = {
    id: classId,
    studentId: effectiveStudentId,
    studentName: trial.studentName,
    teacherId,
    teacherName,
    courseId: trial.courseId || 'course_vocal_hindustani',
    courseTitle: trial.courseName || 'Classical Music Diagnostic',
    scheduledAt,
    durationMinutes: 30,
    status: 'scheduled',
    roomId,
    meetingUrl: roomId,
    agoraChannelName: roomId,
    agoraAppId: process.env.AGORA_APP_ID || 'agora-saremi-prod',
    topic: `1:1 Diagnostic Trial Class: ${trial.courseName}`,
    date,
    time: time.includes('IST') ? time : `${time} IST`,
    isTrial: true,
    trialId,
    studentEmail: trial.email
  };

  await setDoc(doc(db, 'classes', classId), classSession, { merge: true });
  await setDoc(doc(db, 'live_classes', classId), classSession, { merge: true });

  // 4. Update lead status in CRM if linked lead exists
  try {
    const leadsQuery = query(collection(db, 'leads'), where('email', '==', trial.email));
    const leadSnaps = await getDocs(leadsQuery);
    leadSnaps.forEach(async (d) => {
      await updateLeadStatus(
        d.id,
        'Trial Scheduled',
        `Scheduled with ${teacherName} on ${date} at ${time} IST`
      );
    });
  } catch {
    // non-blocking
  }

  // 5. Update student profile if registered in users
  if (effectiveStudentId) {
    try {
      const userRef = doc(db, 'users', effectiveStudentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const enrolledCourses = userData.enrolledCourses || [];
        const existingIdx = enrolledCourses.findIndex(c => c.courseId === (trial.courseId || 'trial'));
        const trialCourseItem = {
          courseId: trial.courseId || 'course_trial',
          courseTitle: trial.courseName,
          instrument: 'vocals' as const,
          enrolledAt: now,
          level: 'Foundation' as const,
          sessionsCompleted: 0,
          totalSessions: 1,
          sessionsRemaining: 1,
          teacherId,
          teacherName,
          nextSessionDate: date,
          nextSessionTime: time.includes('IST') ? time : `${time} IST`,
          nextSessionId: classId,
          roomId,
          status: 'active' as const,
          packageName: '1:1 Diagnostic Trial'
        };

        if (existingIdx >= 0) {
          enrolledCourses[existingIdx] = { ...enrolledCourses[existingIdx], ...trialCourseItem };
        } else {
          enrolledCourses.unshift(trialCourseItem);
        }

        await updateDoc(userRef, {
          enrolledCourses,
          updatedAt: now
        });
      }
    } catch {
      // non-blocking
    }
  }

  // 6. Notify student of confirmed schedule
  await triggerTransactionalNotification({
    id: `email-sched-${Date.now()}`,
    recipientEmail: trial.email,
    recipientName: trial.studentName,
    subject: `Your 1:1 Trial Class is Confirmed with ${teacherName}`,
    type: 'trial_booking_confirmation',
    sentAt: now,
    content: `Namaste ${trial.studentName},\n\nYour 1:1 Diagnostic Trial Class has been scheduled:\n\nCourse: ${trial.courseName}\nFaculty Guru: ${teacherName}\nDate: ${date}\nTime: ${time} IST\n\nLive Studio Access: You can join the session directly from your Saremi Student Portal at class time.\n\nWarm regards,\nSaremi Academy Admissions Team`
  });
}

export async function completeTrialWithAssessment(params: {
  trialId: string;
  teacherId: string;
  teacherName: string;
  notes: string;
  recommendation: string;
  decision?: 'PASSED' | 'NEEDS_PREPARATION';
  recommendedLevel?: CourseLevel;
  recommendedPackageId?: string;
  recommendedPackageName?: string;
  attendance?: 'Present' | 'Absent';
  scores?: {
    pitchAccuracy?: number;
    rhythmSense?: number;
    earGrasping?: number;
    vocalFlexibility?: number;
    overallScore?: number;
  };
}): Promise<TrialAssessment> {
  const { trialId, teacherId, teacherName, notes, recommendation } = params;
  const now = new Date().toISOString();

  // 1. Fetch trial booking
  const trialRef = doc(db, 'trial_bookings', trialId);
  const trialSnap = await getDoc(trialRef);
  const trial = trialSnap.exists() ? (trialSnap.data() as TrialBookingRecord) : null;

  const studentId = trial?.studentId || trial?.userId || `std_trial_${trialId}`;
  const studentName = trial?.studentName || 'Student';
  const studentEmail = trial?.email || '';

  const isPassed = params.decision ? params.decision === 'PASSED' : (params.attendance !== 'Absent');
  const decisionText = isPassed ? 'PASSED' : 'NEEDS_PREPARATION';

  // 2. Save Trial Assessment Record
  const assessmentId = `ta-${Date.now()}`;
  const assessment: TrialAssessment = {
    id: assessmentId,
    trialId,
    studentId,
    studentName,
    studentEmail,
    teacherId,
    teacherName,
    courseName: trial?.courseName || 'Diagnostic Classical Trial',
    conductedAt: now,
    pitchAccuracy: params.scores?.pitchAccuracy ?? 8,
    rhythmSense: params.scores?.rhythmSense ?? 8,
    earGrasping: params.scores?.earGrasping ?? 8,
    vocalFlexibility: params.scores?.vocalFlexibility ?? 8,
    overallScore: params.scores?.overallScore ?? 8,
    strengths: ['Tonal grounding', 'Rhythmic responsiveness'],
    areasOfGrowth: ['Mandra Saptak (lower octave) resonance', 'Breath control in long swars'],
    teacherFeedback: `${notes}${recommendation ? `\n\nFaculty Recommendation: ${recommendation}` : ''}`,
    recommendedLevel: params.recommendedLevel || 'Foundation',
    recommendedPackageId: params.recommendedPackageId || 'pkg-3month-term',
    recommendedPackageName: params.recommendedPackageName || '3-Month Level Certification Term (24 Classes)',
    decision: decisionText,
    isPurchaseEligible: isPassed,
    trialPassed: isPassed,
    createdAt: now
  } as any;

  await setDoc(doc(db, 'trial_assessments', assessmentId), assessment);

  // 3. Mark trial booking as completed with pass status
  if (trialSnap.exists()) {
    await updateDoc(trialRef, {
      status: 'completed',
      decision: decisionText,
      isPurchaseEligible: isPassed,
      trialPassed: isPassed,
      feedback: notes,
      recommendation,
      assessmentId,
      assessment,
      updatedAt: now
    });
  }

  // 4. Mark class session as completed
  const classId = `cls_trial_${trialId}`;
  const updateClassData = {
    status: 'completed' as const,
    attendanceMarked: true,
    attendanceStatus: params.attendance || 'Present',
    lessonNotes: notes,
    teacherFeedback: recommendation,
    actualEndTime: now
  };
  await updateDoc(doc(db, 'classes', classId), updateClassData).catch(() => {});
  await updateDoc(doc(db, 'live_classes', classId), updateClassData).catch(() => {});

  // 5. Synchronize student profile so purchase eligibility and recommendations appear immediately
  if (studentId) {
    try {
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          trialCompleted: true,
          trialPassed: isPassed,
          isPurchaseEligible: isPassed,
          demoStatus: isPassed ? 'passed' : 'needs_prep',
          trialAssessment: assessment,
          trialRecommendation: recommendation,
          recommendedLevel: params.recommendedLevel || 'Foundation',
          recommendedPackage: params.recommendedPackageName || '3-Month Level Certification Term (24 Classes)',
          recommendedPackageId: params.recommendedPackageId || 'pkg-3month-term',
          updatedAt: now
        });
      }
    } catch {
      // non-blocking
    }
  }

  // 6. Automated real-time notifications
  if (studentId && isPassed) {
    await dispatchNotification({
      userId: studentId,
      recipientRole: 'student',
      recipientName: studentName,
      recipientEmail: studentEmail,
      type: 'admin_announcement',
      title: '🎉 Diagnostic Demo Passed!',
      message: `Guru ${teacherName} evaluated your demo session. You are now eligible to enroll in ${params.recommendedPackageName || 'your recommended course'}.`,
      link: '/app'
    }).catch(() => {});
  }

  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    type: 'admin_announcement',
    title: isPassed ? 'Demo Assessment Passed — Student Eligible' : 'Demo Assessment Completed',
    message: `${studentName} ${isPassed ? 'passed' : 'completed'} 1:1 demo with Guru ${teacherName}. Recommended: ${params.recommendedPackageName || 'Foundation Term'}.`,
    link: '/admin/trials'
  }).catch(() => {});

  // 7. Update CRM lead status to 'Completed'
  if (studentEmail) {
    try {
      const leadsQuery = query(collection(db, 'leads'), where('email', '==', studentEmail));
      const leadSnaps = await getDocs(leadsQuery);
      leadSnaps.forEach(async (d) => {
        await updateLeadStatus(
          d.id,
          'Trial Completed',
          `Trial completed by ${teacherName}. Notes: ${notes}. Decision: ${decisionText}. Recommendation: ${recommendation}`
        );
      });
    } catch {
      // non-blocking
    }
  }

  return assessment;
}

export async function connectStudentIdentityToTrial(
  email: string,
  studentId: string,
  studentName?: string,
  studentPhone?: string
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !studentId) return;

  try {
    // 1. Find all trial bookings for this email
    const q = query(collection(db, 'trial_bookings'), where('email', '==', cleanEmail));
    const snapshot = await getDocs(q);

    for (const d of snapshot.docs) {
      const trialData = d.data() as TrialBookingRecord;
      if (trialData.studentId !== studentId || trialData.userId !== studentId) {
        await updateDoc(doc(db, 'trial_bookings', d.id), {
          studentId,
          userId: studentId,
          ...(studentName && { studentName }),
          ...(studentPhone && { phone: studentPhone }),
          updatedAt: new Date().toISOString()
        });

        // Also update corresponding class sessions
        const classId = `cls_trial_${d.id}`;
        await updateDoc(doc(db, 'classes', classId), {
          studentId,
          ...(studentName && { studentName })
        }).catch(() => {});
        await updateDoc(doc(db, 'live_classes', classId), {
          studentId,
          ...(studentName && { studentName })
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Notice connecting student identity to trial:', err);
  }
}

/**
 * =============================================================
 * ENROLLMENTS
 * =============================================================
 */

export async function createEnrollmentInFirestore(
  enrollment: Omit<EnrollmentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EnrollmentRecord> {
  const enrollmentId = `enr-${Date.now()}`;
  const path = `enrollments/${enrollmentId}`;
  const now = new Date().toISOString();

  const record: EnrollmentRecord = {
    ...enrollment,
    id: enrollmentId,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'enrollments', enrollmentId), record);

    // If an associated lead exists with this email, automatically transition to "Enrolled"
    try {
      const leadsQuery = query(collection(db, 'leads'), where('email', '==', enrollment.studentEmail));
      const leadSnaps = await getDocs(leadsQuery);
      leadSnaps.forEach(async (d) => {
        await updateLeadStatus(d.id, 'Enrolled', `Converted to enrolled student under package: ${enrollment.packageName}`);
      });
    } catch {
      // non-blocking
    }

    // Trigger transactional enrollment confirmation
    await triggerTransactionalNotification({
      id: `email-${Date.now()}`,
      recipientEmail: enrollment.studentEmail,
      recipientName: enrollment.studentName,
      subject: `Welcome to Saremi Conservatory: ${enrollment.courseName}`,
      type: 'order_confirmation',
      sentAt: now,
      content: `Namaste ${enrollment.studentName},\n\nCongratulations on beginning your classical journey!\n\nEnrolled Course: ${enrollment.courseName}\nPackage: ${enrollment.packageName} (${enrollment.classesTotal} sessions)\nAssigned Mentor: ${enrollment.teacherName}\nSchedule: ${enrollment.scheduleSummary}\n\nYou can access your class schedule, practice tools, and video feedback anytime in your Student Sanctuary.\n\nWarmly,\nSaremi Conservatory Academic Directorate`
    });

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return record;
  }
}

export function subscribeToStudentEnrollments(
  studentUidOrEmailOrCb: string | ((enrollments: EnrollmentRecord[]) => void),
  studentEmailOrCb?: string | ((enrollments: EnrollmentRecord[]) => void),
  onSuccessCb?: (enrollments: EnrollmentRecord[]) => void
): () => void {
  let studentUid = '';
  let studentEmail = '';
  let onSuccess: (enrollments: EnrollmentRecord[]) => void = () => {};

  if (typeof studentUidOrEmailOrCb === 'function') {
    onSuccess = studentUidOrEmailOrCb;
  } else {
    const val1 = (studentUidOrEmailOrCb || '').trim();
    if (val1.includes('@')) {
      studentEmail = val1;
    } else {
      studentUid = val1;
    }

    if (typeof studentEmailOrCb === 'function') {
      onSuccess = studentEmailOrCb;
    } else if (typeof studentEmailOrCb === 'string') {
      const val2 = studentEmailOrCb.trim();
      if (val2.includes('@')) {
        studentEmail = val2;
      } else if (!studentUid) {
        studentUid = val2;
      }
      if (typeof onSuccessCb === 'function') {
        onSuccess = onSuccessCb;
      }
    }
  }

  const safeNotify = (records: EnrollmentRecord[]) => {
    if (typeof onSuccess === 'function') {
      onSuccess(records);
    }
  };

  if (!studentUid && !studentEmail) {
    return subscribeToAllEnrollments(safeNotify);
  }

  return subscribeToAllEnrollments((all) => {
    const uidLower = studentUid.toLowerCase();
    const emailLower = studentEmail.toLowerCase();

    const filtered = all.filter((e) => {
      const matchUid = studentUid && (
        (e.studentId && e.studentId.toLowerCase() === uidLower) ||
        ((e as any).userId && (e as any).userId.toLowerCase() === uidLower)
      );
      const matchEmail = studentEmail && (
        (e.studentEmail && e.studentEmail.toLowerCase().trim() === emailLower) ||
        ((e as any).email && (e as any).email.toLowerCase().trim() === emailLower)
      );
      return Boolean(matchUid || matchEmail);
    });

    safeNotify(filtered);
  });
}

export function subscribeToAllEnrollments(
  onSuccess: (enrollments: EnrollmentRecord[]) => void
): () => void {
  const path = 'enrollments';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(records);
    },
    (err) => {
      console.warn('All enrollments subscriber notice:', err.message);
      onSuccess([]);
    }
  );
  return unsubscribe;
}
