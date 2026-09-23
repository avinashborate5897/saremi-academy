import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AcademicHomework,
  PracticeSubmission,
  ClassMessage,
  TeacherPrivateNote,
  ClassSession,
  UserProfile
} from '../types';
import { recordAuditLog } from './adminFirestoreService';

// ============================================================================
// 1. HOMEWORK & TEACHER AUDIO DEMONSTRATION WORKFLOW
// ============================================================================

/**
 * Creates or updates an academic homework task with instructions, due date,
 * and optional teacher audio demonstration.
 */
export async function createOrUpdateHomework(params: {
  id?: string;
  sessionId: string;
  enrollmentId?: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  instructions: string;
  dueDate: string;
  audioUrl?: string;
  audioTitle?: string;
  audioDurationSeconds?: number;
  resources?: AcademicHomework['resources'];
  status?: AcademicHomework['status'];
}): Promise<AcademicHomework> {
  const now = new Date().toISOString();
  const homeworkCollection = collection(db, 'homework');
  const docRef = params.id ? doc(db, 'homework', params.id) : doc(homeworkCollection);

  const homeworkData: AcademicHomework = {
    id: docRef.id,
    sessionId: params.sessionId,
    enrollmentId: params.enrollmentId || '',
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    studentId: params.studentId,
    studentName: params.studentName,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    title: params.title.trim(),
    instructions: params.instructions.trim(),
    dueDate: params.dueDate,
    audioUrl: params.audioUrl || undefined,
    audioTitle: params.audioTitle || undefined,
    audioDurationSeconds: params.audioDurationSeconds || undefined,
    resources: params.resources || [],
    status: params.status || 'assigned',
    createdAt: now,
    updatedAt: now
  };

  await setDoc(docRef, homeworkData, { merge: true });

  // Update session record to link the assigned homework
  try {
    const sessRef = doc(db, 'classes', params.sessionId);
    await updateDoc(sessRef, {
      homeworkAssigned: params.title,
      homeworkDueDate: params.dueDate,
      homeworkId: docRef.id,
      updatedAt: now
    });
  } catch (err) {
    console.warn('[Homework] Could not link homework ID back to class session:', err);
  }

  return homeworkData;
}

/**
 * Fetches the homework document attached to a specific class session
 */
export async function getHomeworkForSession(sessionId: string): Promise<AcademicHomework | null> {
  try {
    const q = query(collection(db, 'homework'), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as AcademicHomework;
    }
  } catch (err) {
    console.warn('[Homework] Error getting homework for session:', err);
  }
  return null;
}

/**
 * Real-time subscription to a student's assigned homework items
 */
export function subscribeToStudentHomework(
  studentId: string,
  callback: (items: AcademicHomework[]) => void
): () => void {
  const q = query(
    collection(db, 'homework'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicHomework));
      callback(items);
    },
    (err) => {
      console.warn('[Homework] Student subscription error:', err);
      // Fallback query without orderBy if index is building
      const fallbackQuery = query(collection(db, 'homework'), where('studentId', '==', studentId));
      getDocs(fallbackQuery).then((fbSnap) => {
        const items = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicHomework));
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(items);
      });
    }
  );
}

/**
 * Real-time subscription to a teacher's assigned homework items
 */
export function subscribeToTeacherHomework(
  teacherId: string,
  callback: (items: AcademicHomework[]) => void
): () => void {
  const q = query(
    collection(db, 'homework'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicHomework));
      callback(items);
    },
    (err) => {
      console.warn('[Homework] Teacher subscription fallback:', err);
      const fbQ = query(collection(db, 'homework'), where('teacherId', '==', teacherId));
      getDocs(fbQ).then((fbSnap) => {
        const items = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicHomework));
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(items);
      });
    }
  );
}

// ============================================================================
// 2. PRACTICE SUBMISSIONS & TEACHER EVALUATION WORKFLOW
// ============================================================================

/**
 * Student uploads or submits homework practice (audio recording, video, or notes)
 */
export async function submitPractice(params: {
  homeworkId: string;
  sessionId: string;
  enrollmentId?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  audioUrl?: string;
  videoUrl?: string;
  notes?: string;
  durationSeconds?: number;
}): Promise<PracticeSubmission> {
  const now = new Date().toISOString();
  const subCollection = collection(db, 'practice_submissions');
  const docRef = doc(subCollection);

  const submission: PracticeSubmission = {
    id: docRef.id,
    homeworkId: params.homeworkId,
    sessionId: params.sessionId,
    enrollmentId: params.enrollmentId || '',
    studentId: params.studentId,
    studentName: params.studentName,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    audioUrl: params.audioUrl || undefined,
    videoUrl: params.videoUrl || undefined,
    notes: params.notes?.trim() || undefined,
    durationSeconds: params.durationSeconds || undefined,
    status: 'SUBMITTED',
    submittedAt: now,
    updatedAt: now
  };

  await setDoc(docRef, submission);

  // Update parent homework item status to 'submitted'
  try {
    const hwRef = doc(db, 'homework', params.homeworkId);
    await updateDoc(hwRef, {
      status: 'submitted',
      updatedAt: now
    });
  } catch (err) {
    console.warn('[PracticeSubmission] Failed to update homework status:', err);
  }

  return submission;
}

/**
 * Teacher reviews and grades a practice submission
 */
export async function reviewPracticeSubmission(params: {
  submissionId: string;
  homeworkId: string;
  feedbackText: string;
  feedbackAudioUrl?: string;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'Needs Practice';
  status: 'REVIEWED' | 'REDO_REQUESTED';
  reviewerName: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const subRef = doc(db, 'practice_submissions', params.submissionId);

  await updateDoc(subRef, {
    teacherFeedbackText: params.feedbackText.trim(),
    teacherFeedbackAudioUrl: params.feedbackAudioUrl || null,
    teacherGrade: params.grade,
    status: params.status,
    reviewedAt: now,
    updatedAt: now
  });

  // Update homework status
  try {
    const hwRef = doc(db, 'homework', params.homeworkId);
    await updateDoc(hwRef, {
      status: params.status === 'REVIEWED' ? 'reviewed' : 'redo_requested',
      updatedAt: now
    });
  } catch (err) {
    console.warn('[PracticeSubmission] Failed to update parent homework status:', err);
  }
}

/**
 * Subscribes to practice submissions for a particular homework task
 */
export function subscribeToPracticeSubmissionsForHomework(
  homeworkId: string,
  callback: (submissions: PracticeSubmission[]) => void
): () => void {
  const q = query(
    collection(db, 'practice_submissions'),
    where('homeworkId', '==', homeworkId),
    orderBy('submittedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeSubmission)));
    },
    (err) => {
      console.warn('[PracticeSubmission] Homework submissions fallback query:', err);
      const fbQ = query(collection(db, 'practice_submissions'), where('homeworkId', '==', homeworkId));
      getDocs(fbQ).then((fbSnap) => {
        const items = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeSubmission));
        items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        callback(items);
      });
    }
  );
}

/**
 * Subscribes to all practice submissions for a teacher to review
 */
export function subscribeToTeacherPracticeSubmissions(
  teacherId: string,
  callback: (submissions: PracticeSubmission[]) => void
): () => void {
  const q = query(
    collection(db, 'practice_submissions'),
    where('teacherId', '==', teacherId),
    orderBy('submittedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeSubmission)));
    },
    (err) => {
      console.warn('[PracticeSubmission] Teacher submissions fallback:', err);
      const fbQ = query(collection(db, 'practice_submissions'), where('teacherId', '==', teacherId));
      getDocs(fbQ).then((fbSnap) => {
        const items = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeSubmission));
        items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        callback(items);
      });
    }
  );
}

// ============================================================================
// 3. CLASS-SPECIFIC CONTROLLED CHAT (TEACHER ↔ ASSIGNED STUDENT ONLY)
// ============================================================================

/**
 * Subscribes in real-time to messages for a specific class session
 */
export function subscribeToClassMessages(
  sessionId: string,
  callback: (messages: ClassMessage[]) => void
): () => void {
  const q = query(
    collection(db, 'class_messages'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassMessage)));
    },
    (err) => {
      console.warn('[ClassChat] Class messages fallback query:', err);
      const fbQ = query(collection(db, 'class_messages'), where('sessionId', '==', sessionId));
      getDocs(fbQ).then((fbSnap) => {
        const items = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassMessage));
        items.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        callback(items);
      });
    }
  );
}

/**
 * Sends a message within a controlled class communication thread
 */
export async function sendClassMessage(params: {
  sessionId: string;
  enrollmentId?: string;
  studentId: string;
  teacherId: string;
  senderId: string;
  senderRole: 'teacher' | 'student' | 'admin';
  senderName: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'audio' | 'image' | 'pdf' | 'file';
}): Promise<ClassMessage> {
  const now = new Date().toISOString();
  const collRef = collection(db, 'class_messages');
  const docRef = doc(collRef);

  const message: ClassMessage = {
    id: docRef.id,
    sessionId: params.sessionId,
    enrollmentId: params.enrollmentId || '',
    studentId: params.studentId,
    teacherId: params.teacherId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    text: params.text.trim(),
    attachmentUrl: params.attachmentUrl || undefined,
    attachmentType: params.attachmentType || undefined,
    timestamp: now,
    read: false
  };

  await setDoc(docRef, message);
  return message;
}

// ============================================================================
// 4. TEACHER PRIVATE PEDAGOGICAL NOTES (STRICTLY HIDDEN FROM STUDENT)
// ============================================================================

/**
 * Saves or updates a private teacher note for a student
 */
export async function saveTeacherPrivateNote(params: {
  id?: string;
  teacherId: string;
  teacherName?: string;
  studentId: string;
  studentName?: string;
  sessionId?: string;
  courseTitle?: string;
  weakAreas?: string;
  practiceObservations?: string;
  nextLessonPlan?: string;
  content: string;
}): Promise<TeacherPrivateNote> {
  const now = new Date().toISOString();
  const coll = collection(db, 'teacher_private_notes');
  const docRef = params.id ? doc(db, 'teacher_private_notes', params.id) : doc(coll);

  const note: TeacherPrivateNote = {
    id: docRef.id,
    teacherId: params.teacherId,
    teacherName: params.teacherName || 'Faculty Guru',
    studentId: params.studentId,
    studentName: params.studentName || 'Student',
    sessionId: params.sessionId || undefined,
    courseTitle: params.courseTitle || undefined,
    weakAreas: params.weakAreas?.trim() || undefined,
    practiceObservations: params.practiceObservations?.trim() || undefined,
    nextLessonPlan: params.nextLessonPlan?.trim() || undefined,
    content: params.content.trim(),
    createdAt: now,
    updatedAt: now
  };

  await setDoc(docRef, note, { merge: true });
  return note;
}

/**
 * Fetches private notes for a student written by a teacher (or all for admin)
 */
export async function getTeacherPrivateNotes(
  teacherId: string,
  studentId: string
): Promise<TeacherPrivateNote[]> {
  try {
    const q = query(
      collection(db, 'teacher_private_notes'),
      where('teacherId', '==', teacherId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherPrivateNote));
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return items;
  } catch (err) {
    console.warn('[TeacherPrivateNote] Error fetching private notes:', err);
    return [];
  }
}
