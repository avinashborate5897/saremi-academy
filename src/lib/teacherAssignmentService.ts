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
  ClassSession,
  TeacherAssignmentSettings,
  TeacherWorkloadStats,
  TeacherMatchResult,
  TeacherMatchScoreBreakdown,
  AssignmentEngineStatus,
  CourseLevel
} from '../types';
import { ACADEMIC_COURSES, isTeacherDisciplineMatch } from './academicEnrollmentService';
import { recordAuditLog } from './adminFirestoreService';

const SETTINGS_DOC_REF = doc(db, 'settings', 'teacher_assignment');

export const DEFAULT_ASSIGNMENT_SETTINGS: TeacherAssignmentSettings = {
  autoAssignmentEnabled: true,
  defaultMaxStudentsPerTeacher: 20,
  prioritizeContinuity: true,
  fixedAssignmentOverridesAuto: true,
  excludeUnavailableTeachers: true,
  requireAdminApprovalForReassignment: true,
  updatedAt: new Date().toISOString()
};

/**
 * Fetches the current academy teacher assignment configuration
 */
export async function getTeacherAssignmentSettings(): Promise<TeacherAssignmentSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC_REF);
    if (snap.exists()) {
      return { ...DEFAULT_ASSIGNMENT_SETTINGS, ...snap.data() } as TeacherAssignmentSettings;
    }
  } catch (err) {
    console.warn('[TeacherAssignmentService] Failed to fetch settings, using defaults:', err);
  }
  return DEFAULT_ASSIGNMENT_SETTINGS;
}

/**
 * Persists updated teacher assignment configuration
 */
export async function saveTeacherAssignmentSettings(
  settings: Partial<TeacherAssignmentSettings>,
  adminUser: { id?: string; uid?: string; email?: string; name?: string }
): Promise<TeacherAssignmentSettings> {
  const now = new Date().toISOString();
  const merged: TeacherAssignmentSettings = {
    ...DEFAULT_ASSIGNMENT_SETTINGS,
    ...settings,
    updatedAt: now,
    updatedBy: adminUser.email || adminUser.name || 'Admin'
  };

  await setDoc(SETTINGS_DOC_REF, merged, { merge: true });

  try {
    await recordAuditLog(
      {
        id: adminUser.id || adminUser.uid || 'admin',
        name: adminUser.name || 'Administrator',
        email: adminUser.email || 'admin@saremiacademy.com',
        role: 'admin'
      },
      'Updated Teacher Assignment Settings',
      'settings',
      'teacher_assignment',
      `Auto-assignment: ${merged.autoAssignmentEnabled ? 'ENABLED' : 'DISABLED'}, Max capacity: ${merged.defaultMaxStudentsPerTeacher}`,
      merged
    );
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to log settings update:', auditErr);
  }

  return merged;
}

/**
 * Subscribes in real-time to assignment configuration
 */
export function subscribeToAssignmentSettings(
  callback: (settings: TeacherAssignmentSettings) => void
): () => void {
  return onSnapshot(
    SETTINGS_DOC_REF,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_ASSIGNMENT_SETTINGS, ...snap.data() } as TeacherAssignmentSettings);
      } else {
        callback(DEFAULT_ASSIGNMENT_SETTINGS);
      }
    },
    (err) => {
      console.warn('[TeacherAssignmentService] Snapshot error on settings:', err);
      callback(DEFAULT_ASSIGNMENT_SETTINGS);
    }
  );
}

/**
 * Calculates current real-time workload for all teachers
 */
export function calculateTeacherWorkloads(
  teachers: TeacherProfile[],
  enrollments: EnrollmentRecord[],
  classes: ClassSession[] = [],
  defaultMaxCapacity = 20
): Map<string, TeacherWorkloadStats> {
  const workloadMap = new Map<string, TeacherWorkloadStats>();

  teachers.forEach((teacher) => {
    const maxCapacity = teacher.maxActiveStudents || defaultMaxCapacity;
    const teacherId = teacher.id;
    const teacherIdent = teacher.teacherId;

    // Filter active enrollments assigned to this teacher
    const activeEnrollments = enrollments.filter((enr) => {
      const isTeacher = enr.teacherId === teacherId || (teacherIdent && enr.teacherIdentifier === teacherIdent);
      const isActive = !enr.status || enr.status === 'active';
      return isTeacher && isActive;
    });

    const activeCount = activeEnrollments.length;
    const available = Math.max(0, maxCapacity - activeCount);
    const capacityPct = Math.round((activeCount / maxCapacity) * 100);

    // Count upcoming classes this week
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
    const weeklyClasses = classes.filter((cls) => {
      const isTeacher = cls.teacherId === teacherId;
      const isScheduled = cls.status === 'scheduled' || cls.status === 'live';
      if (!isTeacher || !isScheduled) return false;
      const clsDate = cls.date ? new Date(cls.date) : cls.scheduledAt ? new Date(cls.scheduledAt) : null;
      return clsDate && clsDate >= now && clsDate <= sevenDaysLater;
    }).length;

    workloadMap.set(teacherId, {
      teacherId,
      teacherName: teacher.name,
      teacherIdentifier: teacher.teacherId,
      specialization: teacher.specialization || 'Conservatory Faculty',
      activeEnrollmentCount: activeCount,
      maxCapacity,
      availableCapacity: available,
      capacityPercentage: capacityPct,
      isAtCapacity: activeCount >= maxCapacity,
      weeklyClassesScheduled: weeklyClasses,
      activeStatus: teacher.active !== false && (teacher as any).status !== 'inactive',
      isEligibleForAutoAssign: teacher.active !== false && (teacher as any).status !== 'inactive' && teacher.isEligibleForAutoAssign !== false
    });
  });

  return workloadMap;
}

/**
 * Deterministic Explainable Match Engine
 * Matches teachers against student enrollment parameters using defined academic criteria
 */
export function evaluateTeacherMatches(params: {
  courseId: string;
  level?: CourseLevel | string;
  preferredTeacherId?: string;
  studentId?: string;
  studentHistoryTeachers?: string[];
  teachers: TeacherProfile[];
  workloadMap: Map<string, TeacherWorkloadStats>;
  settings: TeacherAssignmentSettings;
}): TeacherMatchResult[] {
  const {
    courseId,
    level = 'Foundation',
    preferredTeacherId,
    studentId,
    studentHistoryTeachers = [],
    teachers,
    workloadMap,
    settings
  } = params;

  const courseDef = ACADEMIC_COURSES.find((c) => c.id === courseId) || ACADEMIC_COURSES[0];
  const results: TeacherMatchResult[] = [];

  teachers.forEach((teacher) => {
    const workload = workloadMap.get(teacher.id) || {
      teacherId: teacher.id,
      teacherName: teacher.name,
      specialization: teacher.specialization,
      activeEnrollmentCount: 0,
      maxCapacity: settings.defaultMaxStudentsPerTeacher,
      availableCapacity: settings.defaultMaxStudentsPerTeacher,
      capacityPercentage: 0,
      isAtCapacity: false,
      weeklyClassesScheduled: 0,
      activeStatus: teacher.active !== false,
      isEligibleForAutoAssign: true
    };

    const explanationNotes: string[] = [];
    const breakdown: TeacherMatchScoreBreakdown = {
      disciplineMatch: 0,
      levelMatch: 0,
      availabilityMatch: 0,
      capacityScore: 0,
      continuityBonus: 0,
      workloadBalanceBonus: 0
    };

    // Rule 0: Teacher Active Status & Eligibility
    if (!workload.activeStatus) {
      results.push({
        teacher,
        totalScore: 0,
        breakdown,
        isEligible: false,
        recommendedStatus: 'REASSIGNMENT_REQUIRED',
        primaryReason: 'Faculty member is currently inactive',
        explanationNotes: ['Teacher account is deactivated in staff directory.']
      });
      return;
    }

    if (!workload.isEligibleForAutoAssign && settings.autoAssignmentEnabled) {
      explanationNotes.push('Excluded from automated routing per faculty profile preference.');
    }

    // Rule 1: Discipline / Course Instrument Match (Max 40 pts)
    const isDisciplineMatch = isTeacherDisciplineMatch(teacher, courseDef);
    if (isDisciplineMatch) {
      breakdown.disciplineMatch = 40;
      explanationNotes.push(`Verified pedagogy match for ${courseDef.instrument} (${courseDef.name}).`);
    } else {
      breakdown.disciplineMatch = 0;
      explanationNotes.push(`Discipline mismatch: does not teach ${courseDef.instrument}.`);
    }

    // Rule 2: Pedagogical Level Match (Max 15 pts)
    const suitableLevels = teacher.suitableLevels;
    if (!suitableLevels || suitableLevels.length === 0) {
      // Default: all conservatory faculty can teach Foundation and Developing
      breakdown.levelMatch = 12;
      explanationNotes.push(`Standard curriculum level qualified for ${level}.`);
    } else if (suitableLevels.some((l) => l.toLowerCase() === level.toLowerCase())) {
      breakdown.levelMatch = 15;
      explanationNotes.push(`Specialized certification for ${level} level students.`);
    } else {
      breakdown.levelMatch = 5;
      explanationNotes.push(`Level ${level} is outside primary teaching track.`);
    }

    // Rule 3: Teacher Availability (Max 15 pts)
    const hasWeeklyAvailability = Array.isArray(teacher.availability) && teacher.availability.length > 0;
    if (hasWeeklyAvailability) {
      breakdown.availabilityMatch = 15;
      explanationNotes.push(`Active weekly timetable available with open teaching slots.`);
    } else {
      breakdown.availabilityMatch = 8;
      explanationNotes.push(`Flexible on-demand scheduling availability.`);
    }

    // Rule 4: Capacity & Workload (Max 15 pts)
    if (workload.isAtCapacity) {
      breakdown.capacityScore = 0;
      explanationNotes.push(`At full capacity (${workload.activeEnrollmentCount}/${workload.maxCapacity} active students).`);
    } else {
      const remainingRatio = workload.availableCapacity / workload.maxCapacity;
      breakdown.capacityScore = Math.round(remainingRatio * 15);
      explanationNotes.push(
        `Healthy student capacity: ${workload.activeEnrollmentCount}/${workload.maxCapacity} students (${workload.availableCapacity} open seats).`
      );
    }

    // Rule 5: Teacher-Student Continuity Bonus (Max 15 pts)
    const hasContinuity = studentHistoryTeachers.includes(teacher.id) || (teacher.teacherId && studentHistoryTeachers.includes(teacher.teacherId));
    if (settings.prioritizeContinuity && hasContinuity) {
      breakdown.continuityBonus = 15;
      explanationNotes.push(`High continuity bonus: Student has previous mentorship history with ${teacher.name}.`);
    }

    // Rule 6: Fair Workload Distribution Bonus (Max 10 pts)
    // Reward teachers who currently have lower active workload to maintain balance
    if (workload.capacityPercentage < 30) {
      breakdown.workloadBalanceBonus = 10;
      explanationNotes.push('Workload distribution priority: Faculty currently has high availability.');
    } else if (workload.capacityPercentage < 60) {
      breakdown.workloadBalanceBonus = 7;
    } else if (workload.capacityPercentage < 80) {
      breakdown.workloadBalanceBonus = 3;
    } else {
      breakdown.workloadBalanceBonus = 0;
    }

    // Preferred Teacher / Fixed Assignment Rule Override
    const isPreferred = preferredTeacherId && (teacher.id === preferredTeacherId || teacher.teacherId === preferredTeacherId);
    if (isPreferred && settings.fixedAssignmentOverridesAuto) {
      explanationNotes.unshift('Designated as preferred/fixed teacher by administrator.');
    }

    const totalScore = isDisciplineMatch
      ? breakdown.disciplineMatch +
        breakdown.levelMatch +
        breakdown.availabilityMatch +
        breakdown.capacityScore +
        breakdown.continuityBonus +
        breakdown.workloadBalanceBonus +
        (isPreferred ? 100 : 0)
      : 0;

    const isEligible = isDisciplineMatch && (!workload.isAtCapacity || isPreferred);

    let recommendedStatus: AssignmentEngineStatus = 'AUTO_ASSIGNED';
    let primaryReason = `Best pedagogical match with score ${totalScore}/100`;

    if (isPreferred) {
      recommendedStatus = 'ADMIN_ASSIGNED';
      primaryReason = 'Fixed administrator preference fulfilled.';
    } else if (!isEligible) {
      recommendedStatus = 'REASSIGNMENT_REQUIRED';
      primaryReason = workload.isAtCapacity ? 'Teacher is at maximum student capacity.' : 'Course discipline mismatch.';
    }

    results.push({
      teacher,
      totalScore,
      breakdown,
      isEligible,
      recommendedStatus,
      primaryReason,
      explanationNotes
    });
  });

  // Rank by total score descending
  return results.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Finds the top recommended teacher for an enrollment
 */
export function getBestTeacherRecommendation(matches: TeacherMatchResult[]): {
  selectedMatch: TeacherMatchResult | null;
  status: AssignmentEngineStatus;
  reason: string;
} {
  const eligibleMatches = matches.filter((m) => m.isEligible && m.totalScore > 0);

  if (eligibleMatches.length === 0) {
    return {
      selectedMatch: null,
      status: 'REASSIGNMENT_REQUIRED',
      reason: 'No eligible faculty member found with open capacity matching this discipline.'
    };
  }

  const topMatch = eligibleMatches[0];
  return {
    selectedMatch: topMatch,
    status: topMatch.recommendedStatus,
    reason: topMatch.primaryReason
  };
}

/**
 * Executes Automated or Controlled Teacher Assignment for an Enrollment
 */
export async function assignTeacherToEnrollment(params: {
  enrollmentId: string;
  teacherId?: string; // If omitted, uses auto-match engine
  isManualOverride?: boolean;
  reason?: string;
  adminUser: { id?: string; uid?: string; email?: string; name?: string };
  teachers: TeacherProfile[];
  enrollments: EnrollmentRecord[];
}): Promise<{
  success: boolean;
  enrollment: EnrollmentRecord;
  status: AssignmentEngineStatus;
  message: string;
}> {
  const { enrollmentId, teacherId, isManualOverride, reason, adminUser, teachers, enrollments } = params;

  const enrRef = doc(db, 'enrollments', enrollmentId);
  const enrSnap = await getDoc(enrRef);

  if (!enrSnap.exists()) {
    throw new Error(`Enrollment ${enrollmentId} not found.`);
  }

  const currentEnrollment = enrSnap.data() as EnrollmentRecord;
  const settings = await getTeacherAssignmentSettings();
  const workloadMap = calculateTeacherWorkloads(teachers, enrollments);

  let targetTeacher: TeacherProfile | null = null;
  let finalStatus: AssignmentEngineStatus = 'AUTO_ASSIGNED';
  let assignmentReason = reason || 'Automated pedagogical matching';
  let matchScore = 0;

  if (teacherId) {
    // Admin explicit selection
    targetTeacher = teachers.find((t) => t.id === teacherId || t.teacherId === teacherId) || null;
    if (!targetTeacher) {
      throw new Error('Specified faculty member could not be found.');
    }
    if (targetTeacher.active === false || (targetTeacher as any).status === 'inactive') {
      throw new Error(`Cannot assign inactive faculty member ${targetTeacher.name}.`);
    }
    finalStatus = isManualOverride ? 'ADMIN_ASSIGNED' : 'ACTIVE';
    assignmentReason = reason || `Assigned directly by administrator ${adminUser.name || adminUser.email}`;
  } else {
    // Run automated matching algorithm
    const matches = evaluateTeacherMatches({
      courseId: currentEnrollment.courseId,
      level: currentEnrollment.level,
      studentId: currentEnrollment.studentId,
      studentHistoryTeachers: currentEnrollment.teacherHistory?.map((h) => h.teacherId) || [],
      teachers,
      workloadMap,
      settings
    });

    const recommendation = getBestTeacherRecommendation(matches);

    if (!recommendation.selectedMatch) {
      // Mark as requiring administrative attention
      const now = new Date().toISOString();
      await updateDoc(enrRef, {
        assignmentStatus: 'REASSIGNMENT_REQUIRED',
        assignmentReason: recommendation.reason,
        updatedAt: now
      });

      return {
        success: false,
        enrollment: { ...currentEnrollment, assignmentStatus: 'REASSIGNMENT_REQUIRED', assignmentReason: recommendation.reason },
        status: 'REASSIGNMENT_REQUIRED',
        message: recommendation.reason
      };
    }

    targetTeacher = recommendation.selectedMatch.teacher;
    finalStatus = recommendation.status;
    assignmentReason = recommendation.selectedMatch.primaryReason;
    matchScore = recommendation.selectedMatch.totalScore;
  }

  const now = new Date().toISOString();
  const history = Array.isArray(currentEnrollment.teacherHistory) ? [...currentEnrollment.teacherHistory] : [];

  // Close previous assignment if exists
  if (history.length > 0 && !history[history.length - 1].unassignedAt) {
    history[history.length - 1].unassignedAt = now;
  }

  history.push({
    teacherId: targetTeacher.id,
    teacherIdentifier: targetTeacher.teacherId || targetTeacher.id,
    teacherName: targetTeacher.name,
    assignedAt: now,
    assignedBy: adminUser.email || 'Admin',
    reason: assignmentReason
  });

  const updatedRecord: Partial<EnrollmentRecord> = {
    teacherId: targetTeacher.id,
    teacherIdentifier: targetTeacher.teacherId || targetTeacher.id,
    teacherName: targetTeacher.name,
    teacherEmail: targetTeacher.email,
    teacherSpecialization: targetTeacher.specialization || targetTeacher.title,
    assignmentStatus: finalStatus,
    assignmentReason,
    assignmentScore: matchScore,
    autoAssigned: !isManualOverride,
    teacherHistory: history,
    updatedAt: now
  };

  await updateDoc(enrRef, updatedRecord);

  // Sync to student profile's enrolledCourses
  if (currentEnrollment.studentId) {
    try {
      const studentRef = doc(db, 'users', currentEnrollment.studentId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as UserProfile;
        const currentEnrolled = Array.isArray(studentData.enrolledCourses) ? [...studentData.enrolledCourses] : [];
        const matchIdx = currentEnrolled.findIndex((c) => c.courseId === currentEnrollment.courseId);
        if (matchIdx >= 0) {
          currentEnrolled[matchIdx].teacherId = targetTeacher.id;
          currentEnrolled[matchIdx].teacherName = targetTeacher.name;
          await updateDoc(studentRef, {
            enrolledCourses: currentEnrolled,
            assignedTeacherId: targetTeacher.id,
            assignedTeacherName: targetTeacher.name,
            updatedAt: now
          });
        }
      }
    } catch (err) {
      console.warn('[Sync Error] Could not update student profile mirror:', err);
    }
  }

  // Audit Log
  try {
    await recordAuditLog(
      {
        id: adminUser.id || adminUser.uid || 'admin',
        name: adminUser.name || 'Administrator',
        email: adminUser.email || 'admin@saremiacademy.com',
        role: 'admin'
      },
      isManualOverride ? 'Admin Assigned Teacher to Enrollment' : 'Auto-Assigned Teacher to Enrollment',
      'student',
      currentEnrollment.studentId,
      `Assigned ${targetTeacher.name} to ${currentEnrollment.studentName}'s enrollment in ${currentEnrollment.courseName}. Status: ${finalStatus}. Reason: ${assignmentReason}`,
      {
        enrollmentId,
        teacherId: targetTeacher.id,
        teacherName: targetTeacher.name,
        status: finalStatus,
        matchScore
      }
    );
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to log assignment audit:', auditErr);
  }

  return {
    success: true,
    enrollment: { ...currentEnrollment, ...updatedRecord } as EnrollmentRecord,
    status: finalStatus,
    message: `Successfully assigned ${targetTeacher.name} (${finalStatus}).`
  };
}
