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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  TeacherProfile,
  Course,
  Order,
  Booking,
  ClassSession,
  Assignment,
  Certificate,
  Masterclass,
  Lead,
  EnrollmentRecord,
  Coupon,
  AttendanceRecord,
  AuditLog,
  AdminUser,
  CMSContent,
  SupportTicket,
  ShowcaseEvent,
  RefundRecord,
  Invoice,
  AcademySettings
} from '../types';
import { SaremiPackage, OFFICIAL_PACKAGES } from '../data/pricingData';
import { INITIAL_COURSES } from './initialData';
import { TEACHERS_DATA } from '../data/coursesData';

/**
 * ====================================================================
 * AUDIT LOGGING SERVICE
 * ====================================================================
 */
export async function recordAuditLog(
  actor: { id: string; name: string; email?: string; role: string },
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const log: AuditLog = {
    id,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    details,
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'audit_logs', id), log);
  } catch (err) {
    console.warn('Audit log write fallback:', err);
  }
}

export function subscribeToAuditLogs(onUpdate: (logs: AuditLog[]) => void): () => void {
  return onSnapshot(
    collection(db, 'audit_logs'),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onUpdate(items);
      } else {
        onUpdate([]);
      }
    },
    (err) => console.warn('Audit logs listener note:', err.message)
  );
}

/**
 * ====================================================================
 * REAL-TIME ADMIN DASHBOARD STATS
 * ====================================================================
 */
export interface AdminDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeCourses: number;
  upcomingClasses: number;
  todayClasses: number;
  pendingTrials: number;
  newLeads: number;
  successfulPayments: number;
  pendingPayments: number;
  monthlyRevenue: number;
  totalRevenue: number;
  activePackagesCount: number;
}

export function subscribeToAdminStats(onUpdate: (stats: AdminDashboardStats) => void): () => void {
  // Listen to users, orders, classes, leads, bookings with robust error handling
  const unsubUsers = onSnapshot(collection(db, 'users'), () => recalculate(), (err) => console.warn('Users stats listener note:', err.message));
  const unsubOrders = onSnapshot(collection(db, 'orders'), () => recalculate(), (err) => console.warn('Orders stats listener note:', err.message));
  const unsubClasses = onSnapshot(collection(db, 'classes'), () => recalculate(), (err) => console.warn('Classes stats listener note:', err.message));
  const unsubLeads = onSnapshot(collection(db, 'leads'), () => recalculate(), (err) => console.warn('Leads stats listener note:', err.message));
  const unsubBookings = onSnapshot(collection(db, 'bookings'), () => recalculate(), (err) => console.warn('Bookings stats listener note:', err.message));

  let isCancelled = false;

  async function recalculate() {
    if (isCancelled) return;
    try {
      const [usersSnap, ordersSnap, classesSnap, leadsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'bookings'))
      ]);

      const users = usersSnap.docs.map((d) => d.data() as UserProfile);
      const orders = ordersSnap.docs.map((d) => d.data() as Order);
      const classes = classesSnap.docs.map((d) => d.data() as ClassSession);
      const leads = leadsSnap.docs.map((d) => d.data() as Lead);
      const bookings = bookingsSnap.docs.map((d) => d.data() as Booking);

      const todayStr = new Date().toISOString().split('T')[0];

      const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
      const monthlyRevenue = paidOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt || Date.now());
          const now = new Date();
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const realStudentsCount = users.filter((u) => u.role === 'student' || (!u.role && u.email && !u.email.includes('admin'))).length;
      const realActiveStudentsCount = users.filter((u) => (u.enrolledCourses && u.enrolledCourses.length > 0) || (u.role === 'student' && u.status === 'active')).length;
      const realTeachersCount = users.filter((u) => u.role === 'teacher').length;

      const stats: AdminDashboardStats = {
        totalStudents: realStudentsCount,
        activeStudents: realActiveStudentsCount,
        totalTeachers: realTeachersCount,
        activeCourses: INITIAL_COURSES.length || 0,
        upcomingClasses: classes.filter((c) => c.status === 'scheduled' || c.status === 'live').length,
        todayClasses: classes.filter((c) => c.scheduledAt?.startsWith(todayStr)).length,
        pendingTrials: bookings.filter((b) => b.status === 'pending' || (b.status as string) === 'unassigned').length,
        newLeads: leads.filter((l) => l.status === 'New' || l.status === 'Contacted').length,
        successfulPayments: paidOrders.length,
        pendingPayments: orders.filter((o) => o.paymentStatus === 'unpaid').length,
        monthlyRevenue: monthlyRevenue,
        totalRevenue: totalRevenue,
        activePackagesCount: OFFICIAL_PACKAGES.filter((p) => p.active).length
      };

      onUpdate(stats);
    } catch (e) {
      console.warn('Dashboard stats calc note:', e);
    }
  }

  // Initial calculation
  recalculate();

  return () => {
    isCancelled = true;
    unsubUsers();
    unsubOrders();
    unsubClasses();
    unsubLeads();
    unsubBookings();
  };
}

/**
 * ====================================================================
 * STUDENTS MANAGEMENT
 * ====================================================================
 */
export function subscribeToStudents(onUpdate: (students: UserProfile[]) => void): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      if (!snapshot.empty) {
        const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
        onUpdate(users);
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function saveStudent(student: Partial<UserProfile> & { id: string }): Promise<void> {
  const ref = doc(db, 'users', student.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, {
      ...student,
      updatedAt: new Date().toISOString()
    });
  } else {
    await setDoc(ref, {
      ...student,
      role: student.role || 'student',
      status: student.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

export async function createStudentWithAccount(
  adminToken: string,
  payload: {
    name: string;
    email: string;
    phone?: string;
    initialCourse?: string;
    level?: string;
    assignedTeacherId?: string;
    assignedTeacherName?: string;
    temporaryPassword?: string;
    requirePasswordChange?: boolean;
    notes?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; student: any; temporaryPassword?: string }> {
  let backendResult: any = null;
  const res = await fetch('/api/admin/create-student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to provision student authentication account (${res.status})`);
  }

  backendResult = await res.json();
  if (!backendResult?.student?.id) {
    throw new Error('Student account provisioning did not return a valid Firebase Authentication UID.');
  }

  const sanitizedEmail = payload.email.trim().toLowerCase();
  const studentUid = backendResult.student.id;
  const studentCode = backendResult.student.studentId || `SM-STU-${Date.now().toString().slice(-4)}`;
  const tempPass = payload.temporaryPassword || backendResult.temporaryPassword || `SaremiStudent@${Math.floor(100 + Math.random() * 900)}`;

  const courseInstrument = (payload.initialCourse || '').toLowerCase().includes('guitar')
    ? 'guitar'
    : (payload.initialCourse || '').toLowerCase().includes('tabla')
    ? 'tabla'
    : (payload.initialCourse || '').toLowerCase().includes('keyboard') || (payload.initialCourse || '').toLowerCase().includes('piano')
    ? 'piano'
    : 'vocals';

  const userProfile: UserProfile = {
    id: studentUid,
    studentId: studentCode,
    email: sanitizedEmail,
    name: payload.name.trim(),
    role: 'student',
    status: 'active',
    phone: payload.phone?.trim() || '',
    whatsapp: payload.phone?.trim() || '',
    preferredInstrument: courseInstrument,
    skillLevel: (payload.level as any) || 'Beginner Foundation',
    enrolledCourses: [
      {
        courseId: `course_${Date.now()}`,
        courseTitle: payload.initialCourse || 'Hindustani Classical Vocal',
        instrument: courseInstrument,
        enrolledAt: new Date().toISOString(),
        level: (payload.level as any) || 'Beginner Foundation',
        sessionsCompleted: 0,
        totalSessions: 16,
        remainingSessions: 16,
        usedSessions: 0,
        teacherId: payload.assignedTeacherId || 'teacher-sunanda',
        teacherName: payload.assignedTeacherName || 'Senior Conservatory Faculty',
        nextSessionDate: 'To be scheduled',
        nextSessionTime: 'TBD',
        meetingUrl: `saremi-room-${studentUid.slice(0, 8)}`,
        roomId: `saremi-room-${studentUid.slice(0, 8)}`
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Direct Client-Side Firestore Persistence with Admin Rules
  await setDoc(doc(db, 'users', studentUid), userProfile, { merge: true });

  await recordAuditLog(
    { id: 'admin', name: 'Staff Administrator', role: 'admin' },
    'Created Student Account',
    'student',
    studentUid,
    `Created student account for ${payload.name.trim()} (${sanitizedEmail})`
  );

  return {
    success: true,
    student: {
      ...userProfile,
      temporaryPassword: tempPass,
      requiresPasswordChange: payload.requirePasswordChange !== false
    },
    temporaryPassword: tempPass
  };
}

export async function resetStudentPasswordService(
  adminToken: string,
  studentUid: string,
  newPassword?: string
): Promise<{ success: boolean; temporaryPassword: string }> {
  const res = await fetch('/api/admin/reset-student-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ studentUid, newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset student password');
  }
  return data;
}

/**
 * ====================================================================
 * TEACHERS MANAGEMENT
 * ====================================================================
 */
export function subscribeToTeachers(onUpdate: (teachers: TeacherProfile[]) => void): () => void {
  return onSnapshot(
    collection(db, 'teachers'),
    async (snapshot) => {
      if (!snapshot.empty) {
        const rawList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherProfile));
        const activeOnly = rawList.filter((t) => t.id && t.active !== false && (t as any).status !== 'inactive');

        try {
          // Fetch valid teacher user profiles to ensure 1:1 account linkage
          const userSnaps = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
          const validTeacherUserMap = new Map<string, any>();
          userSnaps.docs.forEach((d) => {
            const data = d.data();
            if (data.status !== 'inactive' && data.status !== 'banned') {
              validTeacherUserMap.set(d.id, data);
            }
          });

          // Only include teachers whose ID matches a verified active /users document with role='teacher'
          const verifiedList = activeOnly.filter((t) => validTeacherUserMap.has(t.id)).map((t) => {
            const userData = validTeacherUserMap.get(t.id);
            return {
              ...t,
              name: t.name || userData?.name || 'Faculty Guru',
              email: t.email || userData?.email || '',
              phone: t.phone || userData?.phone || ''
            };
          });

          onUpdate(verifiedList);
        } catch (queryErr) {
          console.warn('[subscribeToTeachers] Users cross-check note:', queryErr);
          onUpdate(activeOnly);
        }
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function saveTeacher(teacher: TeacherProfile): Promise<void> {
  await setDoc(doc(db, 'teachers', teacher.id), teacher, { merge: true });
}

export async function createTeacherWithAccount(
  adminToken: string,
  payload: {
    name: string;
    email: string;
    temporaryPassword?: string;
    phone?: string;
    specialization?: string;
    title?: string;
    experience?: number;
    languages?: string[];
    courses?: string[];
    bio?: string;
    photo?: string;
    requirePasswordChange?: boolean;
  }
): Promise<{ success: boolean; teacher: any; temporaryPassword?: string }> {
  let backendResult: any = null;
  const res = await fetch('/api/admin/create-teacher', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to provision faculty authentication account (${res.status})`);
  }

  backendResult = await res.json();
  if (!backendResult?.teacher?.id) {
    throw new Error('Faculty account provisioning did not return a valid Firebase Authentication UID.');
  }

  const sanitizedEmail = payload.email.trim().toLowerCase();
  const teacherUid = backendResult.teacher.id;
  const teacherCode = backendResult.teacher.teacherId || `SM-TEA-${Date.now().toString().slice(-4)}`;
  const tempPass = payload.temporaryPassword || backendResult.temporaryPassword || `SaremiGuru@${Math.floor(100 + Math.random() * 900)}`;

  const userProfile: UserProfile = {
    id: teacherUid,
    email: sanitizedEmail,
    name: payload.name.trim(),
    role: 'teacher',
    phone: payload.phone?.trim() || '',
    whatsapp: payload.phone?.trim() || '',
    teacherId: teacherCode,
    specialization: payload.specialization?.trim() || 'Indian Classical Music',
    status: 'active',
    bio: payload.bio?.trim() || '',
    photoURL: payload.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const teacherDoc: TeacherProfile = {
    id: teacherUid,
    name: payload.name.trim(),
    email: sanitizedEmail,
    phone: payload.phone?.trim() || '',
    title: payload.title?.trim() || 'Conservatory Guru / Mentor',
    specialization: payload.specialization?.trim() || 'Indian Classical Music',
    experience: Number(payload.experience) || 5,
    languages: Array.isArray(payload.languages) ? payload.languages : ['Hindi', 'English'],
    courses: Array.isArray(payload.courses) ? payload.courses : ['Hindustani Classical Vocals'],
    rating: 5.0,
    active: true,
    photo: payload.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: payload.bio?.trim() || '',
    qualifications: ['Sangeet Visharad / Conservatory Master'],
    availability: ['Mon-Sat IST Evenings'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Direct Client-Side Firestore Persistence with Admin Rules
  await setDoc(doc(db, 'users', teacherUid), userProfile, { merge: true });
  await setDoc(doc(db, 'teachers', teacherUid), teacherDoc, { merge: true });

  await recordAuditLog(
    { id: 'admin', name: 'Staff Administrator', role: 'admin' },
    'Created Real Faculty Account',
    'teacher',
    teacherUid,
    `Created verified teacher account for Guru ${payload.name.trim()} (${sanitizedEmail})`
  );

  return {
    success: true,
    teacher: {
      ...teacherDoc,
      temporaryPassword: tempPass,
      requiresPasswordChange: payload.requirePasswordChange !== false
    },
    temporaryPassword: tempPass
  };
}

export async function resetTeacherPasswordService(
  adminToken: string,
  teacherUid: string,
  newPassword?: string
): Promise<{ success: boolean; temporaryPassword: string }> {
  const res = await fetch('/api/admin/reset-teacher-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ teacherUid, newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset teacher password');
  }
  return data;
}

/**
 * ====================================================================
 * COUPONS MANAGEMENT
 * ====================================================================
 */
export function subscribeToCoupons(onUpdate: (coupons: Coupon[]) => void): () => void {
  return onSnapshot(
    collection(db, 'coupons'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
        onUpdate(list);
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  await setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true });
}

export async function deleteCoupon(couponId: string): Promise<void> {
  await deleteDoc(doc(db, 'coupons', couponId));
}

/**
 * ====================================================================
 * LIVE CLASSES & SCHEDULING (WITH CONFLICT DETECTION)
 * ====================================================================
 */
export function subscribeToLiveClasses(onUpdate: (classes: ClassSession[]) => void): () => void {
  return onSnapshot(
    collection(db, 'classes'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassSession));
        list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        onUpdate(list);
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function saveLiveClass(cls: ClassSession): Promise<void> {
  await setDoc(doc(db, 'classes', cls.id), cls, { merge: true });
}

export function detectScheduleConflicts(
  newSession: { teacherId: string; studentId: string; scheduledAt: string; durationMinutes: number; id?: string },
  existingClasses: ClassSession[]
): { hasConflict: boolean; reason?: string } {
  const newStart = new Date(newSession.scheduledAt).getTime();
  const newEnd = newStart + newSession.durationMinutes * 60 * 1000;

  for (const item of existingClasses) {
    if (item.id === newSession.id) continue;
    if (item.status === 'cancelled') continue;

    const itemStart = new Date(item.scheduledAt).getTime();
    const itemEnd = itemStart + (item.durationMinutes || 45) * 60 * 1000;

    // Overlap condition
    const isOverlapping = newStart < itemEnd && newEnd > itemStart;
    if (isOverlapping) {
      if (item.teacherId === newSession.teacherId) {
        return {
          hasConflict: true,
          reason: `Faculty member (${item.teacherName}) already has class "${item.courseTitle}" scheduled during this time (${new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
        };
      }
      if (item.studentId === newSession.studentId) {
        return {
          hasConflict: true,
          reason: `Student (${item.studentName}) is already booked for another session at this time.`
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * ====================================================================
 * ATTENDANCE MANAGEMENT
 * ====================================================================
 */
export function subscribeToAttendance(onUpdate: (records: AttendanceRecord[]) => void): () => void {
  return onSnapshot(
    collection(db, 'attendance'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
        onUpdate(list);
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  await setDoc(doc(db, 'attendance', record.id), record, { merge: true });
}

/**
 * ====================================================================
 * CERTIFICATES MANAGEMENT
 * ====================================================================
 */
export function subscribeToCertificates(onUpdate: (certs: Certificate[]) => void): () => void {
  return onSnapshot(
    collection(db, 'certificates'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate));
        onUpdate(list);
      } else {
        onUpdate([]);
      }
    },
    () => onUpdate([])
  );
}

export async function issueCertificate(cert: Certificate): Promise<void> {
  await setDoc(doc(db, 'certificates', cert.id), cert, { merge: true });
}
export const saveCertificate = issueCertificate;

export async function revokeCertificate(certId: string): Promise<void> {
  await deleteDoc(doc(db, 'certificates', certId));
}

/**
 * ====================================================================
 * MASTERCLASSES MANAGEMENT
 * ====================================================================
 */
export function subscribeToMasterclasses(onUpdate: (mcs: Masterclass[]) => void): () => void {
  return onSnapshot(
    collection(db, 'masterclasses'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Masterclass));
        onUpdate(list);
      } else {
        onUpdate(DEFAULT_MASTERCLASSES);
      }
    },
    () => onUpdate(DEFAULT_MASTERCLASSES)
  );
}

export async function saveMasterclass(mc: Masterclass): Promise<void> {
  await setDoc(doc(db, 'masterclasses', mc.id), mc, { merge: true });
}

/**
 * ====================================================================
 * CMS CONTENT
 * ====================================================================
 */
export function subscribeToCMS(onUpdate: (content: CMSContent) => void): () => void {
  return onSnapshot(
    doc(db, 'cms', 'main_content'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CMSContent);
      } else {
        onUpdate(DEFAULT_CMS_CONTENT);
      }
    },
    () => onUpdate(DEFAULT_CMS_CONTENT)
  );
}
export const subscribeToCMSContent = subscribeToCMS;

export async function updateCMSContent(content: CMSContent): Promise<void> {
  await setDoc(doc(db, 'cms', 'main_content'), content, { merge: true });
}
export const saveCMSContent = updateCMSContent;

/**
 * ====================================================================
 * SUPPORT TICKETS
 * ====================================================================
 */
export function subscribeToSupportTickets(onUpdate: (tickets: SupportTicket[]) => void): () => void {
  return onSnapshot(
    collection(db, 'support_tickets'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
        onUpdate(list);
      } else {
        onUpdate(DEFAULT_SUPPORT_TICKETS);
      }
    },
    () => onUpdate(DEFAULT_SUPPORT_TICKETS)
  );
}

export async function saveSupportTicket(ticket: SupportTicket): Promise<void> {
  await setDoc(doc(db, 'support_tickets', ticket.id), ticket, { merge: true });
}

/**
 * ====================================================================
 * ACADEMY SETTINGS
 * ====================================================================
 */
export function subscribeToAcademySettings(onUpdate: (settings: AcademySettings) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'general'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AcademySettings);
      } else {
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    () => onUpdate(DEFAULT_SETTINGS)
  );
}

export async function updateAcademySettings(settings: AcademySettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
}
export const saveAcademySettings = updateAcademySettings;

/**
 * ====================================================================
 * ADMIN USER ACCOUNTS MANAGEMENT
 * ====================================================================
 */
export function subscribeToAdmins(onUpdate: (admins: AdminUser[]) => void): () => void {
  return onSnapshot(
    collection(db, 'admin_staff'),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser));
        onUpdate(list);
      } else {
        onUpdate(DEFAULT_ADMIN_STAFF);
      }
    },
    () => onUpdate(DEFAULT_ADMIN_STAFF)
  );
}
export const subscribeToAdminUsers = subscribeToAdmins;

export async function saveAdminStaff(admin: AdminUser): Promise<void> {
  await setDoc(doc(db, 'admin_staff', admin.id), admin, { merge: true });
}
export const saveAdminUser = saveAdminStaff;

/**
 * ====================================================================
 * CSV EXPORT HELPER
 * ====================================================================
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * ====================================================================
 * DEFAULT SEED DATA
 * ====================================================================
 */
export const DEFAULT_STUDENTS: UserProfile[] = [
  {
    id: 'std_01',
    studentId: 'SM-STU-1082',
    email: 'aarav.sharma@gmail.com',
    name: 'Aarav Sharma',
    role: 'student',
    status: 'active',
    phone: '+91 98201 44521',
    createdAt: '2026-08-10T10:00:00Z',
    enrolledCourses: [
      {
        courseId: 'course-hindustani-vocal',
        courseTitle: 'Hindustani Classical Vocal',
        instrument: 'vocals',
        enrolledAt: '2026-08-10T10:00:00Z',
        level: 'Developing',
        sessionsCompleted: 14,
        totalSessions: 24,
        teacherName: 'Vidushi Sunanda Sharma',
        nextSessionDate: 'Thu, Sep 18',
        nextSessionTime: '06:00 PM IST',
        meetingUrl: 'saremi-vocal-101',
        roomId: 'saremi-vocal-101'
      }
    ]
  },
  {
    id: 'std_02',
    studentId: 'SM-STU-2041',
    email: 'meera.nair@outlook.com',
    name: 'Meera Nair',
    role: 'student',
    status: 'active',
    phone: '+91 98450 11234',
    createdAt: '2026-07-15T09:30:00Z',
    enrolledCourses: [
      {
        courseId: 'course-acoustic-guitar',
        courseTitle: 'Acoustic Guitar Mastery',
        instrument: 'guitar',
        enrolledAt: '2026-07-15T09:30:00Z',
        level: 'Foundation',
        sessionsCompleted: 8,
        totalSessions: 16,
        teacherName: 'Pandit Amitava Sen',
        nextSessionDate: 'Fri, Sep 19',
        nextSessionTime: '05:00 PM IST',
        meetingUrl: 'saremi-guitar-202',
        roomId: 'saremi-guitar-202'
      }
    ]
  },
  {
    id: 'std_03',
    studentId: 'SM-STU-3095',
    email: 'rohan.verma@gmail.com',
    name: 'Rohan Verma',
    role: 'student',
    status: 'active',
    phone: '+91 97112 88990',
    createdAt: '2026-09-01T14:00:00Z',
    enrolledCourses: [
      {
        courseId: 'course-tabla-rhythm',
        courseTitle: 'Tabla Rhythm & Bols',
        instrument: 'tabla',
        enrolledAt: '2026-09-01T14:00:00Z',
        level: 'Foundation',
        sessionsCompleted: 2,
        totalSessions: 8,
        teacherName: 'Pt. Anindo Chatterjee',
        nextSessionDate: 'Sat, Sep 20',
        nextSessionTime: '11:00 AM IST',
        meetingUrl: 'saremi-tabla-303',
        roomId: 'saremi-tabla-303'
      }
    ]
  }
];

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: 'teacher-sunanda',
    teacherId: 'SM-TEA-1082',
    name: 'Vidushi Sunanda Sharma',
    title: 'Senior Guru • Banaras Gharana',
    specialization: 'Hindustani Classical & Thumri',
    experience: 22,
    languages: ['Hindi', 'English', 'Bengali'],
    rating: 4.95,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Renowned disciple of Padma Vibhushan Girija Devi, specializing in Khayal and Purab Ang Gayaki.',
    courses: ['Hindustani Vocals', 'Kids Singing'],
    qualifications: ['Sangeet Praveen', 'Gold Medalist AIR'],
    availability: ['Mon 10:00-14:00', 'Wed 16:00-20:00', 'Thu 17:00-21:00'],
    intro_video: '',
    reviews: [],
    active: true
  },
  {
    id: 'teacher-shujaat',
    teacherId: 'SM-TEA-1045',
    name: 'Pandit Amitava Sen',
    title: 'Guitar & Fusion Virtuoso',
    specialization: 'Fingerstyle, Classical & Acoustic Guitar',
    experience: 16,
    languages: ['English', 'Hindi'],
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Trinity Guildhall Grade 8 certified maestro with decades of teaching modern fingerstyle and Indian slide.',
    courses: ['Acoustic Guitar', 'Electric Guitar'],
    qualifications: ['Trinity LTCL', 'Berklee Online Specialist'],
    availability: ['Tue 14:00-19:00', 'Fri 15:00-20:00', 'Sat 10:00-16:00'],
    intro_video: '',
    reviews: [],
    active: true
  },
  {
    id: 'teacher-anindo',
    teacherId: 'SM-TEA-1019',
    name: 'Pt. Anindo Chatterjee',
    title: 'Tabla Maestro • Farukhabad Gharana',
    specialization: 'Tabla Solo, Bols & Peshkar',
    experience: 28,
    languages: ['Bengali', 'Hindi', 'English'],
    rating: 5.0,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Global exponent of the Farukhabad repertoire with unmatched tonal clarity and rhythmic command.',
    courses: ['Tabla'],
    qualifications: ['Sangeet Natak Akademi Fellow'],
    availability: ['Mon 16:00-20:00', 'Sat 11:00-17:00'],
    intro_video: '',
    reviews: [],
    active: true
  }
];

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup_01',
    code: 'MAESTRO10',
    discountType: 'percent',
    discountValue: 10,
    expiryDate: '2026-12-31',
    usageLimit: 100,
    usageCount: 28,
    minOrderValue: 2000,
    active: true,
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'coup_02',
    code: 'RAGA500',
    discountType: 'fixed',
    discountValue: 500,
    expiryDate: '2026-10-31',
    usageLimit: 50,
    usageCount: 14,
    minOrderValue: 4000,
    active: true,
    createdAt: '2026-09-01T00:00:00Z'
  }
];

export const DEFAULT_CLASSES: ClassSession[] = [
  {
    id: 'cls_01',
    studentId: 'std_01',
    studentName: 'Aarav Sharma',
    teacherId: 'teacher-sunanda',
    teacherName: 'Vidushi Sunanda Sharma',
    courseId: 'course-hindustani-vocal',
    courseTitle: 'Hindustani Classical Vocal',
    scheduledAt: new Date(Date.now() + 3600000 * 4).toISOString(),
    durationMinutes: 45,
    status: 'scheduled',
    meetingUrl: 'saremi-vocal-101',
    lessonNotes: 'Yaman Aalap & Bandish rehearsal',
    homeworkAssigned: 'Record 10-minute swara sadhana in Teentaal'
  },
  {
    id: 'cls_02',
    studentId: 'std_02',
    studentName: 'Meera Nair',
    teacherId: 'teacher-shujaat',
    teacherName: 'Pandit Amitava Sen',
    courseId: 'course-acoustic-guitar',
    courseTitle: 'Acoustic Guitar Mastery',
    scheduledAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    durationMinutes: 45,
    status: 'scheduled',
    meetingUrl: 'saremi-guitar-202',
    lessonNotes: 'Barre chords and 16th note strumming patterns'
  }
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_01',
    classId: 'cls_01',
    studentId: 'std_01',
    studentName: 'Aarav Sharma',
    teacherId: 'teacher-sunanda',
    teacherName: 'Vidushi Sunanda Sharma',
    courseTitle: 'Hindustani Classical Vocal',
    date: '2026-09-12',
    status: 'Present',
    notes: 'On time, vocal warmup executed accurately.'
  },
  {
    id: 'att_02',
    classId: 'cls_02',
    studentId: 'std_02',
    studentName: 'Meera Nair',
    teacherId: 'teacher-shujaat',
    teacherName: 'Pandit Amitava Sen',
    courseTitle: 'Acoustic Guitar Mastery',
    date: '2026-09-11',
    status: 'Present',
    notes: 'Excellent rhythm timing.'
  }
];

export const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: 'SAR-CERT-2026-001',
    studentId: 'std_01',
    studentName: 'Aarav Sharma',
    courseTitle: 'Hindustani Classical Vocal',
    instrument: 'vocals',
    gradeLevel: 'Foundation',
    issuedDate: '2026-08-30',
    mentorName: 'Vidushi Sunanda Sharma',
    verificationCode: 'SAR-VOC-98214',
    pdfUrl: 'https://saremiacademy.com/verify/SAR-VOC-98214'
  }
];

export const DEFAULT_MASTERCLASSES: Masterclass[] = [
  {
    id: 'mc_01',
    title: 'The Art of Khayal Improvisation',
    maestroName: 'Vidushi Sunanda Sharma',
    maestroTitle: 'Senior Maestro of Banaras Gharana',
    maestroAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    instrument: 'vocals',
    date: '2026-09-28',
    time: '06:00 PM IST',
    durationMinutes: 90,
    fee: 999,
    currency: 'INR',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    description: 'Deep dive into microtonal shrutis, Bol-Taans, and emotive expression in Raga Bhairav.',
    topics: ['Microtonal Shrutis', 'Bol-Banaav techniques', 'Stage performance poise'],
    enrolledUserIds: ['std_01', 'std_02']
  }
];

export const DEFAULT_CMS_CONTENT: CMSContent = {
  id: 'main_content',
  heroHeadline: 'Master Real Music With India’s Top Maestros',
  heroSubheadline: 'Live 1:1 online mentorship in Hindustani Vocals, Guitar, Keyboard, Tabla, Violin & Flute. Transformative live instruction.',
  heroBadge: 'Admissions Open • Autumn Semester',
  announcementBanner: {
    enabled: true,
    text: '🎉 Flat 15% Off on 3-Month Transformational Packages with Free Tanpura Studio Access!',
    linkUrl: '/pricing'
  },
  faqs: [
    {
      id: 'faq_1',
      question: 'How do live online 1:1 classes work at Saremi?',
      answer: 'Each student is matched with a certified conservatory guru. Classes happen over high-fidelity video with dedicated virtual Tanpura & metronome tools.'
    },
    {
      id: 'faq_2',
      question: 'Can I reschedule a session if I have an emergency?',
      answer: 'Yes, sessions can be rescheduled directly via your student dashboard with 12 hours advance notice.'
    }
  ],
  testimonials: [
    {
      id: 't_1',
      name: 'Dr. Radhika Menon',
      role: 'Parent of Ananya (Age 9)',
      text: 'The 1:1 attention from Vidushi Sunanda Ji has completely transformed Ananya’s vocal pitch and confidence.',
      rating: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    }
  ],
  footerNotice: '© 2026 Saremi Music Academy Private Limited. All Rights Reserved.',
  updatedAt: new Date().toISOString()
};

export const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_01',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav.sharma@gmail.com',
    studentPhone: '+91 98201 44521',
    subject: 'Rescheduling Thursday Class Request',
    message: 'Hello, I have an examination on Thursday. Could my session be moved to Saturday 11 AM?',
    priority: 'medium',
    status: 'In Progress',
    assignedAdmin: 'Avinash B (Super Admin)',
    internalNotes: 'Contacted teacher Sunanda Ji, confirmed slot available.',
    createdAt: '2026-09-14T08:00:00Z',
    updatedAt: '2026-09-14T09:30:00Z'
  }
];

export const DEFAULT_SETTINGS: AcademySettings = {
  academyName: 'Saremi Music Academy',
  tagline: 'Premier Online Live Indian & Contemporary Music Academy',
  supportEmail: 'admissions@saremiacademy.com',
  supportPhone: '+91 98201 00000',
  currency: 'INR',
  timezone: 'Asia/Kolkata (IST)',
  gstNumber: '27AABCS1234F1Z5',
  address: 'Saremi Arts Hub, Shivaji Nagar, Pune, Maharashtra 411005',
  razorpayActive: true,
  trialAutoConfirmation: true,
  smsNotificationsEnabled: true,
  maintenanceMode: false,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_ADMIN_STAFF: AdminUser[] = [
  {
    id: 'adm_01',
    email: 'avinashborate5897@gmail.com',
    name: 'Avinash Borate',
    role: 'super_admin',
    permissions: [
      'view_public',
      'access_student_portal',
      'access_teacher_portal',
      'access_admin_panel',
      'manage_students',
      'manage_teachers',
      'manage_curriculum',
      'manage_classes',
      'manage_payments',
      'manage_leads',
      'manage_events',
      'manage_reports',
      'manage_system_settings'
    ],
    active: true,
    department: 'Executive Office',
    phone: '+91 98200 00001',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'adm_02',
    email: 'admissions@saremiacademy.com',
    name: 'Pooja Deshmukh',
    role: 'academic_coordinator',
    permissions: [
      'access_admin_panel',
      'manage_students',
      'manage_teachers',
      'manage_classes',
      'manage_leads'
    ],
    active: true,
    department: 'Student Affairs',
    phone: '+91 98200 00002',
    createdAt: '2026-08-15T00:00:00Z'
  }
];
