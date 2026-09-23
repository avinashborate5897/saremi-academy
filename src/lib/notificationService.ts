import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  addDoc,
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppNotification, NotificationType } from '../types';

export interface DispatchNotificationRequest {
  userId: string; // Target user UID, 'admin', 'all_students', 'all_teachers'
  recipientRole?: 'student' | 'teacher' | 'admin' | 'all';
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string; // WhatsApp mobile number
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  channels?: ('in_app' | 'email' | 'whatsapp')[];
  metadata?: Record<string, any>;
}

/**
 * Dispatches notification via server-side secure endpoints (with client fallback)
 */
export async function dispatchNotification(params: DispatchNotificationRequest): Promise<void> {
  try {
    const res = await fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Server dispatch returned ${res.status}`);
    }
  } catch (err) {
    console.warn('[Notification Service] Server proxy unreachable, writing to Firestore directly:', err);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: params.userId,
        recipientRole: params.recipientRole || 'student',
        recipientName: params.recipientName || '',
        recipientEmail: params.recipientEmail || '',
        recipientPhone: params.recipientPhone || '',
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || '',
        channels: params.channels || ['in_app'],
        isRead: false,
        createdAt: serverTimestamp(),
        metadata: params.metadata || {}
      });
    } catch (dbErr) {
      console.error('[Notification Service] Direct Firestore write failed:', dbErr);
    }
  }
}

/**
 * Dispatches targeted or broadcast Admin Announcement
 */
export async function sendAdminAnnouncement(params: {
  audience: 'all_students' | 'all_teachers' | 'selected_users' | 'one_student' | 'one_teacher';
  targetUserIds?: string[];
  targetUserId?: string;
  title: string;
  message: string;
  link?: string;
  channels?: ('in_app' | 'email' | 'whatsapp')[];
}): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch('/api/notifications/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch announcement');
    return data;
  } catch (err: any) {
    console.error('[Admin Announcement Dispatch Error]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribes to notifications for a specific user (Student or Teacher)
 */
export function subscribeToUserNotifications(
  userId: string,
  roleOrCallback: 'student' | 'teacher' | ((notifications: AppNotification[]) => void),
  optionalCallback?: (notifications: AppNotification[]) => void
) {
  const userRole: 'student' | 'teacher' = typeof roleOrCallback === 'string' ? roleOrCallback : 'student';
  const callback = typeof roleOrCallback === 'function' ? roleOrCallback : (optionalCallback || (() => {}));

  if (!userId) {
    callback([]);
    return () => {};
  }

  // Listen to this user's notifications
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || userId,
          recipientRole: data.recipientRole || userRole,
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          recipientPhone: data.recipientPhone,
          title: data.title || 'Notification',
          message: data.message || '',
          type: data.type || 'system',
          link: data.link,
          isRead: Boolean(data.isRead),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          channels: data.channels || ['in_app'],
          deliveryStatus: data.deliveryStatus,
          metadata: data.metadata
        };
      });
      callback(items);
    },
    (err) => {
      console.warn('Notification subscription notice (using local fallback if indexed query pending):', err);
      // Fallback query without orderBy to ensure zero index issues
      const fallbackQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
      return onSnapshot(
        fallbackQuery,
        (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
          callback(items);
        },
        (fallbackErr) => {
          console.warn('Fallback notifications listener notice:', fallbackErr.message);
          callback([]);
        }
      );
    }
  );
}

/**
 * Subscribes to Admin notifications (system alerts, demo requests, payments, teacher changes, failures)
 */
export function subscribeToAdminNotifications(callback: (notifications: AppNotification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientRole', '==', 'admin'),
    orderBy('createdAt', 'desc'),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || 'admin',
          recipientRole: 'admin',
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          recipientPhone: data.recipientPhone,
          title: data.title || 'Admin Alert',
          message: data.message || '',
          type: data.type || 'admin_system_event',
          link: data.link,
          isRead: Boolean(data.isRead),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          channels: data.channels || ['in_app'],
          deliveryStatus: data.deliveryStatus,
          metadata: data.metadata
        };
      });
      callback(items);
    },
    (err) => {
      console.warn('Admin notifications subscription fallback query:', err);
      // Fallback query without composite ordering
      const fallbackQuery = query(collection(db, 'notifications'), where('recipientRole', '==', 'admin'));
      return onSnapshot(
        fallbackQuery,
        (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
          callback(items);
        },
        (fallbackErr) => {
          console.warn('Admin fallback notifications listener notice:', fallbackErr.message);
          callback([]);
        }
      );
    }
  );
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }
}

/**
 * Mark all user notifications as read in bulk
 */
export async function markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
  try {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    console.error('Failed to delete notification:', err);
  }
}

// =========================================================================
// Specialized Pre-built Notification Triggers for Saremi Academy Lifecycle
// =========================================================================

/**
 * 1. Demo Booking Confirmation
 */
export async function notifyDemoBookingCreated(params: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  program: string;
  studentId?: string;
}) {
  const { studentName, studentEmail, studentPhone, courseTitle, program, studentId } = params;

  // Student Notification
  await dispatchNotification({
    userId: studentId || `guest_${studentEmail || Date.now()}`,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'demo_booking_confirmation',
    title: 'Demo Class Request Confirmed',
    message: `Hi ${studentName},\nWe have received your 1:1 Free Demo booking request for ${courseTitle} (${program}).\nOur academic coordinator is contacting you on WhatsApp (${studentPhone}) to confirm the class schedule with your maestro.`,
    link: '/student/classes',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `New Demo Booking: ${studentName}`,
    message: `${studentName} requested a 1:1 demo for ${courseTitle} (${program}). Phone/WhatsApp: ${studentPhone}, Email: ${studentEmail}.`,
    type: 'admin_new_demo_booking',
    link: '/admin/trials',
    channels: ['in_app']
  });
}

/**
 * 2. Course Enrollment / Payment Confirmation
 */
export async function notifyCourseEnrollmentConfirmed(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseTitle: string;
  packageName: string;
  amount: number;
  currency?: string;
  teacherId?: string;
  teacherName?: string;
}) {
  const { studentId, studentName, studentEmail, studentPhone, courseTitle, packageName, amount, currency = 'INR', teacherId, teacherName } = params;

  // Student Notification
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'course_enrollment_confirmation',
    title: 'Enrollment & Payment Confirmed!',
    message: `Congratulations ${studentName}! Your enrollment in ${courseTitle} (${packageName}) is confirmed.\nPayment received: ₹${amount.toLocaleString('en-IN')}.\nYour 1:1 credits are active. Schedule your sessions now via your student dashboard.`,
    link: '/student/classes',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `New Enrollment: ${studentName}`,
    message: `${studentName} enrolled in ${courseTitle} (${packageName}) with payment ₹${amount.toLocaleString('en-IN')}.`,
    type: 'admin_new_enrollment',
    link: '/admin/enrollments',
    channels: ['in_app']
  });

  // If teacher already assigned
  if (teacherId) {
    await dispatchNotification({
      userId: teacherId,
      recipientRole: 'teacher',
      recipientName: teacherName,
      type: 'teacher_student_assigned',
      title: 'New Student Enrolled in Your Discipline',
      message: `${studentName} has enrolled in ${courseTitle} and has been assigned to your studio roster.`,
      link: '/teacher/students',
      channels: ['in_app', 'email']
    });
  }
}

/**
 * 3. Class Booking / Scheduled
 */
export async function notifyClassScheduled(params: {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  teacherPhone?: string;
  courseTitle: string;
  scheduledAt: string;
  dateStr: string;
  timeStr: string;
  meetingUrl?: string;
}) {
  const { studentId, studentName, studentEmail, studentPhone, teacherId, teacherName, teacherEmail, teacherPhone, courseTitle, dateStr, timeStr, meetingUrl } = params;

  const joinLink = meetingUrl ? `/live/${meetingUrl}` : '/student/classes';

  // Student Notification
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'class_booking',
    title: `1:1 Class Confirmed: ${courseTitle}`,
    message: `Your live session with ${teacherName} is scheduled for ${dateStr} at ${timeStr}.\nClassroom Room: ${meetingUrl || 'Saremi Live Studio'}.`,
    link: joinLink,
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Teacher Notification
  await dispatchNotification({
    userId: teacherId,
    recipientRole: 'teacher',
    recipientName: teacherName,
    recipientEmail: teacherEmail,
    recipientPhone: teacherPhone,
    type: 'teacher_class_assigned',
    title: `New Class Scheduled with ${studentName}`,
    message: `You have an upcoming 1:1 session for ${courseTitle} with ${studentName} on ${dateStr} at ${timeStr}.`,
    link: `/live/${meetingUrl || 'room'}`,
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `Class Scheduled: ${studentName} & ${teacherName}`,
    message: `${courseTitle} session booked for ${dateStr} at ${timeStr}.`,
    type: 'admin_booking_changed',
    link: '/admin/classes',
    channels: ['in_app']
  });
}

/**
 * 4. Upcoming Class Reminder (with Google Meet / Agora studio link)
 */
export async function notifyClassReminder(params: {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  dateStr: string;
  timeStr: string;
  meetingUrl: string;
}) {
  const { studentId, studentName, studentEmail, studentPhone, teacherId, teacherName, courseTitle, timeStr, meetingUrl } = params;

  // Student Reminder
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'upcoming_class_reminder',
    title: `Reminder: Live Class in 1 Hour`,
    message: `Your 1:1 music class with ${teacherName} begins at ${timeStr}.\nClick to enter your conservatory room: /live/${meetingUrl}`,
    link: `/live/${meetingUrl}`,
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Teacher Reminder
  await dispatchNotification({
    userId: teacherId,
    recipientRole: 'teacher',
    recipientName: teacherName,
    type: 'upcoming_class_reminder',
    title: `Reminder: 1:1 Class with ${studentName} at ${timeStr}`,
    message: `Your live session for ${courseTitle} starts soon. Prepare your tanpura and audio stream.`,
    link: `/live/${meetingUrl}`,
    channels: ['in_app']
  });
}

/**
 * 5. Class Rescheduled
 */
export async function notifyClassRescheduled(params: {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  teacherPhone?: string;
  courseTitle: string;
  newDateStr: string;
  newTimeStr: string;
  reason?: string;
  meetingUrl?: string;
}) {
  const { studentId, studentName, studentEmail, studentPhone, teacherId, teacherName, teacherEmail, teacherPhone, courseTitle, newDateStr, newTimeStr, reason, meetingUrl } = params;

  // Student Notification
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'class_rescheduled',
    title: `Class Rescheduled: ${courseTitle}`,
    message: `Your 1:1 session with ${teacherName} has been rescheduled to ${newDateStr} at ${newTimeStr}.${reason ? `\nReason: ${reason}` : ''}`,
    link: meetingUrl ? `/live/${meetingUrl}` : '/student/classes',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Teacher Notification
  await dispatchNotification({
    userId: teacherId,
    recipientRole: 'teacher',
    recipientName: teacherName,
    recipientEmail: teacherEmail,
    recipientPhone: teacherPhone,
    type: 'teacher_class_rescheduled',
    title: `Class Rescheduled with ${studentName}`,
    message: `Session moved to ${newDateStr} at ${newTimeStr}.${reason ? ` Note: ${reason}` : ''}`,
    link: '/teacher/schedule',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `Class Rescheduled: ${studentName}`,
    message: `Class with ${teacherName} moved to ${newDateStr} at ${newTimeStr}.`,
    type: 'admin_booking_changed',
    link: '/admin/classes',
    channels: ['in_app']
  });
}

/**
 * 6. Class Cancelled
 */
export async function notifyClassCancelled(params: {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  teacherPhone?: string;
  courseTitle: string;
  dateStr: string;
  timeStr: string;
  reason?: string;
}) {
  const { studentId, studentName, studentEmail, studentPhone, teacherId, teacherName, teacherEmail, teacherPhone, courseTitle, dateStr, timeStr, reason } = params;

  // Student Notification
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'class_cancelled',
    title: `Class Cancelled: ${courseTitle}`,
    message: `Your class scheduled for ${dateStr} at ${timeStr} has been cancelled.${reason ? ` (${reason})` : ''}\nYour session credit remains intact in your account.`,
    link: '/student/classes',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Teacher Notification
  await dispatchNotification({
    userId: teacherId,
    recipientRole: 'teacher',
    recipientName: teacherName,
    recipientEmail: teacherEmail,
    recipientPhone: teacherPhone,
    type: 'teacher_class_cancelled',
    title: `Class Cancelled: ${studentName}`,
    message: `The 1:1 session with ${studentName} on ${dateStr} at ${timeStr} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    link: '/teacher/schedule',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `Class Cancelled: ${studentName}`,
    message: `Session for ${courseTitle} on ${dateStr} was cancelled.`,
    type: 'admin_booking_changed',
    link: '/admin/classes',
    channels: ['in_app']
  });
}

/**
 * 7. Teacher Assigned to Student
 */
export async function notifyTeacherAssigned(params: {
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  teacherPhone?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  courseTitle: string;
}) {
  const { teacherId, teacherName, teacherEmail, teacherPhone, studentId, studentName, studentEmail, studentPhone, courseTitle } = params;

  // Teacher Notification
  await dispatchNotification({
    userId: teacherId,
    recipientRole: 'teacher',
    recipientName: teacherName,
    recipientEmail: teacherEmail,
    recipientPhone: teacherPhone,
    type: 'teacher_student_assigned',
    title: `New Student Assigned: ${studentName}`,
    message: `${studentName} has been assigned to your studio for ${courseTitle}. Contact details: ${studentPhone || studentEmail || 'In Roster'}.`,
    link: '/teacher/students',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Student Notification
  await dispatchNotification({
    userId: studentId,
    recipientRole: 'student',
    recipientName: studentName,
    recipientEmail: studentEmail,
    recipientPhone: studentPhone,
    type: 'teacher_student_assigned',
    title: `Guru Assigned: ${teacherName}`,
    message: `Maestro ${teacherName} has been assigned as your instructor for ${courseTitle}. Check your schedule to select your preferred class time slots.`,
    link: '/student/classes',
    channels: ['in_app', 'email', 'whatsapp']
  });

  // Admin Notification
  await dispatchNotification({
    userId: 'admin',
    recipientRole: 'admin',
    title: `Teacher Assigned: ${teacherName} to ${studentName}`,
    message: `Discipline: ${courseTitle}.`,
    type: 'admin_teacher_assigned',
    link: '/admin/trials',
    channels: ['in_app']
  });
}
