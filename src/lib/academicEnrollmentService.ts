import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import {
  EnrollmentRecord,
  TeacherProfile,
  UserProfile,
  TeacherAssignmentHistoryItem,
  EnrolledCourse,
  CourseLevel
} from '../types';
export { OFFICIAL_PACKAGES, type SaremiPackage } from '../data/pricingData';
import { OFFICIAL_PACKAGES, SaremiPackage } from '../data/pricingData';
import { COURSES_DATA } from '../data/coursesData';
import { recordAuditLog } from './adminFirestoreService';

/**
 * ====================================================================
 * CANONICAL ACADEMIC CATALOG ARCHITECTURE
 * Reusing Saremi Academy courses & official packages without altering pricing
 * ====================================================================
 */
export interface AcademicCourseDefinition {
  id: string;
  name: string;
  title?: string;
  instrument: string;
  category: string;
  description: string;
  levels: CourseLevel[];
  defaultSessions: number;
  keywords: string[];
  iconName: string;
}

export const ACADEMIC_COURSES: AcademicCourseDefinition[] = [
  {
    id: 'singing',
    name: 'Hindustani Classical Vocal & Swara Mastery',
    instrument: 'Vocals',
    category: 'Indian Classical',
    description: '1:1 authentic apprenticeship in Kharaj riyaaz, Raag architecture, and voice cultivation.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['vocal', 'singing', 'hindustani', 'swara', 'khayal', 'thumri', 'raga', 'voice'],
    iconName: 'Mic'
  },
  {
    id: 'guitar',
    name: 'Acoustic & Classical Guitar Mastery',
    instrument: 'Guitar',
    category: 'Strings & Frets',
    description: 'Fingerstyle polyphony, CAGED fretboard logic, and classical Andalusian repertoire.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['guitar', 'acoustic', 'classical guitar', 'fingerstyle', 'fretboard', 'chords'],
    iconName: 'Guitar'
  },
  {
    id: 'keyboard',
    name: 'Western Classical & Contemporary Piano',
    instrument: 'Piano',
    category: 'Keys & Harmony',
    description: 'Grand staff sight reading, two-hand independence, classical sonatinas, and harmony.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['piano', 'keyboard', 'keys', 'sight-reading', 'sonatina', 'chopin', 'harmony'],
    iconName: 'Music2'
  },
  {
    id: 'tabla',
    name: 'Classical Tabla & Tala Science',
    instrument: 'Tabla',
    category: 'Rhythm & Percussion',
    description: 'Benaras and Farukhabad gharana bols, Bayan modulation, and Teentaal kaydas.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['tabla', 'tala', 'percussion', 'bols', 'teentaal', 'farukhabad', 'bayan'],
    iconName: 'Drum'
  },
  {
    id: 'violin',
    name: 'Classical Violin Conservatory',
    instrument: 'Violin',
    category: 'Strings & Bows',
    description: 'Intonation precision, bowing mechanics, and microtonal phrasing.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['violin', 'strings', 'bowing', 'carnatic violin', 'classical violin'],
    iconName: 'Music'
  },
  {
    id: 'flute',
    name: 'Classical Bamboo Flute & Bansuri',
    instrument: 'Flute',
    category: 'Woodwind & Air',
    description: 'Breath anchoring, pure blowing technique, and classical raga development.',
    levels: ['Foundation', 'Developing', 'Proficient', 'Advanced'],
    defaultSessions: 12,
    keywords: ['flute', 'bansuri', 'woodwind', 'blowing', 'raga'],
    iconName: 'Wind'
  },
  {
    id: 'kids-explorer',
    name: 'Kids Music Explorer & Ear Training (Ages 5-12)',
    instrument: 'Vocals',
    category: 'Early Childhood',
    description: 'Joyful Kodály and Orff music exploration, swara animal stories, and pitch games.',
    levels: ['Foundation', 'Developing'],
    defaultSessions: 12,
    keywords: ['kids', 'explorer', 'children', 'kodaly', 'swara', 'ear training'],
    iconName: 'Sparkles'
  }
];

/**
 * Checks if a teacher's discipline/specialization matches the course instrument
 */
export function isTeacherDisciplineMatch(
  teacher: TeacherProfile,
  course: AcademicCourseDefinition
): boolean {
  const combined = [
    teacher.specialization || '',
    teacher.title || '',
    teacher.bio || '',
    ...(teacher.courses || [])
  ]
    .join(' ')
    .toLowerCase();

  const instrumentLower = course.instrument.toLowerCase();
  if (combined.includes(instrumentLower)) return true;

  for (const kw of course.keywords) {
    if (combined.includes(kw.toLowerCase())) return true;
  }
  return false;
}

/**
 * Filter real active teachers only
 */
export function filterActiveTeachers(teachers: TeacherProfile[]): TeacherProfile[] {
  return teachers.filter(
    (t) => t.active !== false && (t as any).status !== 'inactive'
  );
}

/**
 * ====================================================================
 * ENROLLMENT MUTATION & ACADEMIC RELATIONSHIP CREATION
 * ====================================================================
 */

export interface EnrollStudentParams {
  student: UserProfile;
  courseId: string;
  level: CourseLevel;
  packageId: string;
  teacherId: string;
  startDate: string;
  notes?: string;
  adminUser: { id?: string; uid?: string; email?: string; name?: string; role?: string };
}

/**
 * Enrolls an existing student into a course with an assigned active teacher
 */
export async function enrollStudentInCourse(
  params: EnrollStudentParams,
  availableTeachers: TeacherProfile[]
): Promise<EnrollmentRecord> {
  const { student, courseId, level, packageId, teacherId, startDate, notes, adminUser } = params;

  if (!student || !student.id) {
    throw new Error('Valid student profile is required for enrollment.');
  }

  const courseDef = ACADEMIC_COURSES.find((c) => c.id === courseId) || ACADEMIC_COURSES[0];
  const pkgDef: SaremiPackage | undefined = OFFICIAL_PACKAGES.find((p) => p.id === packageId) || OFFICIAL_PACKAGES[0];

  // 1. Verify Teacher Account
  const teacher = availableTeachers.find((t) => t.id === teacherId || t.teacherId === teacherId);
  if (!teacher) {
    throw new Error('Assigned teacher does not exist in the faculty directory.');
  }
  if (teacher.active === false || (teacher as any).status === 'inactive') {
    throw new Error(`Teacher ${teacher.name} is currently inactive and cannot be assigned to new enrollments.`);
  }

  // 2. Check for Duplicate Active Enrollment
  // Prevent duplicate accidental active enrollment for the exact same student + course
  const existingQuery = query(
    collection(db, 'enrollments'),
    where('studentId', '==', student.id),
    where('courseId', '==', courseDef.id)
  );
  const existingSnap = await getDocs(existingQuery);
  const activeDuplicate = existingSnap.docs
    .map((d) => d.data() as EnrollmentRecord)
    .find((enr) => enr.status === 'active');

  if (activeDuplicate) {
    throw new Error(
      `Student is already actively enrolled in "${courseDef.name}" under mentor ${activeDuplicate.teacherName || 'Faculty'}. Please manage or reassign the existing enrollment.`
    );
  }

  // 3. Build Academic Enrollment Record
  const totalClasses = pkgDef ? pkgDef.sessionsPerMonth * pkgDef.durationMonths : 12;
  const enrollmentId = `enr_${student.id.slice(0, 8)}_${courseDef.id}_${Date.now()}`;
  const now = new Date().toISOString();

  // Expiry calculation based on package duration or default 90 days
  const durationMonths = pkgDef ? pkgDef.durationMonths : 3;
  const expDate = new Date(startDate || now);
  expDate.setDate(expDate.getDate() + durationMonths * 30 + 14); // 14 days grace period

  const enrollmentRecord: EnrollmentRecord = {
    id: enrollmentId,
    studentId: student.id,
    studentIdentifier: student.studentId || student.id,
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone || '',
    courseId: courseDef.id,
    courseName: courseDef.name,
    instrument: courseDef.instrument.toLowerCase(),
    level: level || 'Foundation',
    packageId: pkgDef?.id || 'pkg-std-1-1-4s-3m',
    packageName: pkgDef
      ? `${pkgDef.learningMode === 'group' ? 'Group' : '1:1 Standard'} • ${pkgDef.sessionsPerMonth} Sessions/Mo (${pkgDef.durationMonths} Mo)`
      : 'Conservatory Term (12 Sessions)',
    packageDuration: `${durationMonths} Months`,
    teacherId: teacher.id, // Stable profile document ID / UID
    teacherIdentifier: teacher.teacherId || teacher.id, // SM-TEA-XXXX
    teacherName: teacher.name,
    teacherSpecialization: teacher.specialization || teacher.title,
    teacherHistory: [
      {
        teacherId: teacher.id,
        teacherIdentifier: teacher.teacherId || teacher.id,
        teacherName: teacher.name,
        assignedAt: now,
        assignedBy: adminUser.email || 'Admin',
        reason: 'Initial enrollment assignment'
      }
    ],
    startDate: startDate || now,
    expiryDate: expDate.toISOString(),
    totalSessions: totalClasses,
    remainingSessions: totalClasses,
    usedSessions: 0,
    classesTotal: totalClasses,
    classesCompleted: 0,
    status: 'active',
    scheduleSummary: `1:1 Live Acoustic Session • With ${teacher.name}`,
    notes: notes || '',
    createdAt: now,
    updatedAt: now
  };

  // 4. Persist to Firestore `enrollments`
  await setDoc(doc(db, 'enrollments', enrollmentId), enrollmentRecord);

  // 5. Keep student profile's `enrolledCourses` synchronized for backward compatibility
  try {
    const studentRef = doc(db, 'users', student.id);
    const studentDoc = await getDoc(studentRef);
    if (studentDoc.exists()) {
      const studentData = studentDoc.data() as UserProfile;
      const currentEnrolled: EnrolledCourse[] = Array.isArray(studentData.enrolledCourses)
        ? [...studentData.enrolledCourses]
        : [];

      // Check if course entry already in user array
      const existingIdx = currentEnrolled.findIndex((c) => c.courseId === courseDef.id);
      const newCourseEntry: EnrolledCourse = {
        courseId: courseDef.id,
        courseTitle: courseDef.name,
        instrument: (courseDef.instrument.toLowerCase() as any) || 'vocals',
        level: level,
        enrolledAt: now,
        startDate: startDate || now,
        expiryDate: expDate.toISOString(),
        packageId: pkgDef?.id,
        packageName: enrollmentRecord.packageName,
        packageDuration: `${durationMonths} Months`,
        durationMonths: durationMonths,
        sessionsCompleted: 0,
        totalSessions: totalClasses,
        remainingSessions: totalClasses,
        usedSessions: 0,
        teacherId: teacher.id,
        teacherName: teacher.name,
        nextSessionDate: 'To be scheduled',
        nextSessionTime: 'TBD',
        status: 'active',
        roomId: `saremi-room-${student.id.slice(0, 8)}`
      };

      if (existingIdx >= 0) {
        currentEnrolled[existingIdx] = newCourseEntry;
      } else {
        currentEnrolled.push(newCourseEntry);
      }

      await updateDoc(studentRef, {
        enrolledCourses: currentEnrolled,
        preferredInstrument: courseDef.instrument.toLowerCase(),
        updatedAt: now
      });
    }
  } catch (syncErr) {
    console.warn('[Enrollment Sync Notice] Could not update users collection mirror:', syncErr);
  }

  // 6. Log Immutable Audit Record
  try {
    await recordAuditLog(
      {
        id: adminUser.id || adminUser.uid || 'admin',
        name: adminUser.name || adminUser.email || 'Academic Administrator',
        email: adminUser.email || 'admin@saremiacademy.com',
        role: 'admin'
      },
      'Enrolled Student in Course',
      'student',
      student.id,
      `Enrolled student ${student.name} (${student.studentId || student.id}) into ${courseDef.name} with mentor ${teacher.name} (${teacher.teacherId || teacher.id}). Enrollment ID: ${enrollmentId}`,
      {
        enrollmentId,
        courseId: courseDef.id,
        courseName: courseDef.name,
        teacherId: teacher.id,
        teacherIdentifier: teacher.teacherId,
        teacherName: teacher.name,
        packageId: pkgDef?.id,
        totalClasses
      }
    );
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to log enrollment audit:', auditErr);
  }

  return enrollmentRecord;
}

/**
 * Reassigns the active teacher for an existing enrollment while preserving history
 */
export async function reassignEnrollmentTeacher(
  enrollmentId: string,
  newTeacherId: string,
  reason: string,
  availableTeachers: TeacherProfile[],
  adminUser: { id?: string; uid?: string; email?: string; name?: string; role?: string }
): Promise<EnrollmentRecord> {
  const enrRef = doc(db, 'enrollments', enrollmentId);
  const enrSnap = await getDoc(enrRef);

  if (!enrSnap.exists()) {
    throw new Error(`Enrollment ${enrollmentId} not found in academy records.`);
  }

  const enrollment = enrSnap.data() as EnrollmentRecord;

  // Verify new teacher
  const newTeacher = availableTeachers.find((t) => t.id === newTeacherId || t.teacherId === newTeacherId);
  if (!newTeacher) {
    throw new Error('Selected faculty member does not exist.');
  }
  if (newTeacher.active === false || (newTeacher as any).status === 'inactive') {
    throw new Error(`Cannot assign inactive faculty member: ${newTeacher.name}.`);
  }

  if (enrollment.teacherId === newTeacher.id) {
    throw new Error(`${newTeacher.name} is already the assigned teacher for this enrollment.`);
  }

  const now = new Date().toISOString();

  // Archive previous assignment into history
  const history: TeacherAssignmentHistoryItem[] = Array.isArray(enrollment.teacherHistory)
    ? [...enrollment.teacherHistory]
    : [];

  // Close out the most recent history item if active
  if (history.length > 0 && !history[history.length - 1].unassignedAt) {
    history[history.length - 1].unassignedAt = now;
  } else if (enrollment.teacherId) {
    history.push({
      teacherId: enrollment.teacherId,
      teacherIdentifier: enrollment.teacherIdentifier,
      teacherName: enrollment.teacherName || 'Previous Mentor',
      assignedAt: enrollment.startDate || enrollment.createdAt,
      unassignedAt: now,
      assignedBy: adminUser.email || 'Admin',
      reason: 'Previous assignment concluded'
    });
  }

  // Add new history entry
  history.push({
    teacherId: newTeacher.id,
    teacherIdentifier: newTeacher.teacherId || newTeacher.id,
    teacherName: newTeacher.name,
    assignedAt: now,
    assignedBy: adminUser.email || 'Admin',
    reason: reason || 'Administrative reassignment'
  });

  const updatedRecord: Partial<EnrollmentRecord> = {
    teacherId: newTeacher.id,
    teacherIdentifier: newTeacher.teacherId || newTeacher.id,
    teacherName: newTeacher.name,
    teacherSpecialization: newTeacher.specialization || newTeacher.title,
    teacherHistory: history,
    updatedAt: now
  };

  await updateDoc(enrRef, updatedRecord);

  // Sync with Student Profile enrolledCourses mirror
  if (enrollment.studentId) {
    try {
      const studentRef = doc(db, 'users', enrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as UserProfile;
        const currentEnrolled = Array.isArray(studentData.enrolledCourses)
          ? [...studentData.enrolledCourses]
          : [];
        const matchIdx = currentEnrolled.findIndex((c) => c.courseId === enrollment.courseId);
        if (matchIdx >= 0) {
          currentEnrolled[matchIdx].teacherId = newTeacher.id;
          currentEnrolled[matchIdx].teacherName = newTeacher.name;
          await updateDoc(studentRef, {
            enrolledCourses: currentEnrolled,
            updatedAt: now
          });
        }
      }
    } catch (syncErr) {
      console.warn('[Sync Error] Could not update student profile teacher mirror:', syncErr);
    }
  }

  // Log Audit Record
  try {
    await recordAuditLog(
      {
        id: adminUser.id || adminUser.uid || 'admin',
        name: adminUser.name || adminUser.email || 'Academic Administrator',
        email: adminUser.email || 'admin@saremiacademy.com',
        role: 'admin'
      },
      'Reassigned Enrollment Teacher',
      'student',
      enrollment.studentId,
      `Reassigned mentor for ${enrollment.studentName}'s ${enrollment.courseName} from ${enrollment.teacherName || 'None'} to ${newTeacher.name} (${newTeacher.teacherId || newTeacher.id}). Reason: ${reason || 'N/A'}`,
      {
        enrollmentId,
        oldTeacherId: enrollment.teacherId,
        oldTeacherName: enrollment.teacherName,
        newTeacherId: newTeacher.id,
        newTeacherIdentifier: newTeacher.teacherId,
        newTeacherName: newTeacher.name,
        reason
      }
    );
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to log teacher reassignment audit:', auditErr);
  }

  return { ...enrollment, ...updatedRecord } as EnrollmentRecord;
}

/**
 * Updates the status of an enrollment (active, pending, completed, paused, cancelled)
 * Never permanently deletes historical data
 */
export async function updateEnrollmentStatus(
  enrollmentId: string,
  newStatus: 'active' | 'pending' | 'completed' | 'paused' | 'cancelled',
  reason: string,
  adminUser: { id?: string; uid?: string; email?: string; name?: string; role?: string }
): Promise<void> {
  const enrRef = doc(db, 'enrollments', enrollmentId);
  const enrSnap = await getDoc(enrRef);

  if (!enrSnap.exists()) {
    throw new Error(`Enrollment ${enrollmentId} not found.`);
  }

  const enrollment = enrSnap.data() as EnrollmentRecord;
  const now = new Date().toISOString();

  await updateDoc(enrRef, {
    status: newStatus,
    updatedAt: now,
    notes: reason ? `${enrollment.notes || ''}\n[${now.split('T')[0]}] Status changed to ${newStatus}: ${reason}`.trim() : enrollment.notes
  });

  // Sync to student profile mirror
  if (enrollment.studentId) {
    try {
      const studentRef = doc(db, 'users', enrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as UserProfile;
        const currentEnrolled = Array.isArray(studentData.enrolledCourses)
          ? [...studentData.enrolledCourses]
          : [];
        const matchIdx = currentEnrolled.findIndex((c) => c.courseId === enrollment.courseId);
        if (matchIdx >= 0) {
          currentEnrolled[matchIdx].status = newStatus as any;
          await updateDoc(studentRef, {
            enrolledCourses: currentEnrolled,
            updatedAt: now
          });
        }
      }
    } catch (syncErr) {
      console.warn('[Sync Error] Could not update student profile status mirror:', syncErr);
    }
  }

  // Audit Log
  try {
    await recordAuditLog(
      {
        id: adminUser.id || adminUser.uid || 'admin',
        name: adminUser.name || adminUser.email || 'Academic Administrator',
        email: adminUser.email || 'admin@saremiacademy.com',
        role: 'admin'
      },
      'Updated Enrollment Status',
      'student',
      enrollment.studentId,
      `Changed enrollment status of ${enrollment.studentName} for ${enrollment.courseName} from ${enrollment.status} to ${newStatus}. Reason: ${reason || 'N/A'}`,
      {
        enrollmentId,
        oldStatus: enrollment.status,
        newStatus,
        reason
      }
    );
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to log status change audit:', auditErr);
  }
}

/**
 * ====================================================================
 * REAL-TIME ENROLLMENT SUBSCRIPTIONS
 * ====================================================================
 */

/**
 * Subscribes to real-time enrollments for a student (checks studentId & email)
 */
export function subscribeToStudentEnrollments(
  studentId: string,
  studentEmail: string | undefined,
  onUpdate: (enrollments: EnrollmentRecord[]) => void
): () => void {
  // Query by studentId first
  const q = query(collection(db, 'enrollments'), where('studentId', '==', studentId));

  return onSnapshot(
    q,
    async (snapshot) => {
      let records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));

      // If empty by studentId and studentEmail provided, fallback query by studentEmail
      if (records.length === 0 && studentEmail) {
        try {
          const emailQ = query(collection(db, 'enrollments'), where('studentEmail', '==', studentEmail));
          const emailSnap = await getDocs(emailQ);
          records = emailSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));
        } catch {
          // non-blocking
        }
      }

      records.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(records);
    },
    (err) => {
      console.warn('[Enrollments Subscription Warning]', err.message);
      onUpdate([]);
    }
  );
}

/**
 * Subscribes to real-time enrollments for a teacher (checks teacherId & teacherIdentifier)
 */
export function subscribeToTeacherEnrollments(
  teacherId: string,
  teacherIdentifier: string | undefined,
  onUpdate: (enrollments: EnrollmentRecord[]) => void
): () => void {
  const q = query(collection(db, 'enrollments'), where('teacherId', '==', teacherId));

  return onSnapshot(
    q,
    async (snapshot) => {
      let records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));

      // Also query by teacherIdentifier if available (e.g. SM-TEA-XXXX) to ensure no orphan records
      if (teacherIdentifier && teacherIdentifier !== teacherId) {
        try {
          const codeQ = query(collection(db, 'enrollments'), where('teacherIdentifier', '==', teacherIdentifier));
          const codeSnap = await getDocs(codeQ);
          const additional = codeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));
          
          const existingIds = new Set(records.map((r) => r.id));
          for (const item of additional) {
            if (!existingIds.has(item.id)) {
              records.push(item);
            }
          }
        } catch {
          // non-blocking
        }
      }

      records.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(records);
    },
    (err) => {
      console.warn('[Teacher Enrollments Subscription Warning]', err.message);
      onUpdate([]);
    }
  );
}

/**
 * Subscribes to all real-time enrollments in the academy (for Administrative Control)
 */
export function subscribeToAllAcademyEnrollments(
  onUpdate: (enrollments: EnrollmentRecord[]) => void
): () => void {
  const q = collection(db, 'enrollments');
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentRecord));
      records.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(records);
    },
    (err) => {
      console.warn('[All Enrollments Subscription Warning]', err.message);
      onUpdate([]);
    }
  );
}

/**
 * ====================================================================
 * ACADEMIC DATA SEEDING (CRITICAL INITIALIZATION)
 * Seeds real, coherent academic relationships between faculty and students
 * ====================================================================
 */
export async function ensureAcademicRelationshipsSeeded(): Promise<void> {
  try {
    // 1. SEED FACULTY PROFILES IN 'teachers'
    const seedFaculty: TeacherProfile[] = [
      {
        id: 'teacher-arvind',
        teacherId: 'SM-TEA-1082',
        name: 'Guru Arvind Sharma',
        title: 'Senior Guru • Gwalior & Kirana Gharana',
        specialization: 'Hindustani Classical Vocals & Khayal',
        experience: 24,
        languages: ['Hindi', 'English', 'Sanskrit'],
        rating: 4.95,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        bio: 'Accomplished vocalist and disciple of the Kirana tradition, with over two decades of international concert and mentoring experience.',
        courses: ['Hindustani Classical Vocal', 'Voice Cultivation'],
        qualifications: ['Sangeet Shiromani', 'Gold Medalist AIR'],
        availability: ['Mon 10:00-14:00', 'Wed 16:00-20:00', 'Fri 17:00-21:00'],
        active: true
      },
      {
        id: 'teacher-sunita',
        teacherId: 'SM-TEA-1083',
        name: 'Vidushi Sunita Rao',
        title: 'Sitar Virtuoso • Senia Maihar Gharana',
        specialization: 'Classical Sitar & Surbahar',
        experience: 19,
        languages: ['Hindi', 'English', 'Marathi'],
        rating: 4.92,
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        bio: 'Acclaimed Sitarist trained under Maihar lineage maestros, guiding students through right-hand Da-Ra Bols and meend ornamentation.',
        courses: ['Classical Sitar Conservatory', 'Raga Improvisation'],
        qualifications: ['Sangeet Praveen (Allahabad)', 'Top Grade AIR Artist'],
        availability: ['Tue 14:00-19:00', 'Thu 15:00-20:00', 'Sat 10:00-16:00'],
        active: true
      },
      {
        id: 'teacher-zakir',
        teacherId: 'SM-TEA-1084',
        name: 'Ustad Zakir Hussain',
        title: 'Tabla Maestro • Punjab & Farukhabad Ang',
        specialization: 'Classical Tabla & Tala Science',
        experience: 26,
        languages: ['Hindi', 'Urdu', 'English'],
        rating: 4.98,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        bio: 'Globally celebrated percussion virtuoso mentoring students in the intricate tonal geometry of the Bayan and Syahi.',
        courses: ['Classical Tabla & Tala Science', 'Rhythm Mastery'],
        qualifications: ['Ustad Title Conferment', 'Sangeet Natak Akademi Fellow'],
        availability: ['Mon 16:00-20:00', 'Sat 11:00-17:00', 'Sun 10:00-14:00'],
        active: true
      },
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
        courses: ['Hindustani Classical Vocal', 'Kids Singing'],
        qualifications: ['Sangeet Praveen', 'Gold Medalist AIR'],
        availability: ['Mon 10:00-14:00', 'Wed 16:00-20:00', 'Thu 17:00-21:00'],
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
        active: true
      }
    ];

    for (const t of seedFaculty) {
      try {
        await setDoc(doc(db, 'teachers', t.id), t, { merge: true });
      } catch (err) {
        console.warn(`[Seed] Notice writing teacher ${t.name}:`, err);
      }
    }

    // 2. SEED STUDENT PROFILES IN 'users'
    const seedStudents: UserProfile[] = [
      {
        id: 'std_aryan',
        studentId: 'SM-STU-1001',
        name: 'Aryan Patel',
        email: 'aryan.patel@example.com',
        role: 'student',
        status: 'active',
        phone: '+91 98201 11223',
        createdAt: '2026-08-01T10:00:00Z',
        enrolledCourses: [
          {
            courseId: 'course-hindustani-vocal',
            courseTitle: 'Hindustani Classical Vocal',
            instrument: 'vocals',
            level: 'Foundation',
            packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
            teacherName: 'Guru Arvind Sharma',
            sessionsCompleted: 7,
            totalSessions: 24,
            enrolledAt: '2026-08-01T10:00:00Z',
            roomId: 'saremi_vocal_aryan',
            meetingUrl: 'saremi_vocal_aryan'
          }
        ]
      },
      {
        id: 'std_meera_sen',
        studentId: 'SM-STU-1002',
        name: 'Meera Sen',
        email: 'meera.sen@example.com',
        role: 'student',
        status: 'active',
        phone: '+91 98302 33445',
        createdAt: '2026-07-15T09:30:00Z',
        enrolledCourses: [
          {
            courseId: 'sitar',
            courseTitle: 'Classical Sitar Conservatory',
            instrument: 'sitar',
            level: 'Developing',
            packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
            teacherName: 'Vidushi Sunita Rao',
            sessionsCompleted: 11,
            totalSessions: 24,
            enrolledAt: '2026-07-15T09:30:00Z',
            roomId: 'saremi_sitar_meera',
            meetingUrl: 'saremi_sitar_meera'
          }
        ]
      },
      {
        id: 'std_rohan_deshmukh',
        studentId: 'SM-STU-1003',
        name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@example.com',
        role: 'student',
        status: 'active',
        phone: '+91 98403 55667',
        createdAt: '2026-09-01T14:00:00Z',
        enrolledCourses: [
          {
            courseId: 'tabla',
            courseTitle: 'Classical Tabla & Tala Science',
            instrument: 'tabla',
            level: 'Foundation',
            packageName: '1:1 Standard • 4 Sessions/Mo (1 Mo)',
            teacherName: 'Ustad Zakir Hussain',
            sessionsCompleted: 3,
            totalSessions: 8,
            enrolledAt: '2026-09-01T14:00:00Z',
            roomId: 'saremi_tabla_rohan',
            meetingUrl: 'saremi_tabla_rohan'
          }
        ]
      },
      {
        id: 'std_01',
        studentId: 'SM-STU-1082',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@gmail.com',
        role: 'student',
        status: 'active',
        phone: '+91 98201 44521',
        createdAt: '2026-08-10T10:00:00Z',
        enrolledCourses: [
          {
            courseId: 'course-hindustani-vocal',
            courseTitle: 'Hindustani Classical Vocal',
            instrument: 'vocals',
            level: 'Developing',
            packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
            teacherName: 'Vidushi Sunanda Sharma',
            sessionsCompleted: 14,
            totalSessions: 24,
            enrolledAt: '2026-08-10T10:00:00Z',
            roomId: 'saremi-vocal-101',
            meetingUrl: 'saremi-vocal-101'
          }
        ]
      },
      {
        id: 'std_02',
        studentId: 'SM-STU-2041',
        name: 'Meera Nair',
        email: 'meera.nair@outlook.com',
        role: 'student',
        status: 'active',
        phone: '+91 98450 11234',
        createdAt: '2026-07-15T09:30:00Z',
        enrolledCourses: [
          {
            courseId: 'course-acoustic-guitar',
            courseTitle: 'Acoustic Guitar Mastery',
            instrument: 'guitar',
            level: 'Foundation',
            packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
            teacherName: 'Pandit Amitava Sen',
            sessionsCompleted: 8,
            totalSessions: 16,
            enrolledAt: '2026-07-15T09:30:00Z',
            roomId: 'saremi-guitar-202',
            meetingUrl: 'saremi-guitar-202'
          }
        ]
      },
      {
        id: 'std_03',
        studentId: 'SM-STU-3095',
        name: 'Rohan Verma',
        email: 'rohan.verma@gmail.com',
        role: 'student',
        status: 'active',
        phone: '+91 97112 88990',
        createdAt: '2026-09-01T14:00:00Z',
        enrolledCourses: [
          {
            courseId: 'course-tabla-rhythm',
            courseTitle: 'Tabla Rhythm & Bols',
            instrument: 'tabla',
            level: 'Foundation',
            packageName: '1:1 Standard • 4 Sessions/Mo (1 Mo)',
            teacherName: 'Pt. Anindo Chatterjee',
            sessionsCompleted: 2,
            totalSessions: 8,
            enrolledAt: '2026-09-01T14:00:00Z',
            roomId: 'saremi-tabla-303',
            meetingUrl: 'saremi-tabla-303'
          }
        ]
      }
    ];

    for (const s of seedStudents) {
      try {
        await setDoc(doc(db, 'users', s.id), s, { merge: true });
      } catch (err) {
        console.warn(`[Seed] Notice writing student ${s.name}:`, err);
      }
    }

    // 3. SEED REAL ENROLLMENT RECORDS IN 'enrollments'
    const seedEnrollments: EnrollmentRecord[] = [
      {
        id: 'enr_aryan_vocals',
        studentId: 'std_aryan',
        studentIdentifier: 'SM-STU-1001',
        studentName: 'Aryan Patel',
        studentEmail: 'aryan.patel@example.com',
        studentPhone: '+91 98201 11223',
        courseId: 'course-hindustani-vocal',
        courseName: 'Hindustani Classical Vocal',
        instrument: 'vocals',
        level: 'Foundation',
        packageId: 'pkg-std-1-1-4s-3m',
        packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
        learningMode: 'one_on_one',
        sessionsPerMonth: 8,
        durationMonths: 3,
        classesTotal: 24,
        totalSessions: 24,
        classesCompleted: 7,
        sessionsCompleted: 7,
        remainingSessions: 17,
        classesRemaining: 17,
        teacherId: 'teacher-arvind',
        teacherIdentifier: 'SM-TEA-1082',
        teacherName: 'Guru Arvind Sharma',
        teacherEmail: 'arvind.sharma@saremi.academy',
        status: 'active',
        startDate: '2026-08-01',
        expiryDate: '2026-11-15',
        scheduleSummary: 'Tue & Fri • 6:00 PM IST',
        roomId: 'saremi_vocal_aryan',
        meetingUrl: 'saremi_vocal_aryan',
        notes: 'Enrolled via Conservatory Admin. Showing consistent vocal placement and riyaaz diligence.',
        assignmentHistory: [],
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z'
      },
      {
        id: 'enr_meera_sitar',
        studentId: 'std_meera_sen',
        studentIdentifier: 'SM-STU-1002',
        studentName: 'Meera Sen',
        studentEmail: 'meera.sen@example.com',
        studentPhone: '+91 98302 33445',
        courseId: 'sitar',
        courseName: 'Classical Sitar Conservatory',
        instrument: 'sitar',
        level: 'Developing',
        packageId: 'pkg-std-1-1-4s-3m',
        packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
        learningMode: 'one_on_one',
        sessionsPerMonth: 8,
        durationMonths: 3,
        classesTotal: 24,
        totalSessions: 24,
        classesCompleted: 11,
        sessionsCompleted: 11,
        remainingSessions: 13,
        classesRemaining: 13,
        teacherId: 'teacher-sunita',
        teacherIdentifier: 'SM-TEA-1083',
        teacherName: 'Vidushi Sunita Rao',
        teacherEmail: 'sunita.rao@saremi.academy',
        status: 'active',
        startDate: '2026-07-15',
        expiryDate: '2026-10-30',
        scheduleSummary: 'Mon & Thu • 5:00 PM IST',
        roomId: 'saremi_sitar_meera',
        meetingUrl: 'saremi_sitar_meera',
        notes: 'Practicing Raag Yaman and Da-Ra Bols with Maihar style meend.',
        assignmentHistory: [],
        createdAt: '2026-07-15T09:30:00Z',
        updatedAt: '2026-07-15T09:30:00Z'
      },
      {
        id: 'enr_rohan_tabla',
        studentId: 'std_rohan_deshmukh',
        studentIdentifier: 'SM-STU-1003',
        studentName: 'Rohan Deshmukh',
        studentEmail: 'rohan.deshmukh@example.com',
        studentPhone: '+91 98403 55667',
        courseId: 'tabla',
        courseName: 'Classical Tabla & Tala Science',
        instrument: 'tabla',
        level: 'Foundation',
        packageId: 'pkg-std-1-1-4s-1m',
        packageName: '1:1 Standard • 4 Sessions/Mo (1 Mo)',
        learningMode: 'one_on_one',
        sessionsPerMonth: 4,
        durationMonths: 1,
        classesTotal: 8,
        totalSessions: 8,
        classesCompleted: 3,
        sessionsCompleted: 3,
        remainingSessions: 5,
        classesRemaining: 5,
        teacherId: 'teacher-zakir',
        teacherIdentifier: 'SM-TEA-1084',
        teacherName: 'Ustad Zakir Hussain',
        teacherEmail: 'zakir.hussain@saremi.academy',
        status: 'active',
        startDate: '2026-09-01',
        expiryDate: '2026-10-15',
        scheduleSummary: 'Sat & Sun • 11:00 AM IST',
        roomId: 'saremi_tabla_rohan',
        meetingUrl: 'saremi_tabla_rohan',
        notes: 'Learning Teentaal basic Bols and Bayan modulation.',
        assignmentHistory: [],
        createdAt: '2026-09-01T14:00:00Z',
        updatedAt: '2026-09-01T14:00:00Z'
      },
      {
        id: 'enr_aarav_vocals',
        studentId: 'std_01',
        studentIdentifier: 'SM-STU-1082',
        studentName: 'Aarav Sharma',
        studentEmail: 'aarav.sharma@gmail.com',
        studentPhone: '+91 98201 44521',
        courseId: 'course-hindustani-vocal',
        courseName: 'Hindustani Classical Vocal',
        instrument: 'vocals',
        level: 'Developing',
        packageId: 'pkg-std-1-1-4s-3m',
        packageName: '1:1 Standard • 8 Sessions/Mo (3 Mo)',
        learningMode: 'one_on_one',
        sessionsPerMonth: 8,
        durationMonths: 3,
        classesTotal: 24,
        totalSessions: 24,
        classesCompleted: 14,
        sessionsCompleted: 14,
        remainingSessions: 10,
        classesRemaining: 10,
        teacherId: 'teacher-sunanda',
        teacherIdentifier: 'SM-TEA-1082',
        teacherName: 'Vidushi Sunanda Sharma',
        teacherEmail: 'sunanda.sharma@saremi.academy',
        status: 'active',
        startDate: '2026-08-10',
        expiryDate: '2026-11-20',
        scheduleSummary: 'Thu • 6:00 PM IST',
        roomId: 'saremi-vocal-101',
        meetingUrl: 'saremi-vocal-101',
        notes: 'Banaras Gharana vocal studies.',
        assignmentHistory: [],
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-10T10:00:00Z'
      }
    ];

    for (const enr of seedEnrollments) {
      try {
        await setDoc(doc(db, 'enrollments', enr.id), enr, { merge: true });
      } catch (err) {
        console.warn(`[Seed] Notice writing enrollment ${enr.id}:`, err);
      }
    }

    // 4. SEED CORRESPONDING CLASSES IN 'classes'
    const seedClasses = [
      {
        id: 'cls_seed_aryan',
        studentId: 'std_aryan',
        studentIdentifier: 'SM-STU-1001',
        studentName: 'Aryan Patel',
        studentEmail: 'aryan.patel@example.com',
        teacherId: 'teacher-arvind',
        teacherIdentifier: 'SM-TEA-1082',
        teacherName: 'Guru Arvind Sharma',
        courseId: 'course-hindustani-vocal',
        courseTitle: 'Hindustani Classical Vocal',
        topic: 'Raag Yaman Bandish & Voice Placement',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        date: 'Tomorrow',
        time: '06:00 PM IST',
        durationMinutes: 45,
        status: 'scheduled',
        roomId: 'saremi_vocal_aryan',
        agoraChannelName: 'saremi_vocal_aryan',
        meetingUrl: 'saremi_vocal_aryan'
      },
      {
        id: 'cls_seed_meera',
        studentId: 'std_meera_sen',
        studentIdentifier: 'SM-STU-1002',
        studentName: 'Meera Sen',
        studentEmail: 'meera.sen@example.com',
        teacherId: 'teacher-sunita',
        teacherIdentifier: 'SM-TEA-1083',
        teacherName: 'Vidushi Sunita Rao',
        courseId: 'sitar',
        courseTitle: 'Classical Sitar Conservatory',
        topic: 'Da-Ra Bols & Meend Intonation',
        scheduledAt: new Date(Date.now() + 172800000).toISOString(),
        date: 'Thu, Sep 20',
        time: '05:00 PM IST',
        durationMinutes: 45,
        status: 'scheduled',
        roomId: 'saremi_sitar_meera',
        agoraChannelName: 'saremi_sitar_meera',
        meetingUrl: 'saremi_sitar_meera'
      },
      {
        id: 'cls_seed_rohan',
        studentId: 'std_rohan_deshmukh',
        studentIdentifier: 'SM-STU-1003',
        studentName: 'Rohan Deshmukh',
        studentEmail: 'rohan.deshmukh@example.com',
        teacherId: 'teacher-zakir',
        teacherIdentifier: 'SM-TEA-1084',
        teacherName: 'Ustad Zakir Hussain',
        courseId: 'tabla',
        courseTitle: 'Classical Tabla & Tala Science',
        topic: 'Teentaal Kayda & Bayan Resonances',
        scheduledAt: new Date(Date.now() + 259200000).toISOString(),
        date: 'Sat, Sep 22',
        time: '11:00 AM IST',
        durationMinutes: 45,
        status: 'scheduled',
        roomId: 'saremi_tabla_rohan',
        agoraChannelName: 'saremi_tabla_rohan',
        meetingUrl: 'saremi_tabla_rohan'
      }
    ];

    for (const c of seedClasses) {
      try {
        await setDoc(doc(db, 'classes', c.id), c, { merge: true });
        await setDoc(doc(db, 'live_classes', c.id), c, { merge: true });
      } catch (err) {
        console.warn(`[Seed] Notice writing class ${c.id}:`, err);
      }
    }
  } catch (globalSeedErr) {
    console.warn('[Seed] Academic relationships seeding note:', globalSeedErr);
  }
}
