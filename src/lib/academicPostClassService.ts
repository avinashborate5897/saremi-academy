import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  ClassSession, 
  AttendanceRecord, 
  Assignment, 
  SyllabusProgressRecord, 
  LessonNoteRecord,
  AuditLog
} from '../types';
import { COURSES_DATA } from '../data/coursesData';
import { sanitizeFirestorePayload } from './sessionService';

// ---------------------------------------------------------------------------
// Curriculum & Syllabus Extraction Helper
// ---------------------------------------------------------------------------

export interface CourseSyllabusPillar {
  pillar: string;
  title: string;
  topics: string[];
}

export interface SyllabusTopicStatus {
  topic: string;
  pillarTitle: string;
  status: 'completed' | 'in_progress' | 'revision' | 'practice_required' | 'upcoming';
  sessionId?: string;
  sessionDate?: string;
  teacherName?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface SyllabusProgressSummary {
  courseId: string;
  courseTitle: string;
  totalTopics: number;
  completedTopicsCount: number;
  inProgressTopicsCount: number;
  revisionRequiredCount: number;
  upcomingTopicsCount: number;
  percentageCompleted: number;
  pillars: Array<{
    pillarTitle: string;
    topics: SyllabusTopicStatus[];
  }>;
  recentRecords: SyllabusProgressRecord[];
}

function normalizeCurriculum(curr: any): CourseSyllabusPillar[] {
  if (!curr || !Array.isArray(curr) || curr.length === 0) {
    return [
      {
        pillar: 'Core Pedagogy & Foundations',
        title: 'Core Pedagogy & Foundations',
        topics: ['Pitch Calibration & Note Steadiness', 'Rhythm & Laya Control', 'Classical Compositions']
      }
    ];
  }

  // If array of strings:
  if (typeof curr[0] === 'string') {
    return [
      {
        pillar: 'Curriculum Topics',
        title: 'Curriculum Topics',
        topics: curr as string[]
      }
    ];
  }

  return curr.map((item: any) => ({
    pillar: item.pillar || item.title || 'Core Module',
    title: item.title || item.pillar || 'Core Module',
    topics: Array.isArray(item.topics) ? item.topics : []
  }));
}

/**
 * Retrieves the pedagogical syllabus pillars and topics for a given course.
 * Matches by ID, slug, or title, with an intelligent fallback.
 */
export function getCourseSyllabus(courseIdOrTitle?: string): CourseSyllabusPillar[] {
  if (!courseIdOrTitle) {
    return normalizeCurriculum(COURSES_DATA[0]?.curriculum);
  }

  const queryStr = courseIdOrTitle.toLowerCase().trim();

  // Try direct match
  const found = COURSES_DATA.find((c) => 
    c.id.toLowerCase() === queryStr ||
    c.slug.toLowerCase() === queryStr ||
    c.title.toLowerCase() === queryStr ||
    c.name.toLowerCase() === queryStr
  );

  if (found && found.curriculum && found.curriculum.length > 0) {
    return normalizeCurriculum(found.curriculum);
  }

  // Keyword-based fallback
  if (queryStr.includes('vocal') || queryStr.includes('sing') || queryStr.includes('hindustani')) {
    const vocal = COURSES_DATA.find((c) => c.id === 'c-hindustani-vocal');
    if (vocal?.curriculum) return normalizeCurriculum(vocal.curriculum);
  }
  if (queryStr.includes('piano') || queryStr.includes('keyboard')) {
    const piano = COURSES_DATA.find((c) => c.id === 'c-western-piano');
    if (piano?.curriculum) return normalizeCurriculum(piano.curriculum);
  }
  if (queryStr.includes('guitar')) {
    const guitar = COURSES_DATA.find((c) => c.id === 'c-acoustic-guitar');
    if (guitar?.curriculum) return normalizeCurriculum(guitar.curriculum);
  }
  if (queryStr.includes('tabla') || queryStr.includes('drum') || queryStr.includes('rhythm')) {
    const tabla = COURSES_DATA.find((c) => c.id === 'c-classical-tabla');
    if (tabla?.curriculum) return normalizeCurriculum(tabla.curriculum);
  }
  if (queryStr.includes('kid')) {
    const kids = COURSES_DATA.find((c) => c.id === 'c-kids-explorer');
    if (kids?.curriculum) return normalizeCurriculum(kids.curriculum);
  }

  return normalizeCurriculum(COURSES_DATA[0]?.curriculum);
}

/**
 * Flattens all topics for quick tagging and selection
 */
export function getAllSyllabusTopics(courseIdOrTitle?: string): string[] {
  const pillars = getCourseSyllabus(courseIdOrTitle);
  const topics: string[] = [];
  pillars.forEach((p) => {
    p.topics.forEach((t) => {
      if (!topics.includes(t)) topics.push(t);
    });
  });
  return topics;
}

// ---------------------------------------------------------------------------
// Post-Class Finalization Parameters & Types
// ---------------------------------------------------------------------------

export interface FinalizeSessionParams {
  sessionId: string;
  session: ClassSession;
  actor: {
    id: string;
    name: string;
    email?: string;
    role: 'teacher' | 'admin';
  };
  attendance: {
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    durationMinutes?: number;
    studentAttendedMinutes?: number;
  };
  academic: {
    whatWasTaught: string;
    topicsCovered: string[];
    syllabusTopics: Array<{
      topic: string;
      status: 'completed' | 'in_progress' | 'revision' | 'practice_required';
      pillarTitle?: string;
      notes?: string;
    }>;
  };
  notes: {
    lessonNotes: string;
    techniquesTaught?: string;
    mistakesNoticed?: string;
    nextLessonFocus?: string;
    teacherFeedback?: string;
  };
  homework?: {
    assigned: boolean;
    title: string;
    instructions: string;
    dueDate?: string;
  };
}

export interface FinalizeSessionResult {
  success: boolean;
  sessionId: string;
  attendanceId: string;
  noteId: string;
  homeworkId?: string;
  syllabusCount: number;
  message: string;
}

// Helper for deterministic topic slug
function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 40)
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ---------------------------------------------------------------------------
// Finalize Session Academic Workflow (Atomic, Idempotent)
// ---------------------------------------------------------------------------

export async function finalizeSessionAcademicWorkflow(
  params: FinalizeSessionParams
): Promise<FinalizeSessionResult> {
  const { sessionId, session, actor, attendance, academic, notes, homework } = params;

  if (!sessionId) {
    throw new Error('Valid sessionId is required to finalize academic records.');
  }
  if (!session) {
    throw new Error('Session details are required to finalize academic records.');
  }

  const now = new Date().toISOString();
  const studentId = session.studentId;
  const studentName = session.studentName || 'Enrolled Student';
  const teacherId = session.teacherId || actor.id;
  const teacherName = session.teacherName || actor.name;
  const courseId = session.courseId || 'singing';
  const courseTitle = session.courseTitle || session.topic || 'Classical Mentorship Course';
  const enrollmentId = session.enrollmentId || `enr_${studentId}_${courseId}`;
  const sessionDate = session.date || (session.scheduledAt ? session.scheduledAt.split('T')[0] : now.split('T')[0]);

  // Deterministic Document IDs to guarantee idempotency and avoid duplicates
  const attendanceId = `att_${sessionId}`;
  const noteId = `note_${sessionId}`;
  const homeworkId = `hw_${sessionId}`;

  const batch = writeBatch(db);

  // 1. Update the Class Session in `classes`
  const classRef = doc(db, 'classes', sessionId);
  const classUpdateData: Partial<ClassSession> & Record<string, any> = {
    status: 'completed',
    attendanceRecorded: true,
    attendanceMarked: true,
    attendanceStatus: attendance.status,
    actualDurationMinutes: attendance.durationMinutes || session.durationMinutes || 45,
    studentAttendanceDurationMinutes: attendance.studentAttendedMinutes || attendance.durationMinutes || session.durationMinutes || 45,
    whatWasTaught: academic.whatWasTaught,
    topicsCovered: academic.topicsCovered,
    syllabusTopics: academic.syllabusTopics,
    lessonNotes: notes.lessonNotes,
    teacherNotes: notes.lessonNotes,
    techniquesTaught: notes.techniquesTaught || '',
    mistakesNoticed: notes.mistakesNoticed || '',
    nextLessonFocus: notes.nextLessonFocus || '',
    teacherFeedback: notes.teacherFeedback || '',
    finalizedAt: now,
    finalizedBy: actor.id,
    updatedAt: now
  };

  if (homework && homework.assigned && homework.title.trim()) {
    classUpdateData.homeworkAssigned = `${homework.title.trim()}: ${homework.instructions.trim()}`;
  }

  batch.set(classRef, sanitizeFirestorePayload(classUpdateData), { merge: true });

  // 2. Mirror into `live_classes` safely if present
  try {
    const liveRef = doc(db, 'live_classes', sessionId);
    batch.set(liveRef, sanitizeFirestorePayload({
      ...classUpdateData,
      id: sessionId
    }), { merge: true });
  } catch (err) {
    console.warn('Mirror to live_classes failed safely:', err);
  }

  // 3. Write Attendance Record in `attendance_records` AND `attendance`
  const attendanceRecordData: AttendanceRecord & Record<string, any> = {
    id: attendanceId,
    classId: sessionId,
    sessionId: sessionId,
    studentId: studentId,
    studentName: studentName,
    teacherId: teacherId,
    teacherName: teacherName,
    courseId: courseId,
    courseTitle: courseTitle,
    enrollmentId: enrollmentId,
    date: sessionDate,
    status: attendance.status,
    whatWasTaught: academic.whatWasTaught,
    topicsCovered: academic.topicsCovered,
    lessonNotes: notes.lessonNotes,
    homeworkAssigned: homework?.assigned ? homework.title : '',
    recordedAt: now,
    recordedBy: actor.name,
    updatedAt: now,
    updatedBy: actor.name
  };

  const cleanAttendance = sanitizeFirestorePayload(attendanceRecordData);
  const attRecordsRef = doc(db, 'attendance_records', attendanceId);
  batch.set(attRecordsRef, cleanAttendance, { merge: true });

  const attLegacyRef = doc(db, 'attendance', attendanceId);
  batch.set(attLegacyRef, cleanAttendance, { merge: true });

  // 4. Write Lesson Note Record in `lesson_notes`
  const lessonNoteData: LessonNoteRecord = {
    id: noteId,
    sessionId: sessionId,
    enrollmentId: enrollmentId,
    studentId: studentId,
    studentName: studentName,
    teacherId: teacherId,
    teacherName: teacherName,
    courseId: courseId,
    courseTitle: courseTitle,
    whatWasTaught: academic.whatWasTaught,
    notes: notes.lessonNotes,
    techniquesTaught: notes.techniquesTaught || '',
    mistakesNoticed: notes.mistakesNoticed || '',
    nextLessonFocus: notes.nextLessonFocus || '',
    teacherFeedback: notes.teacherFeedback || '',
    homeworkSummary: homework?.assigned ? `${homework.title} (Due: ${homework.dueDate || 'Next Class'})` : '',
    sessionDate: sessionDate,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.name
  };

  const noteRef = doc(db, 'lesson_notes', noteId);
  batch.set(noteRef, sanitizeFirestorePayload(lessonNoteData), { merge: true });

  // 5. Write Syllabus Progress Records in `syllabus_progress`
  let syllabusCount = 0;
  for (const st of academic.syllabusTopics) {
    if (!st.topic || !st.topic.trim()) continue;
    const topicSlug = slugifyTopic(st.topic);
    const spId = `sp_${sessionId}_${topicSlug}`;
    const spRef = doc(db, 'syllabus_progress', spId);

    const spData: SyllabusProgressRecord = {
      id: spId,
      studentId: studentId,
      studentName: studentName,
      enrollmentId: enrollmentId,
      courseId: courseId,
      courseTitle: courseTitle,
      sessionId: sessionId,
      teacherId: teacherId,
      teacherName: teacherName,
      topic: st.topic.trim(),
      pillarTitle: st.pillarTitle || '',
      status: st.status || 'completed',
      notes: st.notes || '',
      sessionDate: sessionDate,
      recordedAt: now,
      updatedAt: now
    };

    batch.set(spRef, sanitizeFirestorePayload(spData), { merge: true });
    syllabusCount++;
  }

  // 6. Write Homework / Assignment in `assignments`
  let createdHomeworkId: string | undefined = undefined;
  if (homework && homework.assigned && homework.title.trim()) {
    createdHomeworkId = homeworkId;
    const hwRef = doc(db, 'assignments', homeworkId);
    const hwData: Assignment = {
      id: homeworkId,
      sessionId: sessionId,
      enrollmentId: enrollmentId,
      courseId: courseId,
      studentId: studentId,
      studentName: studentName,
      teacherId: teacherId,
      teacherName: teacherName,
      courseTitle: courseTitle,
      title: homework.title.trim(),
      description: homework.instructions.trim() || homework.title.trim(),
      instructions: homework.instructions.trim(),
      dueDate: homework.dueDate || sessionDate,
      assignedDate: sessionDate,
      status: 'assigned',
      createdAt: now,
      updatedAt: now
    };
    batch.set(hwRef, sanitizeFirestorePayload(hwData), { merge: true });
  }

  // 7. Record System Audit Log
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const auditRef = doc(db, 'audit_logs', auditId);
  const auditData: AuditLog = {
    id: auditId,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'SESSION_FINALIZED',
    entityType: 'class',
    entityId: sessionId,
    details: `Session #${session.sessionNumber || ''} finalized for ${studentName} (${courseTitle}): Attendance marked ${attendance.status}, ${syllabusCount} syllabus topics updated, lesson notes and homework recorded.`,
    metadata: {
      sessionId,
      studentId,
      enrollmentId,
      courseId,
      attendanceStatus: attendance.status,
      topicsCovered: academic.topicsCovered,
      hasHomework: Boolean(createdHomeworkId)
    },
    timestamp: now
  };
  batch.set(auditRef, sanitizeFirestorePayload(auditData));

  // 8. Commit All Operations Atomically
  await batch.commit();

  // 9. Post-commit: Update enrollment count safely & idempotently
  try {
    await updateEnrollmentCompletedSessions(enrollmentId, studentId, sessionId);
  } catch (err) {
    console.warn('Enrollment session counter sync safe notice:', err);
  }

  return {
    success: true,
    sessionId,
    attendanceId,
    noteId,
    homeworkId: createdHomeworkId,
    syllabusCount,
    message: `Academic records successfully finalized for ${studentName}.`
  };
}

/**
 * Safely and idempotently updates an enrollment's completed count by counting real completed sessions
 */
export async function updateEnrollmentCompletedSessions(enrollmentId: string, studentId: string, sessionId?: string) {
  if (!enrollmentId) return;

  try {
    // Check idempotency if sessionId provided
    if (sessionId) {
      const classRef = doc(db, 'classes', sessionId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const cData = classSnap.data();
        if (cData.creditDeducted) {
          console.log(`[Idempotency] Credit already deducted for session ${sessionId}. Skipping duplicate deduction.`);
          return;
        }
        // Mark credit as deducted in classes document
        await updateDoc(classRef, { creditDeducted: true, updatedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    const enrRef = doc(db, 'enrollments', enrollmentId);
    const enrSnap = await getDoc(enrRef);

    if (enrSnap.exists()) {
      const enrData = enrSnap.data();
      const currentCompleted = Number(enrData.classesCompleted || enrData.sessionsCompleted || 0);
      const totalSessions = Number(enrData.classesTotal || enrData.totalSessions || 12);
      const newCompleted = currentCompleted + 1;
      const newRemaining = Math.max(0, totalSessions - newCompleted);
      const newStatus = newRemaining === 0 ? 'completed' : 'active';

      await updateDoc(enrRef, {
        classesCompleted: newCompleted,
        sessionsCompleted: newCompleted,
        remainingSessions: newRemaining,
        creditsRemaining: newRemaining,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }

    // Also synchronize user profile enrolledCourses
    if (studentId) {
      try {
        const userRef = doc(db, 'users', studentId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data() as any;
          const courses = (uData.enrolledCourses || []).map((c: any) => {
            const comp = (c.sessionsCompleted || 0) + 1;
            const rem = Math.max(0, (c.totalSessions || 12) - comp);
            return {
              ...c,
              sessionsCompleted: comp,
              sessionsRemaining: rem,
              status: (rem === 0 ? 'completed' : rem <= 2 ? 'expiring_soon' : 'active')
            };
          });
          await updateDoc(userRef, { enrolledCourses: courses, updatedAt: new Date().toISOString() });
        }
      } catch (uErr) {
        console.warn('Sync to user profile enrolledCourses non-blocking notice:', uErr);
      }
    }
  } catch (err) {
    console.warn('Could not update enrollment completed sessions:', err);
  }
}

// ---------------------------------------------------------------------------
// Update Completed Session Attendance & Notes (Controlled Academic Edit)
// ---------------------------------------------------------------------------

export interface UpdateAttendanceParams {
  sessionId: string;
  actor: {
    id: string;
    name: string;
    email?: string;
    role: 'teacher' | 'admin';
  };
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  lessonNotes?: string;
  whatWasTaught?: string;
  reason?: string;
}

export async function updateCompletedSessionAttendance(
  params: UpdateAttendanceParams
): Promise<void> {
  const { sessionId, actor, status, lessonNotes, whatWasTaught, reason } = params;
  const now = new Date().toISOString();

  const classRef = doc(db, 'classes', sessionId);
  const attRef = doc(db, 'attendance_records', `att_${sessionId}`);
  const attLegacyRef = doc(db, 'attendance', `att_${sessionId}`);
  const noteRef = doc(db, 'lesson_notes', `note_${sessionId}`);

  const updateData: Record<string, any> = {
    attendanceStatus: status,
    updatedAt: now
  };
  if (lessonNotes !== undefined) {
    updateData.lessonNotes = lessonNotes;
    updateData.teacherNotes = lessonNotes;
  }
  if (whatWasTaught !== undefined) {
    updateData.whatWasTaught = whatWasTaught;
  }

  const batch = writeBatch(db);
  batch.set(classRef, updateData, { merge: true });
  batch.set(attRef, { status, updatedAt: now, updatedBy: actor.name }, { merge: true });
  batch.set(attLegacyRef, { status, updatedAt: now, updatedBy: actor.name }, { merge: true });

  if (lessonNotes !== undefined || whatWasTaught !== undefined) {
    const notePatch: Record<string, any> = { updatedAt: now };
    if (lessonNotes !== undefined) notePatch.notes = lessonNotes;
    if (whatWasTaught !== undefined) notePatch.whatWasTaught = whatWasTaught;
    batch.set(noteRef, notePatch, { merge: true });
  }

  // Audit trail
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const auditRef = doc(db, 'audit_logs', auditId);
  batch.set(auditRef, {
    id: auditId,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'ATTENDANCE_UPDATED',
    entityType: 'attendance',
    entityId: sessionId,
    details: `${actor.name} (${actor.role}) updated attendance for session ${sessionId} to "${status}". Reason: ${reason || 'Correction'}.`,
    metadata: { sessionId, newStatus: status, reason },
    timestamp: now
  } as AuditLog);

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Real-time Subscriptions for Student & Teacher Views
// ---------------------------------------------------------------------------

/**
 * Subscribes to historical completed classes for a student, optionally filtered by enrollmentId
 */
export function subscribeToStudentCompletedSessions(
  studentId: string,
  enrollmentId: string | undefined,
  onUpdate: (sessions: ClassSession[]) => void
): () => void {
  const q = query(
    collection(db, 'classes'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
      const completed = all.filter((s) => {
        const isComp = s.status === 'completed' || s.attendanceStatus === 'Present' || s.attendanceRecorded;
        const matchesEnr = !enrollmentId || s.enrollmentId === enrollmentId;
        return isComp && matchesEnr;
      });

      // Sort newest session first
      completed.sort((a, b) => 
        new Date(b.date || b.scheduledAt || 0).getTime() - new Date(a.date || a.scheduledAt || 0).getTime()
      );

      onUpdate(completed);
    },
    (err) => {
      console.warn('Student completed sessions subscriber notice:', err.message);
    }
  );
}

/**
 * Subscribes to real homework / riyaz assignments for a student
 */
export function subscribeToStudentHomework(
  studentId: string,
  enrollmentId: string | undefined,
  onUpdate: (assignments: Assignment[]) => void
): () => void {
  const q = query(
    collection(db, 'assignments'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
      const filtered = enrollmentId ? list.filter((a) => a.enrollmentId === enrollmentId) : list;
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(filtered);
    },
    (err) => {
      console.warn('Student homework subscriber notice:', err.message);
    }
  );
}

/**
 * Subscribes to historical syllabus progress records and computes a full curriculum progress summary
 */
export function subscribeToStudentSyllabusSummary(
  studentId: string,
  courseIdOrTitle: string | undefined,
  enrollmentId: string | undefined,
  onUpdate: (summary: SyllabusProgressSummary) => void
): () => void {
  const q = query(
    collection(db, 'syllabus_progress'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rawRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SyllabusProgressRecord));
      const records = enrollmentId ? rawRecords.filter((r) => r.enrollmentId === enrollmentId) : rawRecords;

      // Sort records by recordedAt desc
      records.sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime());

      // Get official course curriculum
      const pillars = getCourseSyllabus(courseIdOrTitle);
      let totalTopics = 0;
      let completedCount = 0;
      let inProgressCount = 0;
      let revisionCount = 0;

      // Group records by topic to find latest status
      const topicStatusMap = new Map<string, SyllabusProgressRecord>();
      records.forEach((r) => {
        const key = r.topic.trim().toLowerCase();
        if (!topicStatusMap.has(key)) {
          topicStatusMap.set(key, r);
        }
      });

      const structuredPillars = pillars.map((p) => {
        const pillarTopics: SyllabusTopicStatus[] = p.topics.map((t) => {
          totalTopics++;
          const rec = topicStatusMap.get(t.trim().toLowerCase());
          if (rec) {
            if (rec.status === 'completed') completedCount++;
            else if (rec.status === 'in_progress') inProgressCount++;
            else if (rec.status === 'revision' || rec.status === 'practice_required') revisionCount++;

            return {
              topic: t,
              pillarTitle: p.title,
              status: rec.status,
              sessionId: rec.sessionId,
              sessionDate: rec.sessionDate,
              teacherName: rec.teacherName,
              notes: rec.notes,
              lastUpdated: rec.recordedAt
            };
          }

          return {
            topic: t,
            pillarTitle: p.title,
            status: 'upcoming'
          };
        });

        return {
          pillarTitle: p.title,
          topics: pillarTopics
        };
      });

      const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

      onUpdate({
        courseId: courseIdOrTitle || 'singing',
        courseTitle: courseIdOrTitle || 'Hindustani Classical Vocal & Swara Mastery',
        totalTopics,
        completedTopicsCount: completedCount,
        inProgressTopicsCount: inProgressCount,
        revisionRequiredCount: revisionCount,
        upcomingTopicsCount: Math.max(0, totalTopics - completedCount - inProgressCount - revisionCount),
        percentageCompleted: Math.min(100, percentage),
        pillars: structuredPillars,
        recentRecords: records.slice(0, 15)
      });
    },
    (err) => {
      console.warn('Syllabus summary subscriber notice:', err.message);
    }
  );
}

/**
 * Updates an assignment's status (e.g., student marks 'in_progress' or 'submitted', teacher marks 'reviewed')
 */
export async function updateHomeworkStatus(
  assignmentId: string,
  newStatus: Assignment['status'],
  studentNotes?: string
): Promise<void> {
  const hwRef = doc(db, 'assignments', assignmentId);
  const patch: Partial<Assignment> & Record<string, any> = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
  if (studentNotes !== undefined) {
    patch.studentNotes = studentNotes;
  }
  await updateDoc(hwRef, patch);
}
