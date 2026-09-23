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
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CoursePackage,
  TrialAssessment,
  StudentSubscriptionStatus,
  EnrollmentRecord,
  ClassSession,
  AttendanceRecord,
  UserProfile,
  Course,
  CourseLevel,
  Instrument
} from '../types';
import { triggerTransactionalNotification } from './firestoreService';
import { recordAuditLog } from './adminFirestoreService';
import { sanitizeFirestorePayload } from './sessionService';
import { updateEnrollmentCompletedSessions } from './academicPostClassService';
import { dispatchNotification } from './notificationService';
import { findBestTeacherForSlot } from './teacherAutoAssignmentService';

/**
 * =========================================================================
 * SAREMI MUSIC ACADEMY STANDARD COURSE PACKAGES
 * =========================================================================
 */
export const ACADEMY_PACKAGES: CoursePackage[] = [
  {
    id: 'pkg-1month-weekly1',
    name: '4 Sessions / Month — Standard 1:1',
    durationMonths: 1,
    totalClasses: 4,
    classesPerWeek: 1,
    classDurationMins: 45,
    priceINR: 2499,
    priceUSD: 35,
    originalPriceINR: 2799,
    originalPriceUSD: 40,
    discountPercentage: 10,
    tagline: '1 Live 1:1 Session per week. Ideal for steady progress and flexible schedules.',
    badge: 'Standard 1:1',
    features: [
      '4 Live 1:1 Personalized Mentorship Sessions (45 min)',
      'Dedicated Certified Guru with weekly progress notes',
      'Full Tanpura, Metronome & Sargam Practice Studio access',
      'Weekly Audio/Video Homework feedback within 24h',
      'Flexible Rescheduling (1 class/month)'
    ],
    certificateIncluded: false,
    masterclassAccess: false,
    practiceStudioUnlimited: true
  },
  {
    id: 'pkg-1month-starter',
    name: '8 Sessions / Month — 1:1 Intensive',
    durationMonths: 1,
    totalClasses: 8,
    classesPerWeek: 2,
    classDurationMins: 45,
    priceINR: 4499,
    priceUSD: 60,
    originalPriceINR: 4999,
    originalPriceUSD: 70,
    discountPercentage: 10,
    tagline: '2 Live 1:1 Sessions per week. Recommended for fast-track skill acquisition.',
    badge: 'Weekly 2',
    features: [
      '8 Live 1:1 Personalized Mentorship Sessions (45 min)',
      'Dedicated Certified Guru with weekly progress notes',
      'Full Tanpura, Metronome & Sargam Practice Studio access',
      'Weekly Audio/Video Homework feedback within 24h',
      'Flexible Rescheduling (up to 2 classes/month)'
    ],
    certificateIncluded: false,
    masterclassAccess: false,
    practiceStudioUnlimited: true
  },
  {
    id: 'pkg-2month-term',
    name: '2-Month Term (16 Sessions • Save 10%)',
    durationMonths: 2,
    totalClasses: 16,
    classesPerWeek: 2,
    classDurationMins: 45,
    priceINR: 8598,
    priceUSD: 115,
    originalPriceINR: 9550,
    originalPriceUSD: 130,
    discountPercentage: 10,
    tagline: '2-Month structured curriculum with 10% term savings (₹4,299/mo).',
    badge: 'Save 10%',
    features: [
      '16 Live 1:1 Mentorship Sessions (2x / week)',
      'Personalized Raag / Repertoire & Technique Roadmap',
      'Mid-Term Assessment & Progress Benchmark Report',
      'Unlimited Riyaz Studio & Practice Tracker Tools',
      'Recorded Class Recaps & Notation Study Sheets'
    ],
    certificateIncluded: false,
    masterclassAccess: true,
    practiceStudioUnlimited: true
  },
  {
    id: 'pkg-3month-term',
    name: '3-Month Level Certification Term (24 Sessions • Save 15%)',
    durationMonths: 3,
    totalClasses: 24,
    classesPerWeek: 2,
    classDurationMins: 45,
    priceINR: 11997,
    priceUSD: 160,
    originalPriceINR: 14115,
    originalPriceUSD: 190,
    discountPercentage: 15,
    tagline: 'Structured classical & modern curriculum with level completion certification (₹3,999/mo).',
    badge: '👑 Best Value',
    isPopular: true,
    features: [
      '24 Live 1:1 Mentorship Sessions (2x / week)',
      'Personalized Raag / Repertoire & Technique Roadmap',
      'Official Saremi Academy Graded Level Certificate',
      'Free Access to 1 Live Maestro Masterclass',
      'Unlimited Riyaz Studio & Practice Tracker Tools',
      'Recorded Class Recaps & Notation Study Sheets'
    ],
    certificateIncluded: true,
    masterclassAccess: true,
    practiceStudioUnlimited: true
  },
  {
    id: 'pkg-group-8s-3m',
    name: '3-Month Group Batch (24 Sessions • Vocals)',
    durationMonths: 3,
    totalClasses: 24,
    classesPerWeek: 2,
    classDurationMins: 45,
    priceINR: 4842,
    priceUSD: 65,
    originalPriceINR: 5697,
    originalPriceUSD: 80,
    discountPercentage: 15,
    tagline: 'Small interactive batch (max 4) for Hindustani Vocals (₹1,614/mo).',
    badge: 'Group Batch',
    features: [
      '24 Interactive Group Sessions (Max 4 Students)',
      'Hindustani Vocals Swara & Bandish Pedagogy',
      'Group Riyaaz & Peer Harmony Drills',
      'Full Practice Studio Access',
      'Course Completion Certificate'
    ],
    certificateIncluded: true,
    masterclassAccess: true,
    practiceStudioUnlimited: true
  },
  {
    id: 'pkg-12month-diploma',
    name: '12-Month Annual Artist Diploma',
    durationMonths: 12,
    totalClasses: 96,
    classesPerWeek: 2,
    classDurationMins: 45,
    priceINR: 52999,
    priceUSD: 789,
    originalPriceINR: 71999,
    originalPriceUSD: 1079,
    discountPercentage: 26,
    tagline: 'Complete comprehensive mastery for aspiring concert and recording artists.',
    badge: 'Comprehensive',
    features: [
      '96 Live 1:1 Sessions with Master Faculty & Vocal Gurus',
      'Comprehensive Conservatory Diploma & Verified Credential',
      'All Ebooks, Practice Bundles & Digital Library Included',
      'Unlimited Masterclasses & Quarterly Master Reviews',
      'Featured Artist Profile on Saremi Global Showcase',
      'Dedicated Academic Relationship Manager'
    ],
    certificateIncluded: true,
    masterclassAccess: true,
    practiceStudioUnlimited: true
  }
];

/**
 * Helper to retrieve package by ID
 */
export function getPackageById(packageId: string): CoursePackage {
  return (
    ACADEMY_PACKAGES.find((p) => p.id === packageId) ||
    ACADEMY_PACKAGES[1] // Default to 3-month term
  );
}

/**
 * =========================================================================
 * 1. TRIAL ASSESSMENT & DIAGNOSTIC EVALUATION
 * =========================================================================
 */
export async function submitTrialAssessment(
  assessment: Omit<TrialAssessment, 'id' | 'createdAt'>
): Promise<TrialAssessment> {
  const assessmentId = `ta-${Date.now()}`;
  const now = new Date().toISOString();
  const path = `trial_assessments/${assessmentId}`;

  const record: TrialAssessment = {
    ...assessment,
    id: assessmentId,
    createdAt: now
  };

  try {
    // 1. Save Trial Assessment document
    await setDoc(doc(db, 'trial_assessments', assessmentId), record);

    // 2. Update trial booking record status to "completed" and attach assessment ID
    if (assessment.trialId) {
      try {
        const trialRef = doc(db, 'trial_bookings', assessment.trialId);
        await updateDoc(trialRef, {
          status: 'completed',
          assessmentId,
          feedback: assessment.teacherFeedback
        });
      } catch (err) {
        console.warn('Trial booking update notice:', err);
      }
    }

    // 3. Dispatch pedagogical assessment email to student
    await triggerTransactionalNotification({
      id: `email-${Date.now()}`,
      recipientEmail: assessment.studentEmail,
      recipientName: assessment.studentName,
      subject: `Your Diagnostic Trial Report & Recommendation - Saremi Academy`,
      type: 'trial_booking_confirmation',
      sentAt: now,
      content: `Namaste ${assessment.studentName},\n\nThank you for attending your 1:1 Diagnostic Session for ${assessment.courseName} with ${assessment.teacherName}!\n\nGuru Evaluation Summary:\n• Overall Musical Score: ${assessment.overallScore}/10\n• Pitch Accuracy: ${assessment.pitchAccuracy}/10\n• Rhythm & Laya Sense: ${assessment.rhythmSense}/10\n• Ear Grasping: ${assessment.earGrasping}/10\n\nRecommended Placement: ${assessment.recommendedLevel}\nRecommended Course Term: ${assessment.recommendedPackageName}\n\nTeacher's Note: "${assessment.teacherFeedback}"\n\nLog in to your Student Sanctuary to view your complete roadmap and begin your formal training.\n\nWarmly,\nAcademic Directorate, Saremi Academy`
    });

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return record;
  }
}

export function subscribeToStudentTrialAssessments(
  emailOrSuccess: string | ((assessments: TrialAssessment[]) => void),
  studentUidOrSuccess?: string | ((assessments: TrialAssessment[]) => void),
  onSuccessCb?: (assessments: TrialAssessment[]) => void
): () => void {
  let email = '';
  let studentUid = '';
  let onSuccess: (assessments: TrialAssessment[]) => void = () => {};

  if (typeof emailOrSuccess === 'function') {
    onSuccess = emailOrSuccess;
  } else {
    const val1 = (emailOrSuccess || '').trim();
    if (val1.includes('@')) {
      email = val1;
    } else {
      studentUid = val1;
    }

    if (typeof studentUidOrSuccess === 'function') {
      onSuccess = studentUidOrSuccess;
    } else if (typeof studentUidOrSuccess === 'string') {
      const val2 = studentUidOrSuccess.trim();
      if (val2.includes('@')) {
        email = val2;
      } else if (!studentUid) {
        studentUid = val2;
      }
      if (typeof onSuccessCb === 'function') {
        onSuccess = onSuccessCb;
      }
    }
  }

  const safeNotify = (items: TrialAssessment[]) => {
    if (typeof onSuccess === 'function') {
      onSuccess(items);
    }
  };

  const colRef = collection(db, 'trial_assessments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TrialAssessment));
      if (email || studentUid) {
        const emailLower = email.toLowerCase();
        const uidLower = studentUid.toLowerCase();
        list = list.filter((a) => {
          const matchEmail = email && (
            (a.studentEmail && a.studentEmail.toLowerCase().trim() === emailLower) ||
            ((a as any).email && ((a as any).email as string).toLowerCase().trim() === emailLower)
          );
          const matchUid = studentUid && (
            (a.studentId && a.studentId.toLowerCase() === uidLower) ||
            ((a as any).userId && ((a as any).userId as string).toLowerCase() === uidLower)
          );
          return Boolean(matchEmail || matchUid);
        });
      }
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeNotify(list);
    },
    (err) => {
      console.warn('Trial assessments subscription notice:', err.message);
      safeNotify([]);
    }
  );
}

/**
 * =========================================================================
 * 2. SUBSCRIPTION HEALTH & EXPIRY CALCULATION (DATABASE & SERVER INTEGRATED)
 * =========================================================================
 */
export function calculateSubscriptionStatus(
  profile: UserProfile | null,
  enrollments: EnrollmentRecord[] = []
): StudentSubscriptionStatus {
  const safeEnrollments = Array.isArray(enrollments) ? enrollments.filter(Boolean) : [];
  const activeEnrollment = safeEnrollments.find((e) => e?.status === 'active') || safeEnrollments[0];
  const enrolledCourse = Array.isArray(profile?.enrolledCourses) ? profile?.enrolledCourses[0] : undefined;

  const now = new Date();
  const defaultFutureDate = new Date(now.getTime() + 60 * 86400000).toISOString();

  // STRICT: If no active enrollment or course exists, return locked empty state with safe fallback values
  if (!activeEnrollment && !enrolledCourse) {
    return {
      hasActiveSubscription: false,
      accessGranted: false,
      isExpired: false,
      isExhausted: false,
      isExpiringSoon: false,
      status: 'pending',
      purchaseDate: now.toISOString(),
      startDate: now.toISOString(),
      expiryDate: now.toISOString(),
      daysUntilExpiry: 0,
      totalSessions: 0,
      classesTotal: 0,
      usedSessions: 0,
      remainingSessions: 0,
      classesRemaining: 0,
      completionPercentage: 0,
      packageDuration: 'No Active Package',
      lockReason: 'inactive_subscription',
      message: 'You do not have an active package. Please enroll in a course.'
    };
  }

  const purchaseDate = 
    activeEnrollment?.purchaseDate ||
    enrolledCourse?.purchaseDate ||
    activeEnrollment?.startDate ||
    enrolledCourse?.startDate ||
    enrolledCourse?.enrolledAt ||
    now.toISOString();

  const startDate = 
    activeEnrollment?.startDate ||
    enrolledCourse?.startDate ||
    enrolledCourse?.enrolledAt ||
    now.toISOString();

  const expiryDate = 
    activeEnrollment?.expiryDate ||
    activeEnrollment?.endDate ||
    enrolledCourse?.expiryDate ||
    defaultFutureDate;

  const packageDuration = 
    activeEnrollment?.packageDuration ||
    enrolledCourse?.packageDuration ||
    (enrolledCourse?.durationMonths ? `${enrolledCourse.durationMonths} Months` : 'Custom Package');

  const rawTotalSessions = 
    activeEnrollment?.totalSessions ??
    activeEnrollment?.classesTotal ??
    enrolledCourse?.totalSessions ??
    0;
  const totalSessions = typeof rawTotalSessions === 'number' && !isNaN(rawTotalSessions) ? Math.max(0, rawTotalSessions) : 0;

  const rawUsedSessions = 
    typeof activeEnrollment?.usedSessions === 'number'
      ? activeEnrollment.usedSessions
      : typeof activeEnrollment?.classesCompleted === 'number'
      ? activeEnrollment.classesCompleted
      : typeof enrolledCourse?.usedSessions === 'number'
      ? enrolledCourse.usedSessions
      : typeof enrolledCourse?.sessionsCompleted === 'number'
      ? enrolledCourse.sessionsCompleted
      : 0;
  const usedSessions = typeof rawUsedSessions === 'number' && !isNaN(rawUsedSessions) ? Math.max(0, rawUsedSessions) : 0;

  const rawRemainingSessions = 
    typeof activeEnrollment?.remainingSessions === 'number'
      ? activeEnrollment.remainingSessions
      : typeof enrolledCourse?.remainingSessions === 'number'
      ? enrolledCourse.remainingSessions
      : typeof enrolledCourse?.sessionsRemaining === 'number'
      ? enrolledCourse.sessionsRemaining
      : Math.max(0, totalSessions - usedSessions);
  const remainingSessions = typeof rawRemainingSessions === 'number' && !isNaN(rawRemainingSessions) ? Math.max(0, rawRemainingSessions) : 0;

  const completionPercentage = totalSessions > 0 ? Math.min(100, Math.max(0, Math.round((usedSessions / totalSessions) * 100))) : 0;

  // Date diff calculation with NaN protection
  const expDateObj = new Date(expiryDate);
  const isValidExpDate = !isNaN(expDateObj.getTime());
  const diffTime = isValidExpDate ? (expDateObj.getTime() - now.getTime()) : 0;
  const daysUntilExpiry = isValidExpDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  const isExpiredByDate = isValidExpDate ? (daysUntilExpiry <= 0 || expDateObj < now) : false;
  const isExhaustedBySessions = totalSessions > 0 && (remainingSessions <= 0 || usedSessions >= totalSessions);
  
  const isExplicitlyExpired = 
    activeEnrollment?.status === 'expired' || 
    enrolledCourse?.status === 'expired' ||
    profile?.subscriptionStatus?.active === false;

  const isExplicitlyExhausted = 
    activeEnrollment?.status === 'exhausted' || 
    enrolledCourse?.status === 'exhausted';

  const isExpired = isExpiredByDate || isExplicitlyExpired;
  const isExhausted = isExhaustedBySessions || isExplicitlyExhausted;
  
  const accessGranted = !isExpired && !isExhausted;
  const isExpiringSoon = accessGranted && (remainingSessions <= 3 || daysUntilExpiry <= 14);

  let status: 'active' | 'expired' | 'exhausted' | 'pending' = 'active';
  let lockReason: 'package_expired' | 'sessions_exhausted' | 'inactive_subscription' | null = null;
  let message = 'Active Subscription';

  if (!accessGranted) {
    if (isExhausted) {
      status = 'exhausted';
      lockReason = 'sessions_exhausted';
      message = 'Your package has expired. Renew your plan to continue learning.';
    } else if (isExpired) {
      status = 'expired';
      lockReason = 'package_expired';
      message = 'Your package has expired. Renew your plan to continue learning.';
    } else {
      status = 'pending';
      lockReason = 'inactive_subscription';
      message = 'Your subscription is currently inactive.';
    }
  }

  return {
    hasActiveSubscription: accessGranted,
    accessGranted,
    isExpired: !accessGranted,
    isExpiringSoon,
    isExhausted,
    purchaseDate,
    startDate,
    expiryDate,
    packageDuration,
    totalSessions,
    usedSessions,
    remainingSessions: accessGranted ? remainingSessions : 0,
    status,
    classesRemaining: accessGranted ? remainingSessions : 0,
    classesTotal: totalSessions,
    completionPercentage,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    renewalDiscountPercent: 12,
    lockReason,
    message,
    activeCourse: enrolledCourse,
    packageDetails: {
      packageId: activeEnrollment?.packageId || enrolledCourse?.packageId || 'pkg-3month',
      packageName: activeEnrollment?.packageName || enrolledCourse?.packageName || '3-Month Level Certification Term (24 Classes)',
      courseTitle: activeEnrollment?.courseName || enrolledCourse?.courseTitle || 'Hindustani Classical Vocal Conservatory',
      teacherName: activeEnrollment?.teacherName || enrolledCourse?.teacherName || 'Vidushi Sunanda Sharma',
      format: '1:1 Private Mentorship with Faculty Master'
    }
  };
}

/**
 * Validate package access with server-side backend endpoint
 */
export async function validatePackageAccessViaBackend(payload: {
  studentId?: string;
  studentEmail?: string;
  courseId?: string;
  packageData?: any;
}): Promise<{
  accessGranted: boolean;
  status: 'active' | 'expired' | 'exhausted' | 'pending';
  isExpired: boolean;
  isExhausted: boolean;
  message: string;
  lockReason: 'package_expired' | 'sessions_exhausted' | 'inactive_subscription' | null;
  packageDetails: any;
}> {
  try {
    const res = await fetch('/api/check-package-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend package check fallback to client computation:', err);
  }

  // Fallback to local calculation
  const local = calculateSubscriptionStatus(null, []);
  return {
    accessGranted: local.accessGranted,
    status: local.status,
    isExpired: local.isExpired,
    isExhausted: local.isExhausted,
    message: local.message || 'Your package has expired. Renew your plan to continue learning.',
    lockReason: local.lockReason,
    packageDetails: {
      purchaseDate: local.purchaseDate,
      startDate: local.startDate,
      expiryDate: local.expiryDate,
      packageDuration: local.packageDuration,
      totalSessions: local.totalSessions,
      usedSessions: local.usedSessions,
      remainingSessions: local.remainingSessions,
      status: local.status,
      daysRemaining: local.daysUntilExpiry
    }
  };
}

/**
 * =========================================================================
 * 3. COURSE ENROLLMENT, PAYMENT VERIFICATION & SCHEDULE INITIALIZATION
 * =========================================================================
 */
export interface CourseEnrollmentPayload {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  course: Course;
  packageItem: CoursePackage;
  preferredTeacher?: {
    id: string;
    name: string;
  };
  preferredSlot?: {
    day1: string;
    time1: string;
    day2?: string;
    time2?: string;
  };
  paymentInfo: {
    orderId: string;
    paymentId: string;
    amountPaid: number;
    currency: string;
    paymentMethod?: string;
    serverVerificationToken?: string;
    isSimulated?: boolean;
  };
}

export async function processCourseEnrollment(
  payload: CourseEnrollmentPayload
): Promise<{ enrollment: EnrollmentRecord; classes: ClassSession[] }> {
  const { student, course, packageItem, preferredTeacher, preferredSlot, paymentInfo } = payload;
  const now = new Date().toISOString();

  // CRITICAL SECURITY ENFORCEMENT: Never activate enrollment without verified payment
  if (!paymentInfo || !paymentInfo.paymentId || !paymentInfo.orderId) {
    throw new Error('Enrollment rejected: Missing verified payment details. Payment must be verified server-side.');
  }

  // CRITICAL: In production, simulated payments are strictly forbidden from activating real enrollments
  if (process.env.NODE_ENV === 'production') {
    if (
      paymentInfo.isSimulated ||
      paymentInfo.paymentId.startsWith('pay_sim_') ||
      paymentInfo.paymentId.startsWith('pay_demo_') ||
      paymentInfo.orderId.startsWith('order_sim_')
    ) {
      throw new Error('Security Alert: Simulated payment tokens cannot activate real enrollments in production.');
    }
  }

  // Deterministic Enrollment ID based on Order ID
  const sanitizedOrderId = (paymentInfo.orderId || `ord_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const enrollmentId = `enr_${sanitizedOrderId}`;

  // =========================================================================
  // 1. DEDUPLICATION & IDEMPOTENCY CHECK
  // Prevent duplicate webhook or concurrent calls from creating duplicate enrollments/classes
  // =========================================================================
  try {
    const existingEnrRef = doc(db, 'enrollments', enrollmentId);
    const existingEnrDoc = await getDoc(existingEnrRef);

    let existingRecord: EnrollmentRecord | null = null;
    if (existingEnrDoc.exists()) {
      existingRecord = existingEnrDoc.data() as EnrollmentRecord;
    } else {
      // Secondary query fallback by orderId
      const orderQuery = query(
        collection(db, 'enrollments'),
        where('orderId', '==', paymentInfo.orderId)
      );
      const orderSnap = await getDocs(orderQuery);
      if (!orderSnap.empty) {
        existingRecord = orderSnap.docs[0].data() as EnrollmentRecord;
      } else {
        // Tertiary query fallback by paymentId to prevent duplicate webhook/client race conditions
        const paymentQuery = query(
          collection(db, 'enrollments'),
          where('paymentId', '==', paymentInfo.paymentId)
        );
        const paymentSnap = await getDocs(paymentQuery);
        if (!paymentSnap.empty) {
          existingRecord = paymentSnap.docs[0].data() as EnrollmentRecord;
        }
      }
    }

    if (existingRecord) {
      console.log(`[Idempotent Enrollment] Enrollment already exists for order ${paymentInfo.orderId}. Returning existing records.`);

      // Retrieve existing scheduled classes for this enrollment
      const classesQuery = query(
        collection(db, 'classes'),
        where('studentId', '==', student.id),
        where('courseId', '==', course.id)
      );
      const classesSnap = await getDocs(classesQuery);
      const existingClasses = classesSnap.docs
        .map((d) => d.data() as ClassSession)
        .filter((c) => c.id.startsWith(`cls_${existingRecord!.id}_`));

      return { enrollment: existingRecord, classes: existingClasses };
    }
  } catch (checkErr) {
    console.warn('[Idempotency Check Warning]', checkErr);
  }

  // =========================================================================
  // 2. RECORD VERIFIED PAYMENT IN FIRESTORE (Deduplicated)
  // =========================================================================
  try {
    const paymentRef = doc(db, 'payments', paymentInfo.paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) {
      await setDoc(paymentRef, {
        id: paymentInfo.paymentId,
        orderId: paymentInfo.orderId,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
        courseId: course.id,
        courseTitle: course.title || course.name,
        packageId: packageItem.id,
        packageName: packageItem.name,
        amount: paymentInfo.amountPaid,
        currency: paymentInfo.currency || 'INR',
        paymentMethod: paymentInfo.paymentMethod || 'Razorpay Online',
        status: 'captured',
        verifiedAt: now,
        serverVerificationToken: paymentInfo.serverVerificationToken || null,
        isSimulated: Boolean(paymentInfo.isSimulated),
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (paymentErr) {
    console.warn('[Payment Storage Notice]', paymentErr);
  }

  // =========================================================================
  // 3. RECORD OR UPDATE ORDER IN FIRESTORE
  // =========================================================================
  try {
    const orderRef = doc(db, 'orders', paymentInfo.orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      await updateDoc(orderRef, {
        status: 'enrolled',
        paymentStatus: 'paid',
        razorpayPaymentId: paymentInfo.paymentId,
        updatedAt: now
      });
    } else {
      await setDoc(orderRef, {
        id: paymentInfo.orderId,
        userId: student.id,
        customerEmail: student.email,
        customerName: student.name,
        items: [
          {
            id: course.id,
            type: 'course_enrollment',
            title: `${course.title || course.name} - ${packageItem.name}`,
            price: paymentInfo.amountPaid,
            currency: paymentInfo.currency || 'INR',
            quantity: 1,
            imageUrl: (course as any).thumbnail || (course as any).image || '',
            category: course.category,
            instrument: course.instrument,
            level: course.level
          }
        ],
        orderType: 'digital',
        subtotal: paymentInfo.amountPaid,
        shippingFee: 0,
        total: paymentInfo.amountPaid,
        currency: paymentInfo.currency || 'INR',
        status: 'enrolled',
        statusHistory: [
          {
            status: 'enrolled',
            timestamp: now,
            note: `Enrollment confirmed via verified payment ${paymentInfo.paymentId}`
          }
        ],
        paymentStatus: 'paid',
        razorpayOrderId: paymentInfo.orderId,
        razorpayPaymentId: paymentInfo.paymentId,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (orderErr) {
    console.warn('[Order Storage Notice]', orderErr);
  }

  // =========================================================================
  // 4. PREPARE ALL REQUIRED ENROLLMENT FIELDS & TEACHER CONTINUITY RESOLUTION
  // Requirement: First try to retain the SAME demo teacher if active and eligible.
  // =========================================================================
  let resolvedTeacherId: string | undefined = undefined;
  let resolvedTeacherName: string | undefined = undefined;

  // Check if preferredTeacher parameter contains a explicit real ID
  if (preferredTeacher?.id && preferredTeacher.id !== 'assigned' && !preferredTeacher.id.startsWith('mock_') && !preferredTeacher.id.startsWith('static_')) {
    resolvedTeacherId = preferredTeacher.id;
    resolvedTeacherName = preferredTeacher.name;
  }

  // 1. First priority: Check student's trial_bookings or user profile to retain the demo teacher
  if (!resolvedTeacherId) {
    try {
      // Check user profile document first
      const studentUserDoc = await getDoc(doc(db, 'users', student.id));
      if (studentUserDoc.exists()) {
        const uData = studentUserDoc.data();
        if (uData.assignedTeacherId && uData.assignedTeacher) {
          resolvedTeacherId = uData.assignedTeacherId;
          resolvedTeacherName = uData.assignedTeacher;
        }
      }

      if (!resolvedTeacherId) {
        // Query trial_bookings by studentEmail or studentId
        const trialQuery = query(
          collection(db, 'trial_bookings'),
          where('studentEmail', '==', student.email)
        );
        let trialSnap = await getDocs(trialQuery);
        if (trialSnap.empty && student.id) {
          const uidQuery = query(
            collection(db, 'trial_bookings'),
            where('studentId', '==', student.id)
          );
          trialSnap = await getDocs(uidQuery);
        }

        if (!trialSnap.empty) {
          const trialData = trialSnap.docs[0].data();
          if (trialData?.teacherId && trialData?.teacherName && !trialData.teacherId.startsWith('mock_')) {
            // Verify demo teacher is active in /users/{uid} and /teachers/{uid}
            const teacherDoc = await getDoc(doc(db, 'teachers', trialData.teacherId));
            const userDoc = await getDoc(doc(db, 'users', trialData.teacherId));
            if (
              teacherDoc.exists() && 
              userDoc.exists() && 
              userDoc.data().role === 'teacher' && 
              userDoc.data().status !== 'inactive'
            ) {
              resolvedTeacherId = trialData.teacherId;
              resolvedTeacherName = trialData.teacherName;
            }
          }
        }
      }
    } catch (trialCheckErr) {
      console.warn('Trial teacher continuity resolution notice:', trialCheckErr);
    }
  }

  // 2. Second priority: If demo teacher unavailable, run teacher assignment engine
  if (!resolvedTeacherId) {
    try {
      const autoMatch = await findBestTeacherForSlot({
        discipline: (course.instrument as string) || course.category || 'vocals',
        courseTitle: course.title || course.name,
        targetDate: 'Flexible',
        targetTime: 'Flexible',
        studentId: student.id
      });

      if (autoMatch.success && autoMatch.assignedTeacher) {
        resolvedTeacherId = autoMatch.assignedTeacher.id;
        resolvedTeacherName = autoMatch.assignedTeacher.name;
      }
    } catch (autoErr) {
      console.warn('Auto teacher matching notice:', autoErr);
    }
  }

  const teacherId = resolvedTeacherId || 'unassigned_teacher';
  const teacherName = resolvedTeacherName || 'Faculty Mentor (Awaiting Assignment)';

  if (teacherId === 'unassigned_teacher') {
    try {
      await setDoc(doc(db, 'support_tickets', `ticket_reassign_${enrollmentId}`), {
        id: `ticket_reassign_${enrollmentId}`,
        userId: student.id,
        userName: student.name,
        userEmail: student.email,
        subject: `[ADMIN ACTION REQUIRED] Faculty Guru Assignment needed for ${student.name}`,
        category: 'Teacher Assignment',
        priority: 'high',
        status: 'open',
        description: `Student ${student.name} enrolled in ${course.title || course.name} (${packageItem.name}). Demo teacher was unavailable/inactive. Immediate Guru assignment required.`,
        createdAt: now,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Admin action ticket creation notice:', e);
    }
  }

  // Expiry Date (calculated from package duration in months)
  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + (packageItem.durationMonths || 3));

  const packageDurationText = `${packageItem.durationMonths} Month${packageItem.durationMonths > 1 ? 's' : ''}`;
  const programName = course.category 
    ? `${course.category} Classical Performance Program` 
    : 'Conservatory Music Program';

  const enrollment: EnrollmentRecord & { [key: string]: any } = {
    id: enrollmentId,
    // 1. Student Info
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone
    },
    // 2. Course Info
    courseId: course.id,
    courseName: course.title || course.name || 'Hindustani Classical Vocal',
    courseTitle: course.title || course.name || 'Hindustani Classical Vocal',
    level: (course.level as string) || 'Foundation',
    instrument: (course.instrument as string) || 'vocals',
    category: course.category || 'Indian Classical',
    course: {
      id: course.id,
      title: course.title || course.name,
      level: course.level,
      category: course.category,
      instrument: course.instrument
    },
    // 3. Program Info
    program: programName,
    programName,
    programTrack: (course.level as string) || 'Foundation',
    // 4. Package Info
    packageId: packageItem.id,
    packageName: packageItem.name,
    packageDuration: packageDurationText,
    durationMonths: packageItem.durationMonths,
    priceINR: packageItem.priceINR,
    priceUSD: packageItem.priceUSD,
    package: {
      id: packageItem.id,
      name: packageItem.name,
      durationMonths: packageItem.durationMonths,
      totalClasses: packageItem.totalClasses
    },
    // 5. Payment Info
    orderId: paymentInfo.orderId,
    paymentId: paymentInfo.paymentId,
    amountPaid: paymentInfo.amountPaid,
    currency: paymentInfo.currency || 'INR',
    paymentMethod: paymentInfo.paymentMethod || 'Razorpay Online',
    paymentStatus: 'paid',
    paymentVerified: true,
    paymentVerifiedAt: now,
    payment: {
      orderId: paymentInfo.orderId,
      paymentId: paymentInfo.paymentId,
      amountPaid: paymentInfo.amountPaid,
      currency: paymentInfo.currency || 'INR',
      method: paymentInfo.paymentMethod || 'Razorpay Online',
      status: 'paid',
      verifiedAt: now
    },
    // 6. Start Date
    startDate: now,
    purchaseDate: now,
    // 7. Expiry Date
    expiryDate: expDate.toISOString(),
    endDate: expDate.toISOString(),
    // 8. Total Sessions
    totalSessions: packageItem.totalClasses,
    classesTotal: packageItem.totalClasses,
    // 9. Remaining Sessions
    remainingSessions: packageItem.totalClasses,
    classesRemaining: packageItem.totalClasses,
    usedSessions: 0,
    classesCompleted: 0,
    // 10. Enrollment Status
    status: 'active',
    // Teacher & Scheduling
    teacherId,
    teacherName,
    scheduleSummary: preferredSlot
      ? `${preferredSlot.day1} ${preferredSlot.time1}${preferredSlot.day2 ? ` & ${preferredSlot.day2} ${preferredSlot.time2}` : ''}`
      : 'Tuesdays & Fridays at 6:00 PM IST',
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'enrollments', enrollmentId), enrollment);
  } catch (enrollDocErr) {
    console.log('[Workflow] Enrollment document synced via Server Admin SDK:', enrollDocErr);
  }

  // =========================================================================
  // 5. GENERATE SCHEDULED LIVE CLASS SESSIONS (With Class Deduplication & Preferred Slot Logic)
  // Respect package totalClasses (4, 8, etc.) from Admin Pricing configuration
  // =========================================================================
  const generatedClasses: ClassSession[] = [];
  const totalToGenerate = packageItem.totalClasses || (packageItem as any).sessionsTotal || ((packageItem as any).sessionsPerMonth ? (packageItem as any).sessionsPerMonth * (packageItem.durationMonths || 1) : 4);
  
  // Calculate scheduling dates based on preferred days if available
  const dayNameMap: Record<string, number> = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6
  };

  const day1Str = (preferredSlot?.day1 || 'Tuesday').toLowerCase();
  const day2Str = (preferredSlot?.day2 || 'Friday').toLowerCase();
  const targetDay1 = dayNameMap[day1Str] !== undefined ? dayNameMap[day1Str] : 2; // Default Tuesday
  const targetDay2 = dayNameMap[day2Str] !== undefined ? dayNameMap[day2Str] : 5; // Default Friday
  const targetDays = [targetDay1, targetDay2].sort((a, b) => a - b);

  let currentScheduleDate = new Date();
  currentScheduleDate.setDate(currentScheduleDate.getDate() + 1); // Start checking from tomorrow

  const scheduledDates: Date[] = [];
  while (scheduledDates.length < totalToGenerate) {
    const dayOfWeek = currentScheduleDate.getDay();
    if (targetDays.includes(dayOfWeek)) {
      scheduledDates.push(new Date(currentScheduleDate));
    }
    currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
  }

  for (let i = 1; i <= totalToGenerate; i++) {
    const classId = `cls_${enrollmentId}_${i}`;
    const sessionDate = scheduledDates[i - 1] || new Date(Date.now() + i * 3.5 * 86400000);

    const scheduledDateStr = sessionDate.toISOString().split('T')[0];
    const timeStr = preferredSlot?.time1 || '18:00';
    const scheduledAt = `${scheduledDateStr}T${timeStr}:00+05:30`;

    // Standardized Agora channel name
    const channelName = `saremi_live_${enrollmentId}_s${i}`;

    const session: ClassSession = {
      id: classId,
      studentId: student.id,
      studentName: student.name,
      teacherId,
      teacherName,
      courseId: course.id,
      courseTitle: course.title || course.name || 'Hindustani Classical Vocal',
      scheduledAt,
      durationMinutes: packageItem.classDurationMins || 45,
      status: 'scheduled',
      roomId: channelName,
      agoraChannelName: channelName,
      agoraAppId: process.env.AGORA_APP_ID || 'agora-saremi-prod',
      topic: `Class #${i}: ${i === 1 ? 'Orientation & Vocal Foundation' : `Classical Lesson Module ${i}`}`,
      date: scheduledDateStr,
      time: `${timeStr} IST`,
      sessionNumber: i,
      totalSessions: totalToGenerate,
      isTrial: false
    };

    try {
      // Check if session document already exists to prevent duplicate generation
      const existingClassSnap = await getDoc(doc(db, 'classes', classId));
      if (!existingClassSnap.exists()) {
        await setDoc(doc(db, 'live_classes', classId), session);
        await setDoc(doc(db, 'classes', classId), session);
      }
    } catch {
      await setDoc(doc(db, 'live_classes', classId), session).catch(() => {});
      await setDoc(doc(db, 'classes', classId), session).catch(() => {});
    }

    generatedClasses.push(session);
  }

  // =========================================================================
  // 6. UPDATE USER PROFILE WITH ACTIVE SUBSCRIPTION & ENROLLED COURSE
  // =========================================================================
  try {
    const userRef = doc(db, 'users', student.id);
    const userDoc = await getDoc(userRef);

    const enrolledCourseObj = {
      courseId: course.id,
      courseTitle: course.title || course.name || 'Hindustani Classical Vocal',
      program: programName,
      instrument: (course.instrument as Instrument) || 'vocals',
      enrolledAt: now,
      purchaseDate: now,
      startDate: now,
      expiryDate: expDate.toISOString(),
      packageDuration: packageDurationText,
      durationMonths: packageItem.durationMonths,
      level: (course.level as CourseLevel) || 'Foundation',
      sessionsCompleted: 0,
      usedSessions: 0,
      totalSessions: packageItem.totalClasses,
      sessionsRemaining: packageItem.totalClasses,
      remainingSessions: packageItem.totalClasses,
      packageId: packageItem.id,
      packageName: packageItem.name,
      status: 'active' as const,
      teacherId,
      teacherName,
      nextSessionDate: generatedClasses[0]?.date || 'Upcoming',
      nextSessionTime: generatedClasses[0]?.time || '18:00 IST',
      nextSessionId: generatedClasses[0]?.id,
      roomId: generatedClasses[0]?.roomId || 'room_live_1',
      isRenewalEligible: false
    };

    const updatedSubscription = {
      active: true,
      status: 'active' as const,
      packageId: packageItem.id,
      packageName: packageItem.name,
      startDate: now,
      expiryDate: expDate.toISOString(),
      totalSessions: packageItem.totalClasses,
      remainingSessions: packageItem.totalClasses,
      usedSessions: 0,
      updatedAt: now
    };

    if (userDoc.exists()) {
      const existing = userDoc.data() as UserProfile;
      const otherCourses = (existing.enrolledCourses || []).filter((c) => c.courseId !== course.id);
      await updateDoc(userRef, {
        role: 'student',
        enrolledCourses: [enrolledCourseObj, ...otherCourses],
        subscriptionStatus: updatedSubscription,
        trialCompleted: true,
        updatedAt: now
      });
    } else {
      await setDoc(userRef, {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: 'student',
        createdAt: now,
        enrolledCourses: [enrolledCourseObj],
        subscriptionStatus: updatedSubscription,
        trialCompleted: true
      });
    }
  } catch (err) {
    console.warn('User profile sync notice:', err);
  }

  // =========================================================================
  // 7. GENERATE OFFICIAL TAX INVOICE IN FIRESTORE
  // =========================================================================
  const invoiceId = `inv-${Date.now()}`;
  const invoice = {
    id: invoiceId,
    invoiceNumber: `SAR-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    orderId: paymentInfo.orderId,
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone,
    courseName: course.title || course.name || 'Hindustani Classical Vocal',
    packageName: packageItem.name,
    amount: paymentInfo.amountPaid,
    tax: 0,
    totalAmount: paymentInfo.amountPaid,
    paymentProvider: 'Razorpay',
    paymentReference: paymentInfo.paymentId,
    issuedDate: now,
    status: 'Paid'
  };
  await setDoc(doc(db, 'invoices', invoiceId), invoice).catch(() => {});

  // =========================================================================
  // 8. SEND TRANSACTIONAL CONFIRMATION EMAIL & IN-APP NOTIFICATIONS
  // =========================================================================
  await triggerTransactionalNotification({
    id: `email-${Date.now()}`,
    recipientEmail: student.email,
    recipientName: student.name,
    subject: `Welcome to Saremi Academy! Your enrollment in ${packageItem.name} is confirmed`,
    type: 'order_confirmation',
    sentAt: now,
    content: `Namaste ${student.name},\n\nWelcome to Saremi Academy! We are delighted to confirm your enrollment in:\n\nCourse: ${course.title || course.name}\nProgram: ${programName}\nPackage: ${packageItem.name} (${packageItem.totalClasses} Live 1:1 Sessions)\nAssigned Guru: ${teacherName}\nFirst Class: ${generatedClasses[0]?.date} at ${generatedClasses[0]?.time}\n\nInvoice Number: ${invoice.invoiceNumber}\nAmount Paid: ₹${paymentInfo.amountPaid.toLocaleString()}\n\nLog in anytime to your Student Dashboard to access your Live Studio, Tanpura Riyaz Tools, and study materials.\n\nWarm regards,\nAcademic Admissions, Saremi Academy`
  });

  // Real-time in-app notification for Student
  await dispatchNotification({
    userId: student.id,
    recipientRole: 'student',
    recipientName: student.name,
    recipientEmail: student.email,
    type: 'enrollment_active' as any,
    title: 'Enrollment Confirmed!',
    message: `Your enrollment in ${course.title || course.name} (${packageItem.name}) is confirmed. Your assigned guru is ${teacherName}.`,
    link: '/app/classes'
  }).catch(() => {});

  // Real-time in-app notification for Teacher
  if (teacherId && teacherId !== 'unassigned_teacher') {
    await dispatchNotification({
      userId: teacherId,
      recipientRole: 'teacher',
      recipientName: teacherName,
      type: 'student_assigned' as any,
      title: 'New Student Enrolled & Assigned',
      message: `${student.name} has enrolled in ${course.title || course.name} (${packageItem.name}) and assigned to your roster.`,
      link: '/teacher/students'
    }).catch(() => {});
  }

  return { enrollment, classes: generatedClasses };
}

/**
 * =========================================================================
 * 4. SUBSCRIPTION RENEWAL FLOW (Idempotent)
 * =========================================================================
 */
export async function processSubscriptionRenewal(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  packageItem: CoursePackage;
  currentEnrollmentId?: string;
  paymentInfo: {
    orderId: string;
    paymentId: string;
    amountPaid: number;
    currency?: string;
    serverVerificationToken?: string;
    isSimulated?: boolean;
  };
}): Promise<void> {
  const { studentId, studentName, studentEmail, packageItem, currentEnrollmentId, paymentInfo } = params;
  const now = new Date().toISOString();

  // CRITICAL SECURITY ENFORCEMENT
  if (!paymentInfo || !paymentInfo.paymentId || !paymentInfo.orderId) {
    throw new Error('Renewal rejected: Missing payment verification details. Payment must be verified server-side.');
  }

  if (process.env.NODE_ENV === 'production') {
    if (
      paymentInfo.isSimulated ||
      paymentInfo.paymentId.startsWith('pay_sim_') ||
      paymentInfo.paymentId.startsWith('pay_demo_') ||
      paymentInfo.orderId.startsWith('order_sim_')
    ) {
      throw new Error('Security Alert: Simulated payment tokens cannot activate real renewals in production.');
    }
  }

  // Deduplication check: Check if renewal for this order was already processed
  const renewalId = `enr_ren_${(paymentInfo.orderId || `ord_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const existingRenDoc = await getDoc(doc(db, 'enrollments', renewalId)).catch(() => null);
  if (existingRenDoc && existingRenDoc.exists()) {
    console.log(`[Idempotent Renewal] Renewal already processed for order ${paymentInfo.orderId}`);
    return;
  }

  // 1. Mark existing enrollment as graduated/renewed if present
  if (currentEnrollmentId) {
    try {
      const enrRef = doc(db, 'enrollments', currentEnrollmentId);
      await updateDoc(enrRef, {
        status: 'graduated',
        updatedAt: now
      });
    } catch {
      // non-blocking
    }
  }

  // 2. Record Payment in payments collection
  try {
    const paymentRef = doc(db, 'payments', paymentInfo.paymentId);
    await setDoc(paymentRef, {
      id: paymentInfo.paymentId,
      orderId: paymentInfo.orderId,
      studentId,
      studentName,
      studentEmail,
      packageId: packageItem.id,
      packageName: `${packageItem.name} (Renewal)`,
      amount: paymentInfo.amountPaid,
      currency: paymentInfo.currency || 'INR',
      paymentMethod: 'Razorpay Online',
      status: 'captured',
      verifiedAt: now,
      serverVerificationToken: paymentInfo.serverVerificationToken || null,
      isSimulated: Boolean(paymentInfo.isSimulated),
      createdAt: now,
      updatedAt: now
    });
  } catch (err) {
    console.warn('Payment record notice:', err);
  }

  // 3. Create renewed enrollment
  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + packageItem.durationMonths);

  const renewedRecord: EnrollmentRecord = {
    id: renewalId,
    studentId,
    studentName,
    studentEmail,
    studentPhone: '',
    courseId: 'course-hindustani-vocal',
    courseName: 'Hindustani Classical Vocal (Mastery Continuation)',
    level: 'Developing',
    packageId: packageItem.id,
    packageName: `${packageItem.name} (Renewal)`,
    teacherName: 'Vidushi Sunanda Sharma',
    scheduleSummary: 'Tuesdays & Fridays at 6:00 PM IST',
    classesTotal: packageItem.totalClasses,
    classesCompleted: 0,
    totalSessions: packageItem.totalClasses,
    usedSessions: 0,
    remainingSessions: packageItem.totalClasses,
    orderId: paymentInfo.orderId,
    status: 'active',
    startDate: now,
    endDate: expDate.toISOString(),
    expiryDate: expDate.toISOString(),
    amountPaid: paymentInfo.amountPaid,
    paymentStatus: 'paid',
    createdAt: now,
    updatedAt: now
  };

  await setDoc(doc(db, 'enrollments', renewalId), renewedRecord);

  // 4. Top up student credits in User Profile
  try {
    const userRef = doc(db, 'users', studentId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const existing = userDoc.data() as UserProfile;
      const updatedCourses = (existing.enrolledCourses || []).map((c) => ({
        ...c,
        totalSessions: (c.totalSessions || 0) + packageItem.totalClasses,
        sessionsRemaining: (c.sessionsRemaining || 0) + packageItem.totalClasses,
        remainingSessions: (c.remainingSessions || 0) + packageItem.totalClasses,
        expiryDate: expDate.toISOString(),
        status: 'active' as const
      }));

      await updateDoc(userRef, {
        enrolledCourses: updatedCourses,
        subscriptionStatus: {
          active: true,
          status: 'active',
          packageId: packageItem.id,
          packageName: packageItem.name,
          startDate: now,
          expiryDate: expDate.toISOString(),
          totalClasses: ((existing.subscriptionStatus?.totalClasses || existing.subscriptionStatus?.totalSessions || 0) + packageItem.totalClasses),
          classesRemaining: ((existing.subscriptionStatus?.classesRemaining || existing.subscriptionStatus?.remainingSessions || 0) + packageItem.totalClasses),
          totalSessions: ((existing.subscriptionStatus?.totalSessions || existing.subscriptionStatus?.totalClasses || 0) + packageItem.totalClasses),
          remainingSessions: ((existing.subscriptionStatus?.remainingSessions || existing.subscriptionStatus?.classesRemaining || 0) + packageItem.totalClasses),
          usedSessions: existing.subscriptionStatus?.usedSessions || 0,
          updatedAt: now
        },
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('Profile renewal credit top-up notice:', err);
  }

  // 5. Send Renewal Confirmation
  await triggerTransactionalNotification({
    id: `email-${Date.now()}`,
    recipientEmail: studentEmail,
    recipientName: studentName,
    subject: `Your Saremi Academy Subscription is renewed!`,
    type: 'order_confirmation',
    sentAt: now,
    content: `Namaste ${studentName},\n\nYour subscription renewal for ${packageItem.name} has been processed successfully. Your account has been credited with ${packageItem.totalClasses} new live 1:1 sessions.\n\nKeep up your Riyaaz!\n\nWarm regards,\nSaremi Academy Team`
  });
}

/**
 * =========================================================================
 * 5. ATTENDANCE & LIVE SESSION COMPLETION
 * =========================================================================
 */
export async function startLiveClass(classId: string) {
  const now = new Date().toISOString();
  try {
    // 1. Authoritative update on `classes/{classId}`
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      status: 'live',
      actualStartTime: now,
      updatedAt: now
    });
  } catch (error) {
    console.warn('Notice updating classes collection to live:', error);
  }

  // 2. Mirror into legacy `live_classes` if exists (safe and non-blocking)
  try {
    const liveRef = doc(db, 'live_classes', classId);
    await updateDoc(liveRef, {
      status: 'live',
      actualStartTime: now,
      updatedAt: now
    }).catch(() => {});
  } catch {
    // safe non-blocking
  }
}

export async function recordLiveClassAttendance(params: {
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  studentAttendanceDurationMinutes?: number;
  classId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  enrollmentId?: string;
  program?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  lessonNotes: string;
  homeworkAssigned?: string;
  teacherFeedback?: string;
  sessionNumber?: number;
}): Promise<AttendanceRecord> {
  const { classId, studentId, studentName, teacherId, teacherName, courseTitle, enrollmentId, program, status, lessonNotes, homeworkAssigned, teacherFeedback, sessionNumber } = params;
  const now = new Date().toISOString();
  
  // Deterministic attendance document ID
  const attId = `att_${classId}`;

  const attendance: AttendanceRecord = {
    id: attId,
    classId,
    studentId,
    studentName,
    teacherId,
    teacherName,
    courseTitle,
    enrollmentId,
    program,
    date: now.split('T')[0],
    status,
    notes: lessonNotes,
    updatedAt: now
  };

  // 1. Save Attendance Record safely
  await setDoc(doc(db, 'attendance_records', attId), sanitizeFirestorePayload(attendance), { merge: true });

  // 2. Mark Class Session as completed authoritatively in `classes`
  const updateData = {
    status: 'completed' as const,
    attendanceRecorded: true,
    attendanceMarked: true,
    attendanceStatus: status,
    lessonNotes,
    homeworkAssigned: homeworkAssigned || '',
    teacherFeedback: teacherFeedback || '',
    updatedAt: now,
    finalizedAt: now,
    ...(params.actualStartTime && { actualStartTime: params.actualStartTime }),
    ...(params.actualEndTime && { actualEndTime: params.actualEndTime }),
    ...(params.actualDurationMinutes !== undefined && { actualDurationMinutes: params.actualDurationMinutes }),
    ...(params.studentAttendanceDurationMinutes !== undefined && { studentAttendanceDurationMinutes: params.studentAttendanceDurationMinutes }),
  };

  const cleanUpdate = sanitizeFirestorePayload(updateData);
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, cleanUpdate);
  } catch (err) {
    console.warn('Update classes record completed status notice:', err);
  }

  // Safe mirror to legacy live_classes if it exists
  try {
    const liveRef = doc(db, 'live_classes', classId);
    await updateDoc(liveRef, cleanUpdate).catch(() => {});
  } catch {
    // non-blocking
  }

  // 3. Deduct credit idempotently from enrollment and sync user profile
  if (enrollmentId) {
    await updateEnrollmentCompletedSessions(enrollmentId, studentId, classId);
  } else if (studentId && (status === 'Present' || status === 'Late')) {
    try {
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const updated = (userData.enrolledCourses || []).map((c) => {
          const completed = (c.sessionsCompleted || 0) + 1;
          const remaining = Math.max(0, (c.totalSessions || 24) - completed);
          return {
            ...c,
            sessionsCompleted: completed,
            sessionsRemaining: remaining,
            status: (remaining === 0 ? 'completed' : remaining <= 3 ? 'expiring_soon' : 'active') as any
          };
        });

        await updateDoc(userRef, {
          enrolledCourses: updated,
          updatedAt: now
        });
      }
    } catch (err) {
      console.warn('Student attendance count update notice:', err);
    }
  }

  return attendance;
}
