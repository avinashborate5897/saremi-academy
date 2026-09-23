import { getAuthoritativePackage, getAuthoritativePrice } from '../data/pricingData';
import { getCourseBySlug, COURSE_CATALOG } from '../lib/courseCatalog';
import { dispatchNotificationService } from './notificationService';

export interface ServerEnrollmentPayload {
  orderId: string;
  paymentId: string;
  studentId: string;
  studentEmail?: string;
  studentName?: string;
  studentPhone?: string;
  courseId: string;
  packageId: string;
  amountPaid: number;
  currency: string;
  preferredTeacherId?: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduleSummary?: string;
  learningMode?: string;
  source?: 'webhook' | 'verification_api' | 'admin_direct';
}

export interface ServerEnrollmentResult {
  success: boolean;
  enrollmentId: string;
  alreadyActive: boolean;
  orderId: string;
  paymentId: string;
  courseId: string;
  packageId: string;
  teacherId: string;
  teacherName: string;
  classesGenerated: number;
  message: string;
  status: 'active' | 'already_processed' | 'failed';
}

/**
 * Normalizes course discipline to standard category
 */
function normalizeDiscipline(input: string = ''): string {
  const lower = input.toLowerCase();
  if (lower.includes('vocal') || lower.includes('sing') || lower.includes('voice') || lower.includes('hindustani') || lower.includes('carnatic')) {
    return 'vocals';
  }
  if (lower.includes('piano') || lower.includes('keyboard') || lower.includes('keys')) {
    return 'piano';
  }
  if (lower.includes('guitar') || lower.includes('acoustic')) {
    return 'guitar';
  }
  if (lower.includes('tabla') || lower.includes('percussion') || lower.includes('rhythm')) {
    return 'tabla';
  }
  if (lower.includes('violin') || lower.includes('strings')) {
    return 'violin';
  }
  if (lower.includes('flute') || lower.includes('bansuri')) {
    return 'flute';
  }
  return 'vocals';
}

/**
 * Checks if teacher is qualified for discipline
 */
function isTeacherQualified(teacherData: any, discipline: string, courseTitle: string = ''): boolean {
  const combined = `${teacherData.specialization || ''} ${teacherData.bio || ''} ${(teacherData.courses || []).join(' ')} ${courseTitle}`.toLowerCase();
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
    case 'flute':
      return combined.includes('flute') || combined.includes('bansuri');
    default:
      return true;
  }
}

/**
 * Server-Side Teacher Auto-Assignment Engine
 * Strictly filters inactive teachers and at-capacity teachers, scores candidates, and normalizes 0-100.
 */
export async function findBestTeacherForSlotServer(
  adminDb: any,
  params: {
    discipline: string;
    courseTitle?: string;
    targetDate?: string;
    targetTime?: string;
    studentId?: string;
    preferredTeacherId?: string;
    demoTeacherId?: string;
    adminOverrideTeacherId?: string;
  }
): Promise<{
  assignedTeacher: { id: string; name: string; email?: string; phone?: string; specialization?: string } | null;
  matchScore: number;
  reason: string;
  requiresAdminAttention: boolean;
}> {
  const { discipline, courseTitle = '', preferredTeacherId, demoTeacherId, adminOverrideTeacherId, studentId } = params;

  try {
    // 1. Fetch active teachers from /teachers and cross-verify with /users
    const teachersSnap = await adminDb.collection('teachers').get();
    if (teachersSnap.empty) {
      return {
        assignedTeacher: null,
        matchScore: 0,
        reason: 'No teachers registered in system.',
        requiresAdminAttention: true
      };
    }

    const verifiedTeachers: Array<{ id: string; data: any }> = [];
    for (const tDoc of teachersSnap.docs) {
      const tData = tDoc.data();
      const tId = tDoc.id;
      if (tData.active === false || tData.status === 'inactive') continue;

      try {
        const uDoc = await adminDb.collection('users').doc(tId).get();
        if (uDoc.exists) {
          const uData = uDoc.data();
          if (uData.role === 'teacher' && uData.status !== 'inactive' && uData.status !== 'banned') {
            verifiedTeachers.push({
              id: tId,
              data: {
                ...tData,
                name: tData.name || uData.name || 'Faculty Mentor',
                email: tData.email || uData.email || '',
                phone: tData.phone || uData.phone || '',
                specialization: tData.specialization || uData.specialization || 'Classical Music',
                maxCapacity: tData.maxCapacity || tData.maxStudents || uData.maxStudents || 25,
                rating: tData.rating || 5.0
              }
            });
          }
        }
      } catch (err) {
        console.warn(`[Server Teacher Check] Error checking user ${tId}:`, err);
      }
    }

    if (verifiedTeachers.length === 0) {
      return {
        assignedTeacher: null,
        matchScore: 0,
        reason: 'No active, verified faculty accounts available.',
        requiresAdminAttention: true
      };
    }

    // Check Admin Override
    if (adminOverrideTeacherId) {
      const override = verifiedTeachers.find(t => t.id === adminOverrideTeacherId);
      if (override) {
        return {
          assignedTeacher: {
            id: override.id,
            name: override.data.name,
            email: override.data.email,
            phone: override.data.phone,
            specialization: override.data.specialization
          },
          matchScore: 100,
          reason: `Admin Override: Authoritatively assigned ${override.data.name}.`,
          requiresAdminAttention: false
        };
      }
    }

    // Fetch active sessions to compute workload
    let activeSessions: any[] = [];
    try {
      const sessionsSnap = await adminDb.collection('classes').where('status', 'in', ['scheduled', 'live']).get();
      activeSessions = sessionsSnap.docs.map((d: any) => d.data());
    } catch {
      // Fallback if index missing
      try {
        const allSnap = await adminDb.collection('classes').limit(200).get();
        activeSessions = allSnap.docs.map((d: any) => d.data()).filter((s: any) => s.status === 'scheduled' || s.status === 'live');
      } catch {}
    }

    const normDisc = normalizeDiscipline(discipline || courseTitle);
    const candidates: Array<{
      teacher: { id: string; name: string; email?: string; phone?: string; specialization?: string };
      score: number;
      workload: number;
    }> = [];

    for (const vt of verifiedTeachers) {
      const tData = vt.data;
      const qualified = isTeacherQualified(tData, normDisc, courseTitle);
      if (!qualified) continue;

      const teacherWorkload = activeSessions.filter((s: any) => s.teacherId === vt.id).length;
      const maxCap = tData.maxCapacity || 25;

      // Exclude teachers at or above max capacity
      if (teacherWorkload >= maxCap) {
        continue;
      }

      // Base scoring
      let rawScore = 40; // Base qualification

      if (tData.specialization?.toLowerCase().includes(normDisc)) {
        rawScore += 10;
      }

      // Demo teacher continuity bonus
      if (demoTeacherId && vt.id === demoTeacherId) {
        rawScore += 25;
      }

      // Preferred teacher bonus
      if (preferredTeacherId && vt.id === preferredTeacherId) {
        rawScore += 15;
      }

      // Workload balancing bonus
      const capacityRatio = Math.max(0, 1 - (teacherWorkload / maxCap));
      rawScore += Math.round(15 * capacityRatio);

      // Rating bonus (up to 5 pts)
      const rating = Number(tData.rating) || 5;
      rawScore += Math.round(5 * (Math.min(5, Math.max(1, rating)) / 5));

      const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      candidates.push({
        teacher: {
          id: vt.id,
          name: tData.name,
          email: tData.email,
          phone: tData.phone,
          specialization: tData.specialization
        },
        score: normalizedScore,
        workload: teacherWorkload
      });
    }

    if (candidates.length === 0) {
      return {
        assignedTeacher: null,
        matchScore: 0,
        reason: `No qualified teachers within capacity limits found for ${normDisc}. Flagged for administrative allocation.`,
        requiresAdminAttention: true
      };
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
      assignedTeacher: best.teacher,
      matchScore: best.score,
      reason: `Assigned verified faculty ${best.teacher.name} (${normDisc} specialist, match score ${best.score}/100, active workload ${best.workload}).`,
      requiresAdminAttention: false
    };
  } catch (error: any) {
    console.error('[Server Teacher Auto-Assignment Error]', error);
    return {
      assignedTeacher: null,
      matchScore: 0,
      reason: `Auto-assignment error: ${error.message}`,
      requiresAdminAttention: true
    };
  }
}

/**
 * Server-Authoritative Paid Enrollment Activation
 * 
 * 1. Strictly enforces deterministic canonical ID: enr_${orderId}
 * 2. Enforces idempotency across duplicate webhooks, callbacks, API retries, and browser refreshes
 * 3. Resolves pricing strictly from getAuthoritativePackage() & getAuthoritativePrice()
 * 4. Verifies amountPaid against authoritative package price
 * 5. Assigns qualified faculty using findBestTeacherForSlotServer
 * 6. Generates scheduled class records with deterministic IDs: enr_${orderId}_cls_${i}
 * 7. Updates student subscription and access flags
 * 8. Dispatches multi-channel confirmation notifications
 */
export async function activatePaidEnrollmentServerSide(
  adminDb: any,
  payload: ServerEnrollmentPayload
): Promise<ServerEnrollmentResult> {
  const {
    orderId,
    paymentId,
    studentId,
    studentEmail = '',
    studentName = 'Enrolled Student',
    studentPhone = '',
    courseId,
    packageId,
    amountPaid,
    currency = 'INR',
    preferredTeacherId,
    preferredDate,
    preferredTime,
    scheduleSummary,
    learningMode = '1:1 Live Online',
    source = 'webhook'
  } = payload;

  const now = new Date().toISOString();
  // Deterministic canonical enrollment ID
  const cleanOrderId = String(orderId).replace(/^enr_/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const canonicalEnrollmentId = `enr_${cleanOrderId}`;

  // 1. Authoritative Package Validation
  const authPkg = getAuthoritativePackage(packageId);
  if (!authPkg) {
    throw new Error(`Invalid package identifier: "${packageId}". Package not found in authoritative catalog.`);
  }

  const authoritativePrice = getAuthoritativePrice(packageId, {
    currency: currency.toUpperCase() === 'USD' ? 'USD' : 'INR'
  });

  // Verify Amount against authoritative price
  // amountPaid is in main unit (e.g. INR ₹11,997). If provided in paise/cents, normalize
  const normalizedAmount = amountPaid > 100000 && authoritativePrice.finalPrice < 50000
    ? Math.round(amountPaid / 100)
    : amountPaid;

  if (Math.abs(normalizedAmount - authoritativePrice.finalPrice) > 5) {
    console.error(`[Security Alert] Paid amount (₹${normalizedAmount}) does not match authoritative price (₹${authoritativePrice.finalPrice}) for package ${packageId}`);
    // In production this must throw; we log and enforce the authoritative amount
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Security Violation: Paid amount ₹${normalizedAmount} does not match authoritative catalog price ₹${authoritativePrice.finalPrice}`);
    }
  }

  const courseMeta = getCourseBySlug(courseId) || COURSE_CATALOG[courseId] || {
    id: courseId,
    name: 'Indian Classical Music Conservatory',
    title: 'Indian Classical Music Conservatory',
    category: 'Indian Classical',
    instrument: 'vocals',
    level: 'Foundation to Advanced'
  };

  const totalClasses = authPkg.totalClasses || authPkg.sessions || (authPkg.sessionsPerMonth * authPkg.durationMonths);
  const durationMonths = authPkg.durationMonths || 1;

  // Calculate Expiry Date
  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + durationMonths);
  const expiryDateIso = expDate.toISOString();

  // 2. IDEMPOTENCY CHECK: Check if enrollment document already exists
  const enrollmentRef = adminDb.collection('enrollments').doc(canonicalEnrollmentId);
  const existingDoc = await enrollmentRef.get();

  if (existingDoc.exists && existingDoc.data()?.status === 'active') {
    console.log(`[Enrollment Idempotency] Enrollment ${canonicalEnrollmentId} is already active. Returning existing record.`);
    const data = existingDoc.data();
    return {
      success: true,
      enrollmentId: canonicalEnrollmentId,
      alreadyActive: true,
      orderId: cleanOrderId,
      paymentId,
      courseId,
      packageId,
      teacherId: data.teacherId || '',
      teacherName: data.teacherName || 'Assigned Faculty',
      classesGenerated: data.totalSessions || totalClasses,
      message: 'Enrollment is already activated and current.',
      status: 'already_processed'
    };
  }

  // 3. Demo Teacher Continuity Resolution
  let demoTeacherId: string | undefined = undefined;
  try {
    const trialSnap = await adminDb.collection('trial_bookings')
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
    if (!trialSnap.empty) {
      demoTeacherId = trialSnap.docs[0].data()?.teacherId;
    }
  } catch (tErr) {
    console.warn('[Demo Teacher Continuity Notice]', tErr);
  }

  // 4. Resolve Faculty Assignment
  const teacherMatch = await findBestTeacherForSlotServer(adminDb, {
    discipline: (courseMeta as any).instrument || courseMeta.category || 'vocals',
    courseTitle: courseMeta.title || courseMeta.name,
    targetDate: preferredDate || 'Flexible',
    targetTime: preferredTime || 'Flexible',
    studentId,
    preferredTeacherId,
    demoTeacherId
  });

  const resolvedTeacherId = teacherMatch.assignedTeacher?.id || 'unassigned_teacher';
  const resolvedTeacherName = teacherMatch.assignedTeacher?.name || 'Faculty Mentor (Awaiting Assignment)';

  // 5. Build Canonical Enrollment Record
  const enrollmentRecord = {
    id: canonicalEnrollmentId,
    enrollmentId: canonicalEnrollmentId,
    studentId,
    studentName,
    studentEmail,
    studentPhone,
    student: {
      id: studentId,
      name: studentName,
      email: studentEmail,
      phone: studentPhone
    },
    courseId: courseMeta.id || courseId,
    courseName: courseMeta.title || courseMeta.name,
    courseTitle: courseMeta.title || courseMeta.name,
    category: courseMeta.category || 'Indian Classical',
    instrument: (courseMeta as any).instrument || 'vocals',
    level: (courseMeta as any).level || 'Foundation to Advanced',
    program: `${courseMeta.title || courseMeta.name} (${authPkg.name})`,
    packageId: authPkg.id,
    packageName: authPkg.name,
    packageDuration: `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`,
    durationMonths,
    totalSessions: totalClasses,
    classesTotal: totalClasses,
    remainingSessions: totalClasses,
    classesRemaining: totalClasses,
    usedSessions: 0,
    classesCompleted: 0,
    teacherId: resolvedTeacherId,
    teacherName: resolvedTeacherName,
    preferredTeacherId: preferredTeacherId || '',
    learningMode,
    scheduleSummary: scheduleSummary || `${authPkg.sessionsPerMonth / 4} classes/week (45 mins)`,
    preferredDate: preferredDate || 'Flexible',
    preferredTime: preferredTime || 'Flexible',
    status: 'active',
    enrollmentStatus: 'active',
    orderId: cleanOrderId,
    paymentId,
    amountPaid: authoritativePrice.finalPrice,
    currency,
    paymentMethod: 'Razorpay Online',
    paymentStatus: 'paid',
    paymentVerified: true,
    paymentVerifiedAt: now,
    startDate: now,
    purchaseDate: now,
    expiryDate: expiryDateIso,
    endDate: expiryDateIso,
    source,
    createdAt: (existingDoc.exists && existingDoc.data()?.createdAt) || now,
    updatedAt: now
  };

  // 6. Write Records Atomically / via Batch
  const batch = adminDb.batch();

  // Save canonical enrollment record
  batch.set(enrollmentRef, enrollmentRecord, { merge: true });

  // Save payment record in /payments
  const paymentRef = adminDb.collection('payments').doc(paymentId);
  batch.set(paymentRef, {
    id: paymentId,
    paymentId,
    orderId: cleanOrderId,
    studentId,
    studentName,
    studentEmail,
    courseId: courseMeta.id || courseId,
    packageId: authPkg.id,
    amount: authoritativePrice.finalPrice,
    currency,
    status: 'captured',
    paymentStatus: 'captured',
    verified: true,
    method: 'Razorpay Online',
    source,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now
  }, { merge: true });

  // Save order record in /orders
  const orderRef = adminDb.collection('orders').doc(cleanOrderId);
  batch.set(orderRef, {
    id: cleanOrderId,
    orderId: cleanOrderId,
    paymentId,
    userId: studentId,
    studentId,
    customerEmail: studentEmail,
    customerName: studentName,
    courseId: courseMeta.id || courseId,
    packageId: authPkg.id,
    amount: authoritativePrice.finalPrice,
    currency,
    status: 'paid',
    enrollmentId: canonicalEnrollmentId,
    updatedAt: now,
    createdAt: now
  }, { merge: true });

  // Update user record in /users
  if (studentId && !studentId.startsWith('guest_')) {
    const userRef = adminDb.collection('users').doc(studentId);
    batch.set(userRef, {
      assignedTeacher: resolvedTeacherName,
      assignedTeacherId: resolvedTeacherId,
      activeEnrollmentId: canonicalEnrollmentId,
      isPurchaseEligible: false,
      demoStatus: 'converted',
      trialStatus: 'enrolled',
      subscriptionStatus: {
        accessGranted: true,
        status: 'active',
        packageId: authPkg.id,
        packageName: authPkg.name,
        packageDuration: `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`,
        totalSessions: totalClasses,
        remainingSessions: totalClasses,
        usedSessions: 0,
        purchaseDate: now,
        startDate: now,
        expiryDate: expiryDateIso,
        activeEnrollmentId: canonicalEnrollmentId
      },
      updatedAt: now
    }, { merge: true });
  }

  // 7. Generate Scheduled Class Records with Deterministic IDs
  // Formula: ${canonicalEnrollmentId}_cls_${i} ensures zero duplicate sessions across retries
  const classesPerWeek = Math.max(1, Math.round(authPkg.sessionsPerMonth / 4));
  const daysInterval = classesPerWeek === 1 ? 7 : Math.floor(7 / classesPerWeek);
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // First class scheduled 2 days ahead

  for (let i = 1; i <= totalClasses; i++) {
    const classDate = new Date(baseDate);
    classDate.setDate(baseDate.getDate() + (i - 1) * daysInterval);
    const dateStr = classDate.toISOString().split('T')[0];
    const timeStr = preferredTime || '18:00 IST';
    const scheduledAt = `${dateStr}T18:00:00`;
    const classDocId = `${canonicalEnrollmentId}_cls_${i}`;
    const channelName = `saremi_live_${cleanOrderId}_cls_${i}`;

    const sessionData = {
      id: classDocId,
      sessionId: classDocId,
      enrollmentId: canonicalEnrollmentId,
      sessionNumber: i,
      totalSessions: totalClasses,
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      teacherId: resolvedTeacherId,
      teacherName: resolvedTeacherName,
      courseId: courseMeta.id || courseId,
      courseTitle: courseMeta.title || courseMeta.name,
      discipline: (courseMeta as any).instrument || 'vocals',
      scheduledAt,
      date: dateStr,
      time: timeStr,
      durationMinutes: 45,
      duration: 45,
      status: 'scheduled',
      isTrial: false,
      roomId: channelName,
      meetingUrl: channelName,
      agoraChannelName: channelName,
      agoraAppId: process.env.AGORA_APP_ID || 'agora-saremi-prod',
      topic: `Class #${i}: ${courseMeta.title || courseMeta.name} (${authPkg.name})`,
      sessionType: 'regular_paid',
      createdAt: now,
      updatedAt: now
    };

    const classRef = adminDb.collection('classes').doc(classDocId);
    batch.set(classRef, sessionData, { merge: true });

    const liveClassRef = adminDb.collection('live_classes').doc(classDocId);
    batch.set(liveClassRef, sessionData, { merge: true });
  }

  // Commit all database mutations atomically
  await batch.commit();

  console.log(`[Server Enrollment Activated] Successfully activated ${canonicalEnrollmentId} for student ${studentId} (${studentName}).`);

  // 8. Multi-Channel Confirmation Notifications
  try {
    // Notify Student
    await dispatchNotificationService(adminDb, {
      userId: studentId,
      recipientRole: 'student',
      recipientName: studentName,
      recipientEmail: studentEmail,
      recipientPhone: studentPhone,
      type: 'course_enrollment_confirmation',
      title: '🎉 Welcome to Saremi Academy! Enrollment Confirmed',
      message: `Congratulations ${studentName}! Your enrollment in ${courseMeta.title || courseMeta.name} (${authPkg.name} - ${totalClasses} Live Classes) is confirmed with Guru ${resolvedTeacherName}. Your 1:1 Live Studio & practice credits are active!`,
      link: '/student/schedule',
      channels: ['in_app', 'email']
    });

    // Notify Teacher if assigned
    if (resolvedTeacherId && resolvedTeacherId !== 'unassigned_teacher') {
      await dispatchNotificationService(adminDb, {
        userId: resolvedTeacherId,
        recipientRole: 'teacher',
        recipientName: resolvedTeacherName,
        type: 'teacher_class_assigned',
        title: 'New Student Enrollment Assigned',
        message: `New student ${studentName} enrolled in ${courseMeta.title || courseMeta.name} (${authPkg.name} - ${totalClasses} sessions) has been assigned to your teaching roster.`,
        link: '/teacher/students',
        channels: ['in_app']
      });
    }

    // Notify Admin
    await dispatchNotificationService(adminDb, {
      userId: 'admin',
      recipientRole: 'admin',
      type: 'admin_new_enrollment',
      title: `💰 Payment & Enrollment: ₹${authoritativePrice.finalPrice.toLocaleString('en-IN')}`,
      message: `${studentName} successfully enrolled in ${courseMeta.title || courseMeta.name} (${authPkg.name}). Assigned Guru: ${resolvedTeacherName}.`,
      link: '/admin/enrollments',
      channels: ['in_app']
    });
  } catch (nErr) {
    console.warn('[Enrollment Notification Dispatch Notice]', nErr);
  }

  return {
    success: true,
    enrollmentId: canonicalEnrollmentId,
    alreadyActive: false,
    orderId: cleanOrderId,
    paymentId,
    courseId: courseMeta.id || courseId,
    packageId: authPkg.id,
    teacherId: resolvedTeacherId,
    teacherName: resolvedTeacherName,
    classesGenerated: totalClasses,
    message: 'Course enrollment successfully created and activated server-side.',
    status: 'active'
  };
}

/**
 * Server-Authoritative Payment Failure Handler
 */
export async function recordPaymentFailureServerSide(
  adminDb: any,
  payload: {
    orderId?: string;
    paymentId?: string;
    studentId?: string;
    courseId?: string;
    packageId?: string;
    errorCode?: string;
    errorDescription?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const paymentId = payload.paymentId || `pay_failed_${Date.now()}`;

  try {
    await adminDb.collection('payments').doc(paymentId).set({
      id: paymentId,
      paymentId,
      orderId: payload.orderId || '',
      studentId: payload.studentId || '',
      courseId: payload.courseId || '',
      packageId: payload.packageId || '',
      status: 'failed',
      paymentStatus: 'failed',
      errorCode: payload.errorCode || 'PAYMENT_FAILED',
      errorDescription: payload.errorDescription || 'Payment transaction failed or was cancelled.',
      failedAt: now,
      updatedAt: now
    }, { merge: true });

    console.log(`[Payment Failure Logged] Recorded failed payment ${paymentId} for order ${payload.orderId}.`);
  } catch (err) {
    console.error('[Payment Failure Logging Error]', err);
  }
}
