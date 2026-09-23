import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  ClassSession, 
  EnrollmentRecord, 
  SessionStatus, 
  SessionType,
  WeeklyAvailabilitySlot,
  TeacherBlockedTime,
  AcademyBlockedDate,
  AvailableTimeSlot,
  SessionSeriesRecord
} from '../types';
import { recordAuditLog } from './adminFirestoreService';

export interface CreateSessionParams {
  enrollmentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hr)
  durationMinutes: number; // e.g. 30, 45, 60
  sessionType?: SessionType;
  createdBy: string;
  creatorName?: string;
  creatorRole: 'admin' | 'teacher';
  notes?: string;
  seriesId?: string;
  seriesIndex?: number;
  totalSeriesSessions?: number;
  isRecurring?: boolean;
  recurringRule?: 'weekly' | 'biweekly' | 'custom';
}

export interface RescheduleSessionParams {
  sessionId: string;
  newDate: string; // YYYY-MM-DD
  newStartTime: string; // HH:mm (24-hr)
  newDurationMinutes?: number;
  reason: string;
  updatedBy: string;
  updaterName?: string;
  updaterRole: 'admin' | 'teacher';
}

export interface CancelSessionParams {
  sessionId: string;
  reason: string;
  cancelledBy: string;
  cancellerName?: string;
  cancellerRole: 'admin' | 'teacher';
}

/**
 * Recursively removes all undefined fields from objects, arrays, or nested structures.
 * This guarantees that Firestore setDoc or updateDoc calls never fail with:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeFirestorePayload<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  // Handle Objects (excluding Date, RegExp, FieldValue, etc.)
  if (typeof data === 'object') {
    // Preserve special Firestore objects or Dates
    if (data instanceof Date || (data as any).constructor?.name === 'FieldValue') {
      return data;
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue; // Omit undefined fields
      }
      clean[key] = sanitizeFirestorePayload(value);
    }
    return clean as T;
  }

  return data;
}

/**
 * Calculates HH:mm end time from start time and duration minutes
 */
export function computeEndTime(startTime: string, durationMinutes: number): string {
  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Builds an ISO 8601 string in Asia/Kolkata (IST: UTC+05:30)
 */
export function buildISTTimestamp(dateStr: string, timeStr: string): string {
  // Ensure formatted as YYYY-MM-DDTHH:mm:00+05:30
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim().length === 5 ? `${timeStr.trim()}:00` : timeStr.trim();
  return `${cleanDate}T${cleanTime}+05:30`;
}

/**
 * Validates enrollment status, teacher assignment, and student status
 */
export async function validateEnrollmentForSession(
  enrollmentId: string,
  expectedTeacherId?: string
): Promise<{ isValid: boolean; enrollment?: EnrollmentRecord; error?: string }> {
  try {
    const enrRef = doc(db, 'enrollments', enrollmentId);
    const enrSnap = await getDoc(enrRef);

    if (!enrSnap.exists()) {
      return { isValid: false, error: 'Enrollment record not found in academy database.' };
    }

    const enrollment = { id: enrSnap.id, ...enrSnap.data() } as EnrollmentRecord;

    // Check active status
    if (enrollment.status && enrollment.status !== 'active') {
      return { 
        isValid: false, 
        enrollment, 
        error: `Enrollment status is "${enrollment.status}". Sessions can only be scheduled for active enrollments.` 
      };
    }

    // If teacher is creating the session, verify teacher is assigned
    if (expectedTeacherId && enrollment.teacherId && enrollment.teacherId !== expectedTeacherId) {
      return { 
        isValid: false, 
        enrollment, 
        error: 'Authorization violation: You are only permitted to schedule sessions for your officially assigned students.' 
      };
    }

    if (!enrollment.teacherId) {
      return {
        isValid: false,
        enrollment,
        error: 'This enrollment does not have an assigned faculty guru. Please assign a teacher before scheduling sessions.'
      };
    }

    // Verify teacher active status
    try {
      const teacherRef = doc(db, 'teachers', enrollment.teacherId);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        const tData = teacherSnap.data();
        if (tData.status && tData.status !== 'active' && tData.status !== 'Active') {
          return {
            isValid: false,
            enrollment,
            error: `Assigned faculty (${enrollment.teacherName}) account is currently inactive (${tData.status}).`
          };
        }
      }
    } catch {
      // Non-blocking if teachers collection permission check fails
    }

    // Verify student active status
    try {
      const studentRef = doc(db, 'users', enrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const sData = studentSnap.data();
        if (sData.status && sData.status !== 'active' && sData.status !== 'Active') {
          return {
            isValid: false,
            enrollment,
            error: `Student (${enrollment.studentName}) account is currently inactive (${sData.status}).`
          };
        }
      }
    } catch {
      // Non-blocking
    }

    return { isValid: true, enrollment };
  } catch (err: any) {
    console.error('Error validating enrollment:', err);
    return { isValid: false, error: err.message || 'Error validating enrollment.' };
  }
}

/**
 * Detects schedule conflicts against existing sessions (Teacher and Student)
 */
export function detectSessionConflict(
  candidate: {
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    durationMinutes: number;
    excludeSessionId?: string;
  },
  existingSessions: ClassSession[]
): { hasConflict: boolean; reason?: string; conflictingSession?: ClassSession } {
  const newStart = new Date(candidate.scheduledAt).getTime();
  const newEnd = newStart + candidate.durationMinutes * 60 * 1000;

  if (isNaN(newStart)) {
    return { hasConflict: false };
  }

  for (const session of existingSessions) {
    if (session.id === candidate.excludeSessionId) continue;
    if (session.status === 'cancelled') continue;

    const existingStart = new Date(session.scheduledAt || `${session.date}T${session.startTime || '00:00'}:00`).getTime();
    if (isNaN(existingStart)) continue;

    const existingEnd = existingStart + (session.durationMinutes || 45) * 60 * 1000;

    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    const isOverlapping = newStart < existingEnd && newEnd > existingStart;

    if (isOverlapping) {
      const formattedTime = new Date(session.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });

      if (session.teacherId === candidate.teacherId) {
        return {
          hasConflict: true,
          conflictingSession: session,
          reason: `Faculty guru (${session.teacherName}) already has a session "${session.courseTitle}" scheduled with ${session.studentName} at ${formattedTime} IST.`
        };
      }

      if (session.studentId === candidate.studentId) {
        return {
          hasConflict: true,
          conflictingSession: session,
          reason: `Student (${session.studentName}) is already booked for another session at ${formattedTime} IST.`
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Creates a new class session with full validation, conflict check, and Firestore persistence
 */
export async function createSession(
  params: CreateSessionParams,
  existingSessions: ClassSession[] = []
): Promise<{ success: boolean; session?: ClassSession; error?: string }> {
  // 1. Enrollment Validation
  const valResult = await validateEnrollmentForSession(
    params.enrollmentId,
    params.creatorRole === 'teacher' ? params.createdBy : undefined
  );

  if (!valResult.isValid || !valResult.enrollment) {
    return { success: false, error: valResult.error || 'Enrollment validation failed.' };
  }

  const enrollment = valResult.enrollment;
  const endTime = computeEndTime(params.startTime, params.durationMinutes);
  const scheduledAt = buildISTTimestamp(params.date, params.startTime);

  // 2. Conflict Detection
  const conflictCheck = detectSessionConflict(
    {
      teacherId: enrollment.teacherId!,
      studentId: enrollment.studentId,
      scheduledAt,
      durationMinutes: params.durationMinutes
    },
    existingSessions
  );

  if (conflictCheck.hasConflict) {
    return { success: false, error: conflictCheck.reason };
  }

  // 3. Build ClassSession object
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();
  const channelName = `saremi_class_${sessionId}`;

  const session: ClassSession = {
    id: sessionId,
    sessionId: sessionId,
    enrollmentId: enrollment.id,
    studentId: enrollment.studentId,
    studentName: enrollment.studentName,
    studentEmail: enrollment.studentEmail || '',
    teacherId: enrollment.teacherId!,
    teacherName: enrollment.teacherName || 'Assigned Guru',
    courseId: enrollment.courseId,
    courseTitle: enrollment.courseName,
    program: enrollment.packageName || enrollment.courseName || 'Classical Mentorship Program',
    date: params.date,
    startTime: params.startTime,
    endTime: endTime,
    scheduledAt: scheduledAt,
    durationMinutes: params.durationMinutes,
    duration: params.durationMinutes,
    status: 'scheduled',
    sessionType: params.sessionType || '1:1',
    timezone: 'Asia/Kolkata',
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
    roomId: channelName,
    meetingUrl: channelName,
    agoraChannelName: channelName,
    topic: `${enrollment.courseName} - 1:1 Live Class`,
    time: `${params.startTime} - ${endTime} IST`,
    lessonNotes: params.notes || '',
    seriesId: params.seriesId,
    seriesIndex: params.seriesIndex,
    totalSeriesSessions: params.totalSeriesSessions,
    isRecurring: params.isRecurring,
    recurringRule: params.recurringRule
  };

  try {
    const cleanSession = sanitizeFirestorePayload(session);
    await setDoc(doc(db, 'classes', sessionId), cleanSession);

    // Record audit log
    await recordAuditLog(
      {
        id: params.createdBy,
        name: params.creatorName || (params.creatorRole === 'admin' ? 'Admin' : 'Teacher'),
        role: params.creatorRole
      },
      'Created Academy Session',
      'class',
      sessionId,
      `Scheduled 1:1 session for "${enrollment.courseName}" (Student: ${enrollment.studentName}, Faculty: ${enrollment.teacherName}) on ${params.date} at ${params.startTime} IST`
    );

    return { success: true, session };
  } catch (err: any) {
    console.error('Error saving session to Firestore:', err);
    return { success: false, error: err.message || 'Failed to save session to Firestore.' };
  }
}

/**
 * Reschedules an existing session with validation and conflict checking
 */
export async function rescheduleSession(
  params: RescheduleSessionParams,
  existingSessions: ClassSession[] = []
): Promise<{ success: boolean; session?: ClassSession; error?: string }> {
  try {
    const sessionRef = doc(db, 'classes', params.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Session not found.' };
    }

    const currentSession = { id: sessionSnap.id, ...sessionSnap.data() } as ClassSession;

    // Authorization check
    if (params.updaterRole === 'teacher' && currentSession.teacherId !== params.updatedBy) {
      return { success: false, error: 'Unauthorized: You may only reschedule sessions assigned to you.' };
    }

    const duration = params.newDurationMinutes || currentSession.durationMinutes || 45;
    const newEndTime = computeEndTime(params.newStartTime, duration);
    const newScheduledAt = buildISTTimestamp(params.newDate, params.newStartTime);

    // Conflict detection
    const conflictCheck = detectSessionConflict(
      {
        teacherId: currentSession.teacherId,
        studentId: currentSession.studentId,
        scheduledAt: newScheduledAt,
        durationMinutes: duration,
        excludeSessionId: params.sessionId
      },
      existingSessions
    );

    if (conflictCheck.hasConflict) {
      return { success: false, error: conflictCheck.reason };
    }

    const now = new Date().toISOString();
    const updatedSession: Partial<ClassSession> = {
      date: params.newDate,
      startTime: params.newStartTime,
      endTime: newEndTime,
      scheduledAt: newScheduledAt,
      durationMinutes: duration,
      duration: duration,
      status: 'scheduled',
      time: `${params.newStartTime} - ${newEndTime} IST`,
      updatedAt: now,
      rescheduledFrom: {
        scheduledAt: currentSession.scheduledAt,
        date: currentSession.date,
        startTime: currentSession.startTime,
        endTime: currentSession.endTime,
        reason: params.reason
      },
      rescheduleReason: params.reason
    };

    const cleanUpdatedSession = sanitizeFirestorePayload(updatedSession);
    await updateDoc(sessionRef, cleanUpdatedSession);

    // Record audit log
    await recordAuditLog(
      {
        id: params.updatedBy,
        name: params.updaterName || (params.updaterRole === 'admin' ? 'Admin' : 'Teacher'),
        role: params.updaterRole
      },
      'Rescheduled Academy Session',
      'class',
      params.sessionId,
      `Rescheduled session from ${currentSession.date} ${currentSession.startTime} to ${params.newDate} ${params.newStartTime} IST. Reason: ${params.reason}`
    );

    return { success: true, session: { ...currentSession, ...updatedSession } as ClassSession };
  } catch (err: any) {
    console.error('Error rescheduling session:', err);
    return { success: false, error: err.message || 'Failed to reschedule session.' };
  }
}

/**
 * Cancels a session with reason (without hard deleting)
 */
export async function cancelSession(
  params: CancelSessionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionRef = doc(db, 'classes', params.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Session not found.' };
    }

    const currentSession = { id: sessionSnap.id, ...sessionSnap.data() } as ClassSession;

    // Authorization check
    if (params.cancellerRole === 'teacher' && currentSession.teacherId !== params.cancelledBy) {
      return { success: false, error: 'Unauthorized: You may only cancel sessions assigned to you.' };
    }

    const now = new Date().toISOString();
    await updateDoc(sessionRef, {
      status: 'cancelled',
      cancellationReason: params.reason,
      updatedAt: now
    });

    // Record audit log
    await recordAuditLog(
      {
        id: params.cancelledBy,
        name: params.cancellerName || (params.cancellerRole === 'admin' ? 'Admin' : 'Teacher'),
        role: params.cancellerRole
      },
      'Cancelled Academy Session',
      'class',
      params.sessionId,
      `Cancelled session "${currentSession.courseTitle}" with ${currentSession.studentName}. Reason: ${params.reason}`
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error cancelling session:', err);
    return { success: false, error: err.message || 'Failed to cancel session.' };
  }
}

/**
 * Real-time subscription to all sessions for Admin
 */
export function subscribeToAllSessions(
  onUpdate: (sessions: ClassSession[]) => void
): () => void {
  const colRef = collection(db, 'classes');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
      list.sort((a, b) => new Date(a.scheduledAt || a.date || 0).getTime() - new Date(b.scheduledAt || b.date || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('All sessions subscriber notice:', err.message);
    }
  );
}

/**
 * Real-time subscription to teacher's sessions
 */
export function subscribeToTeacherSessions(
  teacherId: string,
  onUpdate: (sessions: ClassSession[]) => void
): () => void {
  const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
      list.sort((a, b) => new Date(a.scheduledAt || a.date || 0).getTime() - new Date(b.scheduledAt || b.date || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('Teacher sessions subscriber notice:', err.message);
    }
  );
}

/**
 * Real-time subscription to student's sessions
 * Queries by studentId AND studentEmail to ensure complete session visibility
 */
export function subscribeToStudentSessions(
  studentIdOrSuccess: string | ((sessions: ClassSession[]) => void),
  studentEmailOrSuccess?: string | ((sessions: ClassSession[]) => void),
  onUpdateCb?: (sessions: ClassSession[]) => void
): () => void {
  let studentId = '';
  let studentEmail = '';
  let onUpdate: (sessions: ClassSession[]) => void = () => {};

  if (typeof studentIdOrSuccess === 'function') {
    onUpdate = studentIdOrSuccess;
  } else {
    studentId = (studentIdOrSuccess || '').trim();
    if (typeof studentEmailOrSuccess === 'function') {
      onUpdate = studentEmailOrSuccess;
    } else if (typeof studentEmailOrSuccess === 'string') {
      studentEmail = studentEmailOrSuccess.trim();
      if (typeof onUpdateCb === 'function') {
        onUpdate = onUpdateCb;
      }
    }
  }

  const cleanEmail = studentEmail.toLowerCase();
  
  let listById: ClassSession[] = [];
  let listByEmail: ClassSession[] = [];

  const mergeAndNotify = () => {
    const map = new Map<string, ClassSession>();
    listById.forEach((s) => map.set(s.id, s));
    listByEmail.forEach((s) => map.set(s.id, s));
    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(a.scheduledAt || a.date || 0).getTime() - new Date(b.scheduledAt || b.date || 0).getTime());
    if (typeof onUpdate === 'function') {
      onUpdate(merged);
    }
  };

  let unsubId = () => {};
  if (studentId) {
    const qId = query(collection(db, 'classes'), where('studentId', '==', studentId));
    unsubId = onSnapshot(
      qId,
      (snapshot) => {
        listById = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
        mergeAndNotify();
      },
      (err) => {
        console.warn('Student sessions (ID) subscriber notice:', err.message);
      }
    );
  }

  let unsubEmail = () => {};
  if (cleanEmail) {
    const qEmail = query(collection(db, 'classes'), where('studentEmail', '==', cleanEmail));
    unsubEmail = onSnapshot(
      qEmail,
      (snapshot) => {
        listByEmail = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
        mergeAndNotify();
      },
      (err) => {
        console.warn('Student sessions (Email) subscriber notice:', err.message);
      }
    );
  }

  if (!studentId && !cleanEmail) {
    if (typeof onUpdate === 'function') onUpdate([]);
    return () => {};
  }

  return () => {
    unsubId();
    unsubEmail();
  };
}

/**
 * Helper to display time in IST nicely
 */
export function formatSessionTimeIST(session: ClassSession): string {
  if (session.startTime && session.endTime) {
    return `${session.startTime} – ${session.endTime} IST`;
  }
  if (session.scheduledAt) {
    try {
      const d = new Date(session.scheduledAt);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      }) + ' IST';
    } catch {
      return session.time || '18:00 IST';
    }
  }
  return session.time || '18:00 IST';
}

/**
 * Helper to display date in IST nicely
 */
export function formatSessionDateIST(session: ClassSession): string {
  if (session.date) {
    try {
      const [y, m, d] = session.date.split('-');
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return session.date;
    }
  }
  if (session.scheduledAt) {
    try {
      const dt = new Date(session.scheduledAt);
      return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'Scheduled';
    }
  }
  return 'Scheduled';
}

/**
 * Returns today's calendar date string (YYYY-MM-DD) in Asia/Kolkata (IST).
 * Consistent across all client timezones.
 */
export function getTodayISTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Resolves the calendar date string (YYYY-MM-DD) in Asia/Kolkata (IST) for any session.
 */
export function getSessionISTDateString(session: { date?: string; scheduledAt?: string }): string {
  if (session.date && /^\d{4}-\d{2}-\d{2}$/.test(session.date.trim())) {
    return session.date.trim();
  }
  if (session.scheduledAt) {
    try {
      const dt = new Date(session.scheduledAt);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      }
    } catch {}
  }
  return session.date || '';
}

/**
 * Standardized helper to determine if a class is TODAY in IST.
 * Always treats 'live' classes as today so ongoing sessions are immediately visible.
 */
export function isSessionTodayIST(session: ClassSession): boolean {
  const status = (session.status || '').toLowerCase();
  if (status === 'live') return true;
  if (status === 'completed' || status === 'cancelled') return false;

  const todayIST = getTodayISTDateString();
  const sessionDateIST = getSessionISTDateString(session);

  return sessionDateIST === todayIST;
}

/**
 * Standardized helper to determine if a class is UPCOMING in IST.
 */
export function isSessionUpcomingIST(session: ClassSession): boolean {
  const status = (session.status || '').toLowerCase();
  if (status === 'completed' || status === 'cancelled') return false;
  if (status === 'live' || isSessionTodayIST(session)) return false;

  const todayIST = getTodayISTDateString();
  const sessionDateIST = getSessionISTDateString(session);

  return sessionDateIST > todayIST || status === 'scheduled';
}

/**
 * Standardized helper to determine if a class is COMPLETED.
 */
export function isSessionCompleted(session: ClassSession): boolean {
  const status = (session.status || '').toLowerCase();
  return status === 'completed' || Boolean((session as any).attendanceMarked || (session as any).attendanceRecorded);
}

// ==========================================
// 1. TEACHER AVAILABILITY & WORKING WINDOWS
// ==========================================

export const WEEK_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const WEEK_DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr || '00').padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

/**
 * Parses legacy array of strings like ["Mon 10:00-14:00", "Wed 16:00-20:00"]
 * into structured WeeklyAvailabilitySlot array
 */
export function parseLegacyAvailabilityString(
  availabilityStrings: string[],
  teacherId: string
): WeeklyAvailabilitySlot[] {
  if (!Array.isArray(availabilityStrings)) return [];
  const slots: WeeklyAvailabilitySlot[] = [];
  const dayMap: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };

  availabilityStrings.forEach((item, idx) => {
    if (typeof item !== 'string') return;
    const parts = item.trim().split(/\s+/);
    if (parts.length >= 2) {
      const dayKey = parts[0].toLowerCase().replace(/[^a-z]/g, '');
      const dayOfWeek = dayMap[dayKey] ?? 1;
      const timePart = parts.slice(1).join('').replace(/\s+/g, '');
      const [start, end] = timePart.split('-');
      if (start && end) {
        slots.push({
          id: `${teacherId}_slot_${dayOfWeek}_${idx}`,
          teacherId,
          dayOfWeek,
          dayName: WEEK_DAY_NAMES[dayOfWeek],
          startTime: start.padStart(5, '0'),
          endTime: end.padStart(5, '0'),
          isActive: true
        });
      }
    }
  });
  return slots;
}

/**
 * Saves teacher weekly availability with support for multiple windows per day
 */
export async function saveTeacherWeeklyAvailability(
  teacherId: string,
  slots: WeeklyAvailabilitySlot[],
  actor: { id: string; name?: string; role: 'admin' | 'teacher' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'teacher_availability', teacherId), {
      teacherId,
      slots,
      updatedAt: now,
      updatedBy: actor.id,
      updatedByName: actor.name || (actor.role === 'admin' ? 'Admin' : 'Teacher')
    });

    await recordAuditLog(
      { id: actor.id, name: actor.name || (actor.role === 'admin' ? 'Admin' : 'Teacher'), role: actor.role },
      'Updated Faculty Availability',
      'teacher',
      teacherId,
      `Configured weekly availability hours for faculty ${teacherId} (${slots.length} window(s))`
    );
    return { success: true };
  } catch (err: any) {
    console.error('Error saving teacher availability:', err);
    return { success: false, error: err.message || 'Failed to save availability' };
  }
}

/**
 * Fetches teacher weekly availability with fallback to legacy profile
 */
export async function getTeacherWeeklyAvailability(
  teacherId: string
): Promise<{ slots: WeeklyAvailabilitySlot[]; isConfigured: boolean }> {
  try {
    const snap = await getDoc(doc(db, 'teacher_availability', teacherId));
    if (snap.exists()) {
      const data = snap.data();
      return { slots: data.slots || [], isConfigured: true };
    }
    // Fallback to legacy string array on teacher profile
    const tSnap = await getDoc(doc(db, 'teachers', teacherId));
    if (tSnap.exists()) {
      const tData = tSnap.data();
      if (Array.isArray(tData.availability) && tData.availability.length > 0) {
        return {
          slots: parseLegacyAvailabilityString(tData.availability, teacherId),
          isConfigured: true
        };
      }
    }
    return { slots: [], isConfigured: false };
  } catch (err) {
    console.error('Error fetching teacher availability:', err);
    return { slots: [], isConfigured: false };
  }
}

/**
 * Real-time subscription to a teacher's weekly availability
 */
export function subscribeToTeacherWeeklyAvailability(
  teacherId: string,
  callback: (slots: WeeklyAvailabilitySlot[], isConfigured: boolean) => void
): () => void {
  return onSnapshot(
    doc(db, 'teacher_availability', teacherId),
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.slots || [], true);
      } else {
        try {
          const tSnap = await getDoc(doc(db, 'teachers', teacherId));
          if (tSnap.exists()) {
            const tData = tSnap.data();
            if (Array.isArray(tData.availability) && tData.availability.length > 0) {
              callback(parseLegacyAvailabilityString(tData.availability, teacherId), true);
              return;
            }
          }
        } catch {
          // ignore
        }
        callback([], false);
      }
    },
    (err) => console.warn('Teacher availability listener notice:', err.message)
  );
}

/**
 * Subscribes to all teachers' structured availability
 */
export function subscribeToAllTeacherAvailabilities(
  callback: (map: Record<string, WeeklyAvailabilitySlot[]>) => void
): () => void {
  return onSnapshot(
    collection(db, 'teacher_availability'),
    (snapshot) => {
      const map: Record<string, WeeklyAvailabilitySlot[]> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.teacherId && Array.isArray(data.slots)) {
          map[data.teacherId] = data.slots;
        }
      });
      callback(map);
    },
    (err) => console.warn('All teacher availabilities listener notice:', err.message)
  );
}

// ==========================================
// 2. TEACHER TEMPORARY BLOCKED TIMES
// ==========================================

export async function addTeacherBlockedTime(params: {
  teacherId: string;
  teacherName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
  createdBy: string;
  createdByName?: string;
  creatorRole?: 'admin' | 'teacher';
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const blockId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const block: TeacherBlockedTime = {
      id: blockId,
      teacherId: params.teacherId,
      teacherName: params.teacherName || 'Faculty',
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      reason: params.reason,
      createdAt: now,
      createdBy: params.createdBy,
      createdByName: params.createdByName || ''
    };
    await setDoc(doc(db, 'teacher_blocked_times', blockId), block);
    await recordAuditLog(
      { id: params.createdBy, name: params.createdByName || 'User', role: params.creatorRole || 'teacher' },
      'Added Faculty Blocked Period',
      'teacher',
      blockId,
      `Blocked time for ${params.teacherName || params.teacherId} on ${params.date} (${params.startTime} - ${params.endTime}): ${params.reason}`
    );
    return { success: true, id: blockId };
  } catch (err: any) {
    console.error('Error adding teacher blocked time:', err);
    return { success: false, error: err.message || 'Failed to add blocked period' };
  }
}

export async function removeTeacherBlockedTime(
  blockId: string,
  actor: { id: string; name?: string; role: 'admin' | 'teacher' }
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'teacher_blocked_times', blockId));
    await recordAuditLog(
      { id: actor.id, name: actor.name || (actor.role === 'admin' ? 'Admin' : 'Teacher'), role: actor.role },
      'Removed Faculty Blocked Period',
      'teacher',
      blockId,
      `Removed faculty blocked period ${blockId}`
    );
    return { success: true };
  } catch (err: any) {
    console.error('Error removing teacher blocked time:', err);
    return { success: false, error: err.message || 'Failed to remove blocked period' };
  }
}

export function subscribeToTeacherBlockedTimes(
  teacherId: string,
  callback: (blocks: TeacherBlockedTime[]) => void
): () => void {
  const q = query(collection(db, 'teacher_blocked_times'), where('teacherId', '==', teacherId));
  return onSnapshot(
    q,
    (snapshot) => {
      const blocks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherBlockedTime));
      blocks.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      callback(blocks);
    },
    (err) => console.warn('Teacher blocked times listener notice:', err.message)
  );
}

export function subscribeToAllTeacherBlockedTimes(
  callback: (blocks: TeacherBlockedTime[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'teacher_blocked_times'),
    (snapshot) => {
      const blocks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherBlockedTime));
      blocks.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      callback(blocks);
    },
    (err) => console.warn('All teacher blocked times listener notice:', err.message)
  );
}

// ==========================================
// 3. ACADEMY BLOCKED DATES (HOLIDAYS/CLOSURES)
// ==========================================

export async function addAcademyBlockedDate(params: {
  date: string; // YYYY-MM-DD
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  createdBy: string;
  createdByName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const blockId = `acad_block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const block: AcademyBlockedDate = {
      id: blockId,
      date: params.date,
      reason: params.reason,
      isFullDay: params.isFullDay,
      startTime: params.startTime || '00:00',
      endTime: params.endTime || '23:59',
      createdAt: now,
      createdBy: params.createdBy,
      createdByName: params.createdByName || 'Admin'
    };
    await setDoc(doc(db, 'academy_blocked_dates', blockId), block);

    // Flag any existing scheduled sessions on this date with an informative review notice
    try {
      const q = query(collection(db, 'classes'), where('date', '==', params.date));
      const snap = await getDocs(q);
      const updates = snap.docs.map(async (dSnap) => {
        const sess = dSnap.data() as ClassSession;
        if (sess.status !== 'cancelled') {
          await updateDoc(dSnap.ref, {
            flaggedNotice: `Notice: Session falls on newly declared academy holiday/closure: "${params.reason}".`
          });
        }
      });
      await Promise.all(updates);
    } catch (flagErr) {
      console.warn('Note when checking existing sessions for newly blocked date:', flagErr);
    }

    await recordAuditLog(
      { id: params.createdBy, name: params.createdByName || 'Admin', role: 'admin' },
      'Added Academy Holiday / Closure',
      'settings',
      blockId,
      `Declared academy closure on ${params.date}: ${params.reason} (${params.isFullDay ? 'Full Day' : `${params.startTime}-${params.endTime}`})`
    );

    return { success: true, id: blockId };
  } catch (err: any) {
    console.error('Error adding academy blocked date:', err);
    return { success: false, error: err.message || 'Failed to add academy holiday' };
  }
}

export async function removeAcademyBlockedDate(
  blockId: string,
  actor: { id: string; name?: string; role: 'admin' | 'teacher' }
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'academy_blocked_dates', blockId));
    await recordAuditLog(
      { id: actor.id, name: actor.name || (actor.role === 'admin' ? 'Admin' : 'Teacher'), role: actor.role },
      'Removed Academy Holiday / Closure',
      'settings',
      blockId,
      `Removed academy closure record ${blockId}`
    );
    return { success: true };
  } catch (err: any) {
    console.error('Error removing academy blocked date:', err);
    return { success: false, error: err.message || 'Failed to remove academy holiday' };
  }
}

export function subscribeToAcademyBlockedDates(
  callback: (blocks: AcademyBlockedDate[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'academy_blocked_dates'),
    (snapshot) => {
      const blocks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AcademyBlockedDate));
      blocks.sort((a, b) => a.date.localeCompare(b.date));
      callback(blocks);
    },
    (err) => console.warn('Academy blocked dates listener notice:', err.message)
  );
}

// ==========================================
// 4. INTELLIGENT AVAILABLE SLOT CALCULATION
// ==========================================

export interface SlotCalculationParams {
  date: string; // YYYY-MM-DD
  teacherId: string;
  durationMinutes: number; // e.g. 30, 45, 60
  weeklyAvailability: WeeklyAvailabilitySlot[];
  teacherBlockedTimes: TeacherBlockedTime[];
  academyBlockedDates: AcademyBlockedDate[];
  existingSessions: ClassSession[];
  studentId?: string;
  studentPreferences?: {
    preferredDays?: string[];
    preferredTimeSlot?: string;
    preferredTimeWindow?: {
      start: string;
      end: string;
    };
  };
  excludeSessionId?: string;
  stepMinutes?: number;
}

export interface SlotCalculationResult {
  slots: AvailableTimeSlot[];
  isDayBlocked: boolean;
  blockedReason?: string;
  isConfigured: boolean;
  message?: string;
}

/**
 * Calculates available session time slots for a given teacher, date, duration,
 * accounting for weekly availability, teacher blocked periods, academy holidays,
 * student/teacher conflicts, and tags student preferred timings.
 */
export function calculateAvailableSlots(params: SlotCalculationParams): SlotCalculationResult {
  const {
    date,
    teacherId,
    durationMinutes,
    weeklyAvailability,
    teacherBlockedTimes,
    academyBlockedDates,
    existingSessions,
    studentId,
    studentPreferences,
    excludeSessionId,
    stepMinutes = durationMinutes || 45
  } = params;

  // 1. Check Full-Day Academy Blocked Date
  const fullDayAcademyBlock = academyBlockedDates.find(
    (b) => b.date === date && b.isFullDay
  );
  if (fullDayAcademyBlock) {
    return {
      slots: [],
      isDayBlocked: true,
      blockedReason: `Academy Holiday / Closure: ${fullDayAcademyBlock.reason}`,
      isConfigured: true,
      message: `The conservatory is closed on this date (${fullDayAcademyBlock.reason}).`
    };
  }

  // 2. Parse Day of Week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const [yStr, mStr, dStr] = date.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  const targetDate = new Date(y, m, d);
  const dayOfWeek = targetDate.getDay();
  const dayName = WEEK_DAY_NAMES[dayOfWeek];
  const dayAbbr = WEEK_DAY_ABBRS[dayOfWeek];

  // 3. Find Teacher Active Weekly Windows for this weekday
  const configuredWindows = weeklyAvailability.filter(
    (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive !== false
  );

  // If faculty has not configured weekly hours or has no explicit active window for this day,
  // provide standard conservatory daytime hours (09:00 - 20:00 IST) as a safe fallback
  // so the administrator is never locked out of scheduling.
  const hasConfiguredWindows = configuredWindows.length > 0;
  const activeWindows: WeeklyAvailabilitySlot[] = hasConfiguredWindows
    ? configuredWindows
    : [{ id: 'fallback_std', teacherId, dayOfWeek, dayName, startTime: '09:00', endTime: '20:00', isActive: true }];

  // Helper to convert "HH:mm" to minutes from midnight
  const toMinutes = (timeStr: string): number => {
    const [h, min] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (min || 0);
  };

  const toTimeString = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  // Helper to check interval overlap: [startA, endA) and [startB, endB)
  const isOverlap = (sA: number, eA: number, sB: number, eB: number): boolean => {
    return sA < eB && eA > sB;
  };

  // Relevant Partial-Day Academy Blocks on this date
  const partialAcademyBlocks = academyBlockedDates.filter(
    (b) => b.date === date && !b.isFullDay
  );

  // Relevant Teacher Blocked Times on this date
  const relevantTeacherBlocks = teacherBlockedTimes.filter(
    (b) => b.teacherId === teacherId && b.date === date
  );

  // Relevant Existing Sessions on this date (active and scheduled)
  const relevantSessions = existingSessions.filter((s) => {
    if (s.id === excludeSessionId || s.sessionId === excludeSessionId) return false;
    if (s.status === 'cancelled') return false;
    return s.date === date;
  });

  const slots: AvailableTimeSlot[] = [];
  const effectiveStep = Math.max(15, stepMinutes);

  // Sort windows by start time
  activeWindows.sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (const window of activeWindows) {
    const windowStart = toMinutes(window.startTime);
    const windowEnd = toMinutes(window.endTime);

    for (let cur = windowStart; cur + durationMinutes <= windowEnd; cur += effectiveStep) {
      const slotStartMin = cur;
      const slotEndMin = cur + durationMinutes;
      const slotStartTime = toTimeString(slotStartMin);
      const slotEndTime = toTimeString(slotEndMin);

      let isAvailable = true;
      let conflictReason: string | undefined;

      // Check partial-day academy blocks
      for (const acadBlock of partialAcademyBlocks) {
        const bStart = toMinutes(acadBlock.startTime || '00:00');
        const bEnd = toMinutes(acadBlock.endTime || '23:59');
        if (isOverlap(slotStartMin, slotEndMin, bStart, bEnd)) {
          isAvailable = false;
          conflictReason = `Academy Closure: ${acadBlock.reason}`;
          break;
        }
      }

      // Check teacher blocked times
      if (isAvailable) {
        for (const tBlock of relevantTeacherBlocks) {
          const bStart = toMinutes(tBlock.startTime);
          const bEnd = toMinutes(tBlock.endTime);
          if (isOverlap(slotStartMin, slotEndMin, bStart, bEnd)) {
            isAvailable = false;
            conflictReason = `Faculty Leave / Block: ${tBlock.reason}`;
            break;
          }
        }
      }

      // Check teacher existing sessions
      if (isAvailable) {
        for (const sess of relevantSessions) {
          if (sess.teacherId === teacherId) {
            const sessStart = toMinutes(sess.startTime);
            const sessDuration = sess.durationMinutes || 45;
            const sessEnd = sessStart + sessDuration;
            if (isOverlap(slotStartMin, slotEndMin, sessStart, sessEnd)) {
              isAvailable = false;
              conflictReason = `Faculty booked: ${sess.courseTitle} (${sess.studentName})`;
              break;
            }
          }
        }
      }

      // Check student existing sessions
      if (isAvailable && studentId) {
        for (const sess of relevantSessions) {
          if (sess.studentId === studentId) {
            const sessStart = toMinutes(sess.startTime);
            const sessDuration = sess.durationMinutes || 45;
            const sessEnd = sessStart + sessDuration;
            if (isOverlap(slotStartMin, slotEndMin, sessStart, sessEnd)) {
              isAvailable = false;
              conflictReason = `Student booked: ${sess.courseTitle}`;
              break;
            }
          }
        }
      }

      // Check Student Preferences
      let isStudentPreferred = false;
      if (studentPreferences) {
        const dayMatches =
          !studentPreferences.preferredDays ||
          studentPreferences.preferredDays.length === 0 ||
          studentPreferences.preferredDays.some(
            (pd) =>
              pd.toLowerCase() === dayName.toLowerCase() ||
              pd.toLowerCase() === dayAbbr.toLowerCase()
          );

        let timeMatches = false;
        if (studentPreferences.preferredTimeWindow) {
          const pStart = toMinutes(studentPreferences.preferredTimeWindow.start || '00:00');
          const pEnd = toMinutes(studentPreferences.preferredTimeWindow.end || '23:59');
          // Fully or largely inside preferred window
          if (slotStartMin >= pStart && slotEndMin <= pEnd) {
            timeMatches = true;
          }
        } else if (studentPreferences.preferredTimeSlot) {
          const pref = studentPreferences.preferredTimeSlot.toLowerCase();
          if (pref.includes('morn') && slotStartMin < 720) timeMatches = true;
          else if (pref.includes('afternoon') && slotStartMin >= 720 && slotStartMin < 1020) timeMatches = true;
          else if (pref.includes('eve') && slotStartMin >= 1020) timeMatches = true;
          else if (pref.includes(slotStartTime)) timeMatches = true;
        } else {
          timeMatches = true;
        }

        if (dayMatches && timeMatches) {
          isStudentPreferred = true;
        }
      }

      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        displayTime: `${formatTime12Hour(slotStartTime)} – ${formatTime12Hour(slotEndTime)}`,
        isAvailable,
        conflictReason,
        isStudentPreferred
      });
    }
  }

  return {
    slots,
    isDayBlocked: false,
    isConfigured: hasConfiguredWindows,
    message: !hasConfiguredWindows
      ? 'Showing standard conservatory daytime slots (09:00 - 20:00 IST).'
      : undefined
  };
}

// ==========================================
// 5. RECURRING SESSION SERIES GENERATION
// ==========================================

export interface CreateRecurringSeriesParams {
  enrollmentId: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number; // e.g. 45
  totalSessions: number; // e.g. 4, 8, 12
  frequencyWeeks?: number; // 1 = weekly, 2 = biweekly
  createdBy: string;
  creatorName?: string;
  creatorRole: 'admin' | 'teacher';
  notes?: string;
}

export interface RecurringValidationOccurrence {
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  isValid: boolean;
  conflictReason?: string;
}

export interface RecurringValidationReport {
  isValid: boolean;
  totalRequested: number;
  validCount: number;
  conflictCount: number;
  occurrences: RecurringValidationOccurrence[];
}

/**
 * Pre-validates every occurrence of a recurring series before creating any session
 */
export function validateRecurringSeriesOccurrences(
  params: {
    startDate: string;
    startTime: string;
    durationMinutes: number;
    totalSessions: number;
    frequencyWeeks?: number;
    teacherId: string;
    studentId: string;
  },
  existingSessions: ClassSession[],
  weeklyAvailability: WeeklyAvailabilitySlot[],
  teacherBlockedTimes: TeacherBlockedTime[],
  academyBlockedDates: AcademyBlockedDate[]
): RecurringValidationReport {
  const occurrences: RecurringValidationOccurrence[] = [];
  const freqDays = (params.frequencyWeeks || 1) * 7;
  const endTime = computeEndTime(params.startTime, params.durationMinutes);

  const [yStr, mStr, dStr] = params.startDate.split('-');
  let curDateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));

  for (let i = 0; i < params.totalSessions; i++) {
    const curYear = curDateObj.getFullYear();
    const curMonth = (curDateObj.getMonth() + 1).toString().padStart(2, '0');
    const curDay = curDateObj.getDate().toString().padStart(2, '0');
    const curDateStr = `${curYear}-${curMonth}-${curDay}`;

    // Run slot calculation for this exact occurrence
    const slotRes = calculateAvailableSlots({
      date: curDateStr,
      teacherId: params.teacherId,
      durationMinutes: params.durationMinutes,
      weeklyAvailability,
      teacherBlockedTimes,
      academyBlockedDates,
      existingSessions,
      studentId: params.studentId
    });

    let isValid = false;
    let conflictReason: string | undefined;

    if (slotRes.isDayBlocked) {
      isValid = false;
      conflictReason = slotRes.blockedReason || 'Academy closure';
    } else {
      const match = slotRes.slots.find((s) => s.startTime === params.startTime);
      if (!match) {
        isValid = false;
        conflictReason = slotRes.message || 'Time is outside faculty working hours on this date';
      } else if (!match.isAvailable) {
        isValid = false;
        conflictReason = match.conflictReason || 'Schedule conflict';
      } else {
        isValid = true;
      }
    }

    occurrences.push({
      date: curDateStr,
      startTime: params.startTime,
      endTime,
      displayTime: `${formatTime12Hour(params.startTime)} – ${formatTime12Hour(endTime)}`,
      isValid,
      conflictReason
    });

    // Advance to next recurring date
    curDateObj = new Date(curDateObj.getTime() + freqDays * 24 * 60 * 60 * 1000);
  }

  const validCount = occurrences.filter((o) => o.isValid).length;
  const conflictCount = occurrences.length - validCount;

  return {
    isValid: conflictCount === 0,
    totalRequested: params.totalSessions,
    validCount,
    conflictCount,
    occurrences
  };
}

/**
 * Creates an entire recurring series of classes with atomic validation
 */
export async function createRecurringSessionSeries(
  params: CreateRecurringSeriesParams,
  existingSessions: ClassSession[],
  weeklyAvailability: WeeklyAvailabilitySlot[],
  teacherBlockedTimes: TeacherBlockedTime[],
  academyBlockedDates: AcademyBlockedDate[]
): Promise<{
  success: boolean;
  seriesId?: string;
  createdCount?: number;
  report?: RecurringValidationReport;
  error?: string;
}> {
  // 1. Validate enrollment
  const valResult = await validateEnrollmentForSession(
    params.enrollmentId,
    params.creatorRole === 'teacher' ? params.createdBy : undefined
  );

  if (!valResult.isValid || !valResult.enrollment) {
    return { success: false, error: valResult.error || 'Enrollment validation failed.' };
  }

  const enrollment = valResult.enrollment;

  // 2. Pre-validate every occurrence in the series
  const report = validateRecurringSeriesOccurrences(
    {
      startDate: params.startDate,
      startTime: params.startTime,
      durationMinutes: params.durationMinutes,
      totalSessions: params.totalSessions,
      frequencyWeeks: params.frequencyWeeks || 1,
      teacherId: enrollment.teacherId!,
      studentId: enrollment.studentId
    },
    existingSessions,
    weeklyAvailability,
    teacherBlockedTimes,
    academyBlockedDates
  );

  if (!report.isValid) {
    const firstConflict = report.occurrences.find((o) => !o.isValid);
    return {
      success: false,
      report,
      error: `Conflict detected on ${firstConflict?.date}: ${firstConflict?.conflictReason || 'Unavailable'}. Please adjust dates or times.`
    };
  }

  // 3. All occurrences are valid! Generate series record and create sessions
  const seriesId = `series_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const createdSessionIds: string[] = [];
  const now = new Date().toISOString();

  try {
    for (let i = 0; i < report.occurrences.length; i++) {
      const occ = report.occurrences[i];
      const sessionId = `sess_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      const channelName = `room_${sessionId}`;
      const scheduledAt = buildISTTimestamp(occ.date, occ.startTime);

      const session: ClassSession = {
        id: sessionId,
        sessionId,
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        studentEmail: enrollment.studentEmail,
        teacherId: enrollment.teacherId!,
        teacherName: enrollment.teacherName || 'Assigned Guru',
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseName,
        program: enrollment.packageName,
        date: occ.date,
        startTime: occ.startTime,
        endTime: occ.endTime,
        scheduledAt,
        durationMinutes: params.durationMinutes,
        duration: params.durationMinutes,
        status: 'scheduled',
        sessionType: '1:1',
        timezone: 'Asia/Kolkata',
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
        roomId: channelName,
        meetingUrl: channelName,
        agoraChannelName: channelName,
        topic: `${enrollment.courseName} - Class ${i + 1} of ${report.occurrences.length}`,
        time: `${occ.startTime} - ${occ.endTime} IST`,
        lessonNotes: params.notes || '',
        seriesId,
        seriesIndex: i + 1,
        totalSeriesSessions: report.occurrences.length,
        isRecurring: true,
        recurringRule: (params.frequencyWeeks || 1) === 2 ? 'biweekly' : 'weekly'
      };

      const cleanSession = sanitizeFirestorePayload(session);
      await setDoc(doc(db, 'classes', sessionId), cleanSession);
      createdSessionIds.push(sessionId);
    }

    // 4. Save session_series summary record
    const seriesRecord: SessionSeriesRecord = {
      id: seriesId,
      seriesId,
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      teacherId: enrollment.teacherId!,
      teacherName: enrollment.teacherName || 'Assigned Guru',
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseName,
      totalSessions: report.occurrences.length,
      frequency: (params.frequencyWeeks || 1) === 2 ? 'biweekly' : 'weekly',
      startDate: params.startDate,
      startTime: params.startTime,
      durationMinutes: params.durationMinutes,
      status: 'active',
      sessionIds: createdSessionIds,
      createdAt: now,
      createdBy: params.createdBy
    };

    const cleanSeriesRecord = sanitizeFirestorePayload(seriesRecord);
    await setDoc(doc(db, 'session_series', seriesId), cleanSeriesRecord);

    await recordAuditLog(
      {
        id: params.createdBy,
        name: params.creatorName || (params.creatorRole === 'admin' ? 'Admin' : 'Teacher'),
        role: params.creatorRole
      },
      'Created Recurring Session Series',
      'class',
      seriesId,
      `Scheduled series of ${report.occurrences.length} sessions for "${enrollment.courseName}" (${enrollment.studentName} & ${enrollment.teacherName}) starting ${params.startDate} at ${params.startTime} IST`
    );

    return {
      success: true,
      seriesId,
      createdCount: createdSessionIds.length,
      report
    };
  } catch (err: any) {
    console.error('Error creating recurring session series:', err);
    return {
      success: false,
      error: err.message || 'Failed to create recurring session series.'
    };
  }
}

/**
 * ====================================================================
 * AGORA LIVE CLASSROOM SECURE TOKEN CLIENT
 * ====================================================================
 * High-priority security invariant:
 * - Token generation strictly resides server-side in server.ts
 * - Browser code NEVER accesses AGORA_APP_CERTIFICATE or RtcTokenBuilder
 * - If backend endpoints are temporarily unreachable, connection fails safely
 *   with an actionable retry message without leaking system internals.
 */
export interface RequestAgoraTokenParams {
  channelName: string;
  uid: number;
  role: 'publisher' | 'subscriber';
  classId: string;
  isTrial?: boolean;
}

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  authorized: boolean;
}

export async function requestAgoraToken(
  params: RequestAgoraTokenParams,
  idToken: string
): Promise<AgoraTokenResponse> {
  const endpoints = ['/api/generate-agora-token', '/api/agora/token'];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          channelName: params.channelName,
          uid: params.uid,
          role: params.role,
          classId: params.classId,
          isTrial: Boolean(params.isTrial)
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data as AgoraTokenResponse;
      }

      const errorData = await res.json().catch(() => ({}));
      lastError = new Error(errorData.error || `Authorization failed with status ${res.status}`);

      // Stop immediately if permission is denied by server authorization
      if (res.status === 403 || res.status === 401 || res.status === 400) {
        throw lastError;
      }
    } catch (err: any) {
      lastError = err;
      if (err.message && (err.message.includes('Forbidden') || err.message.includes('denied') || err.message.includes('restricted'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Agora live classroom studio is temporarily unavailable. Please retry.');
}

