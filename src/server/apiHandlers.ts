import crypto from 'crypto';
import { getAuthoritativePackage, getAuthoritativePrice } from '../data/pricingData';
import {
  activatePaidEnrollmentServerSide,
  recordPaymentFailureServerSide,
  ServerEnrollmentResult
} from './enrollmentActivationService';

export interface CreateRazorpayOrderPayload {
  orderId?: string;
  amount?: number; // in primary currency unit (INR / USD)
  currency?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  courseId: string;
  packageId: string;
  studentId?: string;
  isRenewal?: boolean;
  learningMode?: string;
  preferredTeacherId?: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduleSummary?: string;
  notes?: Record<string, string>;
}

/**
 * Constant-time string comparison to defend against timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Creates a Razorpay Order via Razorpay REST API
 * Server-authoritatively derives the fee from the catalog. Client-provided amounts are never trusted.
 */
export async function handleCreateRazorpayOrder(payload: CreateRazorpayOrderPayload): Promise<{
  id?: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isSimulated: boolean;
  authoritativePrice: number;
}> {
  // 1. Validate Required Fields: courseId, packageId, and authenticated student identity
  const courseId = String(payload.courseId || payload.notes?.courseId || '').trim();
  const packageId = String(payload.packageId || payload.notes?.packageId || '').trim();
  const studentEmail = String(payload.customerEmail || payload.notes?.studentEmail || payload.notes?.customerEmail || '').trim().toLowerCase();
  const studentName = String(payload.customerName || payload.notes?.studentName || payload.notes?.customerName || '').trim();
  const studentId = String(payload.studentId || payload.notes?.studentId || '').trim();

  if (!courseId) {
    throw new Error('Course identifier (courseId) is required to create an order.');
  }

  if (!packageId) {
    throw new Error('Package identifier (packageId) is required to create an order.');
  }

  if (!studentEmail && !studentId) {
    throw new Error('Authenticated student identity (studentId or email) is required to create an order.');
  }

  // 2. Authoritative Server-Side Price Resolution
  // The catalog is the ONLY source of truth.
  const authPkg = getAuthoritativePackage(packageId);
  if (!authPkg) {
    throw new Error(`Invalid package: "${packageId}". Package was not found in the authoritative pricing catalog.`);
  }

  const sanitizedCurrency = (payload.currency || authPkg.currency || 'INR').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(sanitizedCurrency)) {
    throw new Error('Invalid currency format.');
  }

  const isRenewal = Boolean(payload.isRenewal || payload.notes?.isRenewal === 'true');
  const pricing = getAuthoritativePrice(packageId, {
    isRenewal,
    currency: sanitizedCurrency === 'USD' ? 'USD' : 'INR'
  });

  const authoritativeAmount = pricing.finalPrice;
  // Subunits for gateway: 100 paise per INR / 100 cents per USD
  const subunitAmount = Math.round(authoritativeAmount * 100);

  const rawOrderId = payload.orderId || (payload as any).receipt || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sanitizedOrderId = String(rawOrderId).trim();

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const trustedNotes: Record<string, string> = {
    orderId: sanitizedOrderId,
    courseId,
    packageId: authPkg.id,
    packageName: authPkg.name,
    studentId: studentId || '',
    studentEmail,
    studentName: studentName || 'Enrolled Student',
    studentPhone: String(payload.customerPhone || payload.notes?.studentPhone || payload.notes?.customerPhone || ''),
    authoritativeAmount: String(authoritativeAmount),
    currency: sanitizedCurrency,
    learningMode: String(payload.learningMode || payload.notes?.learningMode || '1:1 Live Online'),
    durationMonths: String(authPkg.durationMonths || 1),
    totalClasses: String(authPkg.totalClasses || authPkg.sessions || (authPkg.sessionsPerMonth * authPkg.durationMonths)),
    preferredTeacherId: String(payload.preferredTeacherId || payload.notes?.preferredTeacherId || ''),
    preferredDate: String(payload.preferredDate || payload.notes?.preferredDate || ''),
    preferredTime: String(payload.preferredTime || payload.notes?.preferredTime || ''),
    scheduleSummary: String(payload.scheduleSummary || payload.notes?.scheduleSummary || ''),
    platform: 'Saremi Academy',
    createdAt: new Date().toISOString()
  };

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Payment gateway is not properly configured on this server.');
    }

    const simulatedRzpOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: simulatedRzpOrderId,
      orderId: sanitizedOrderId,
      razorpayOrderId: simulatedRzpOrderId,
      amount: subunitAmount,
      currency: sanitizedCurrency,
      keyId: keyId || 'rzp_test_saremi_preview',
      isSimulated: true,
      authoritativePrice: authoritativeAmount
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: subunitAmount,
        currency: sanitizedCurrency,
        receipt: sanitizedOrderId,
        notes: trustedNotes
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay Order API Error:', response.status, errorText);
      throw new Error(`Razorpay API error (${response.status})`);
    }

    const data = await response.json();
    return {
      id: data.id,
      orderId: sanitizedOrderId,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      isSimulated: false,
      authoritativePrice: authoritativeAmount
    };
  } catch (error: any) {
    console.error('Failed to create Razorpay order with API:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    const simErrId = `order_sim_err_${Date.now()}`;
    return {
      id: simErrId,
      orderId: sanitizedOrderId,
      razorpayOrderId: simErrId,
      amount: subunitAmount,
      currency: sanitizedCurrency,
      keyId: keyId || 'rzp_test_saremi_preview',
      isSimulated: true,
      authoritativePrice: authoritativeAmount
    };
  }
}

/**
 * Verify Razorpay payment signature and issue verified receipt
 */
export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  orderId?: string;
  courseId?: string;
  packageId?: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  studentPhone?: string;
  amountPaid?: number;
  currency?: string;
  preferredTeacherId?: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduleSummary?: string;
  learningMode?: string;
}

export interface VerifiedPaymentResult {
  verified: boolean;
  message: string;
  signatureVerified: boolean;
  isSimulated?: boolean;
  alreadyVerified?: boolean;
  verifiedAt?: string;
  paymentId?: string;
  orderId?: string;
  enrollmentId?: string;
  enrollment?: ServerEnrollmentResult;
  serverVerificationToken?: string;
}

// Server-side Idempotency Ledgers
interface VerifiedPaymentEntry {
  paymentId: string;
  orderId: string;
  verifiedAt: string;
  isSimulated: boolean;
  signatureVerified: boolean;
  serverVerificationToken: string;
}

const verifiedPaymentsLedger = new Map<string, VerifiedPaymentEntry>();

/**
 * Verify Razorpay payment signature and server-authoritatively activate enrollment
 */
export async function handleVerifyRazorpayPayment(
  payload: VerifyPaymentPayload,
  adminDb?: any
): Promise<VerifiedPaymentResult> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  const now = new Date().toISOString();

  if (!payload.razorpayPaymentId || !payload.razorpayOrderId) {
    return {
      verified: false,
      signatureVerified: false,
      isSimulated: false,
      message: 'Missing required Razorpay payment or order identifiers'
    };
  }

  // 1. Authoritative Package & Price Verification
  // An HMAC signature alone is NOT sufficient. We must verify package and amount.
  const packageId = payload.packageId;
  if (packageId) {
    const authPkg = getAuthoritativePackage(packageId);
    if (!authPkg) {
      return {
        verified: false,
        signatureVerified: false,
        isSimulated: false,
        message: `Security Violation: Package "${packageId}" is not valid in authoritative catalog.`
      };
    }

    const authoritativePricing = getAuthoritativePrice(packageId, {
      currency: payload.currency === 'USD' ? 'USD' : 'INR'
    });

    if (payload.amountPaid && Math.abs(payload.amountPaid - authoritativePricing.finalPrice) > 5) {
      console.error(`[Security Alert] Paid amount mismatch. Expected: ₹${authoritativePricing.finalPrice}, Received: ₹${payload.amountPaid}`);
      if (isProd) {
        return {
          verified: false,
          signatureVerified: false,
          isSimulated: false,
          message: 'Security Violation: Payment amount does not equal authoritative package price.'
        };
      }
    }
  }

  const isSimulatedRequest =
    payload.razorpayOrderId.startsWith('order_sim_') ||
    payload.razorpayPaymentId.startsWith('pay_sim_') ||
    payload.razorpayPaymentId.startsWith('pay_demo_');

  // CRITICAL SECURITY ENFORCEMENT: Never permit simulated payment activations in production
  if (isProd) {
    if (isSimulatedRequest) {
      console.error(`[Security Alert] Attempted simulated payment in production for order ${payload.razorpayOrderId}`);
      return {
        verified: false,
        signatureVerified: false,
        isSimulated: false,
        message: 'Security Violation: Simulated payment tokens are strictly forbidden in production.'
      };
    }

    if (!keySecret) {
      console.error('[Configuration Error] RAZORPAY_KEY_SECRET is missing in production environment');
      return {
        verified: false,
        signatureVerified: false,
        isSimulated: false,
        message: 'Payment gateway configuration error on production server.'
      };
    }
  }

  // Check if already in ledger
  if (verifiedPaymentsLedger.has(payload.razorpayPaymentId)) {
    const existing = verifiedPaymentsLedger.get(payload.razorpayPaymentId)!;
    const cleanOrderId = (payload.orderId || payload.razorpayOrderId).replace(/^enr_/, '');
    const canonicalEnrollmentId = `enr_${cleanOrderId}`;

    return {
      verified: true,
      signatureVerified: existing.signatureVerified,
      isSimulated: existing.isSimulated,
      alreadyVerified: true,
      message: 'Payment was already verified by backend.',
      verifiedAt: existing.verifiedAt,
      paymentId: existing.paymentId,
      orderId: existing.orderId,
      enrollmentId: canonicalEnrollmentId,
      serverVerificationToken: existing.serverVerificationToken
    };
  }

  // Handle test / simulation mode ONLY when explicitly in non-production AND no real keySecret is configured
  if (!keySecret) {
    if (!isProd && isSimulatedRequest) {
      const serverVerificationToken = crypto
        .createHmac('sha256', 'saremi_sandbox_test_secret_dev')
        .update(`saremi_simulated:${payload.razorpayOrderId}:${payload.razorpayPaymentId}`)
        .digest('hex');

      const entry: VerifiedPaymentEntry = {
        paymentId: payload.razorpayPaymentId,
        orderId: payload.razorpayOrderId,
        verifiedAt: now,
        isSimulated: true,
        signatureVerified: true,
        serverVerificationToken
      };
      verifiedPaymentsLedger.set(payload.razorpayPaymentId, entry);

      let enrollmentResult: ServerEnrollmentResult | undefined;
      const effectivePackageId = payload.packageId || 'pkg-std-1-1-8s-3m';
      const effectiveCourseId = payload.courseId || 'course-vocals-01';

      if (adminDb) {
        try {
          const authPricing = getAuthoritativePrice(effectivePackageId);
          enrollmentResult = await activatePaidEnrollmentServerSide(adminDb, {
            orderId: payload.orderId || payload.razorpayOrderId,
            paymentId: payload.razorpayPaymentId,
            studentId: payload.studentId || `std_${Date.now()}`,
            studentEmail: payload.studentEmail,
            studentName: payload.studentName,
            studentPhone: payload.studentPhone,
            courseId: effectiveCourseId,
            packageId: effectivePackageId,
            amountPaid: authPricing.finalPrice,
            currency: payload.currency || 'INR',
            preferredTeacherId: payload.preferredTeacherId,
            preferredDate: payload.preferredDate,
            preferredTime: payload.preferredTime,
            scheduleSummary: payload.scheduleSummary,
            learningMode: payload.learningMode,
            source: 'verification_api'
          });
        } catch (e: any) {
          console.warn('[Simulated Enrollment Activation Notice]', e.message);
        }
      }

      return {
        verified: true,
        signatureVerified: true,
        isSimulated: true,
        message: 'Sandbox / Test payment simulation verified for development.',
        verifiedAt: now,
        paymentId: payload.razorpayPaymentId,
        orderId: payload.razorpayOrderId,
        enrollmentId: enrollmentResult?.enrollmentId || `enr_${(payload.orderId || payload.razorpayOrderId).replace(/^enr_/, '')}`,
        enrollment: enrollmentResult,
        serverVerificationToken
      };
    }

    return {
      verified: false,
      signatureVerified: false,
      isSimulated: false,
      message: 'Payment credentials missing and simulation not authorized.'
    };
  }

  if (isSimulatedRequest) {
    return {
      verified: false,
      signatureVerified: false,
      isSimulated: false,
      message: 'Simulated payment IDs cannot be verified against active Razorpay credentials.'
    };
  }

  if (!payload.razorpaySignature) {
    return {
      verified: false,
      signatureVerified: false,
      isSimulated: false,
      message: 'Missing Razorpay HMAC-SHA256 signature'
    };
  }

  // 2. Verify HMAC-SHA256 signature generated by Razorpay
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest('hex');

  const isValid = timingSafeCompare(generatedSignature, payload.razorpaySignature);

  if (!isValid) {
    console.error(`[Security Warning] Invalid Razorpay signature for order ${payload.razorpayOrderId}`);
    return {
      verified: false,
      signatureVerified: false,
      isSimulated: false,
      message: 'Invalid Razorpay payment signature. Payment cannot be verified.'
    };
  }

  // Issue tamper-proof server verification token
  const serverVerificationToken = crypto
    .createHmac('sha256', keySecret)
    .update(`saremi_verified:${payload.razorpayOrderId}:${payload.razorpayPaymentId}`)
    .digest('hex');

  const entry: VerifiedPaymentEntry = {
    paymentId: payload.razorpayPaymentId,
    orderId: payload.razorpayOrderId,
    verifiedAt: now,
    isSimulated: false,
    signatureVerified: true,
    serverVerificationToken
  };
  verifiedPaymentsLedger.set(payload.razorpayPaymentId, entry);

  // 3. Server-Authoritative Paid Enrollment Activation via Admin SDK
  let enrollmentResult: ServerEnrollmentResult | undefined;
  const effectivePackageId = payload.packageId || 'pkg-std-1-1-8s-3m';
  const effectiveCourseId = payload.courseId || 'course-vocals-01';

  if (adminDb) {
    try {
      const authPricing = getAuthoritativePrice(effectivePackageId);
      enrollmentResult = await activatePaidEnrollmentServerSide(adminDb, {
        orderId: payload.orderId || payload.razorpayOrderId,
        paymentId: payload.razorpayPaymentId,
        studentId: payload.studentId || `std_${Date.now()}`,
        studentEmail: payload.studentEmail,
        studentName: payload.studentName,
        studentPhone: payload.studentPhone,
        courseId: effectiveCourseId,
        packageId: effectivePackageId,
        amountPaid: payload.amountPaid || authPricing.finalPrice,
        currency: payload.currency || 'INR',
        preferredTeacherId: payload.preferredTeacherId,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        scheduleSummary: payload.scheduleSummary,
        learningMode: payload.learningMode,
        source: 'verification_api'
      });
    } catch (actErr: any) {
      console.error('[Server Enrollment Activation Error during verification]', actErr);
    }
  }

  const cleanOrderId = (payload.orderId || payload.razorpayOrderId).replace(/^enr_/, '');
  const canonicalEnrollmentId = enrollmentResult?.enrollmentId || `enr_${cleanOrderId}`;

  return {
    verified: true,
    signatureVerified: true,
    isSimulated: false,
    message: 'Razorpay HMAC-SHA256 signature verified and course enrollment activated on backend.',
    verifiedAt: now,
    paymentId: payload.razorpayPaymentId,
    orderId: payload.razorpayOrderId,
    enrollmentId: canonicalEnrollmentId,
    enrollment: enrollmentResult,
    serverVerificationToken
  };
}

/**
 * Handle Razorpay Webhooks with timing-safe signature validation, idempotency, and enrollment activation
 */
export async function handleRazorpayWebhook(
  rawBody: string | Buffer,
  signature: string,
  adminDb?: any
): Promise<{ 
  received: boolean; 
  eventType?: string; 
  orderId?: string; 
  paymentId?: string; 
  alreadyProcessed?: boolean;
  processed?: boolean;
  enrollmentId?: string;
  error?: string;
}> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (webhookSecret) {
    if (!signature) {
      throw new Error('Missing Razorpay webhook signature header');
    }

    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawString)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeCompare(expectedSignature, signature)) {
      throw new Error('Invalid Razorpay webhook signature');
    }
  }

  try {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const event = JSON.parse(rawString);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const paymentId = paymentEntity?.id;
    const orderId = paymentEntity?.order_id || paymentEntity?.notes?.orderId || orderEntity?.receipt || orderEntity?.id;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};

    console.log(`[Razorpay Webhook Received] Event: ${eventType}, PaymentId: ${paymentId}, OrderId: ${orderId}`);

    // Handle Payment Failure
    if (eventType === 'payment.failed') {
      if (adminDb) {
        await recordPaymentFailureServerSide(adminDb, {
          orderId,
          paymentId,
          studentId: notes.studentId,
          courseId: notes.courseId,
          packageId: notes.packageId,
          errorCode: paymentEntity?.error_code,
          errorDescription: paymentEntity?.error_description
        });
      }
      return {
        received: true,
        eventType,
        orderId,
        paymentId,
        processed: true
      };
    }

    // Handle Payment Captured or Order Paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const packageId = notes.packageId;
      const courseId = notes.courseId || 'course-vocals-01';
      const studentId = notes.studentId || paymentEntity?.email || 'std_guest';
      const studentEmail = notes.studentEmail || paymentEntity?.email;
      const studentName = notes.studentName || paymentEntity?.notes?.customerName || 'Enrolled Student';
      const studentPhone = notes.studentPhone || paymentEntity?.contact;
      const amountPaise = paymentEntity?.amount || 0;
      const amountInINR = amountPaise > 0 ? amountPaise / 100 : Number(notes.authoritativeAmount || 0);

      let canonicalEnrollmentId = `enr_${String(orderId).replace(/^enr_/, '')}`;

      if (adminDb && packageId) {
        try {
          const enrollmentResult = await activatePaidEnrollmentServerSide(adminDb, {
            orderId,
            paymentId,
            studentId,
            studentEmail,
            studentName,
            studentPhone,
            courseId,
            packageId,
            amountPaid: amountInINR,
            currency: paymentEntity?.currency || 'INR',
            preferredTeacherId: notes.preferredTeacherId,
            preferredDate: notes.preferredDate,
            preferredTime: notes.preferredTime,
            scheduleSummary: notes.scheduleSummary,
            learningMode: notes.learningMode,
            source: 'webhook'
          });
          canonicalEnrollmentId = enrollmentResult.enrollmentId;
        } catch (actErr: any) {
          console.error('[Razorpay Webhook Enrollment Activation Error]', actErr);
        }
      }

      if (paymentId && orderId) {
        const now = new Date().toISOString();
        const serverVerificationToken = crypto
          .createHmac('sha256', webhookSecret || 'saremi_webhook_secret')
          .update(`saremi_webhook:${orderId}:${paymentId}`)
          .digest('hex');

        verifiedPaymentsLedger.set(paymentId, {
          paymentId,
          orderId,
          verifiedAt: now,
          isSimulated: false,
          signatureVerified: true,
          serverVerificationToken
        });
      }

      return {
        received: true,
        eventType,
        orderId,
        paymentId,
        enrollmentId: canonicalEnrollmentId,
        processed: true
      };
    }

    return {
      received: true,
      eventType,
      orderId,
      paymentId,
      processed: true
    };
  } catch (err: any) {
    console.error('[Razorpay Webhook Processing Error]', err.message);
    throw err;
  }
}


/**
 * Check and validate student package status on the backend
 */
export interface PackageAccessCheckPayload {
  studentId?: string;
  studentEmail?: string;
  courseId?: string;
  packageData?: {
    purchaseDate?: string;
    startDate?: string;
    expiryDate?: string;
    packageDuration?: string;
    totalSessions?: number;
    usedSessions?: number;
    remainingSessions?: number;
    status?: string;
  };
}

export function handleCheckPackageAccess(payload: PackageAccessCheckPayload): {
  accessGranted: boolean;
  status: 'active' | 'expired' | 'exhausted' | 'pending';
  isExpired: boolean;
  isExhausted: boolean;
  message: string;
  lockReason: 'package_expired' | 'sessions_exhausted' | 'inactive_subscription' | null;
  packageDetails: {
    purchaseDate: string;
    startDate: string;
    expiryDate: string;
    packageDuration: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    status: 'active' | 'expired' | 'exhausted' | 'pending';
    daysRemaining: number;
  };
} {
  const now = new Date();
  const pkg = payload.packageData;

  // Security: Fail closed if packageData is not supplied or contains no session allocation
  if (
    !pkg ||
    (typeof pkg.totalSessions !== 'number' && typeof pkg.remainingSessions !== 'number' && !pkg.expiryDate)
  ) {
    return {
      accessGranted: false,
      status: 'pending',
      isExpired: false,
      isExhausted: false,
      lockReason: 'inactive_subscription',
      message: 'You do not have an active package. Please enroll in a course.',
      packageDetails: {
        purchaseDate: now.toISOString(),
        startDate: now.toISOString(),
        expiryDate: now.toISOString(),
        packageDuration: 'No Active Package',
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
        status: 'pending',
        daysRemaining: 0
      }
    };
  }

  const purchaseDate = pkg.purchaseDate || now.toISOString();
  const startDate = pkg.startDate || purchaseDate;
  
  // Expiry date verification
  let expiryDate = pkg.expiryDate;
  if (!expiryDate) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    expiryDate = d.toISOString();
  }

  const packageDuration = pkg.packageDuration || 'Standard Package';
  const totalSessions = typeof pkg.totalSessions === 'number' ? Math.max(0, pkg.totalSessions) : 0;
  const usedSessions = typeof pkg.usedSessions === 'number' ? Math.max(0, pkg.usedSessions) : 0;
  const remainingSessions = typeof pkg.remainingSessions === 'number' 
    ? Math.max(0, pkg.remainingSessions) 
    : Math.max(0, totalSessions - usedSessions);

  const expDateObj = new Date(expiryDate);
  const diffTime = expDateObj.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpiredByDate = daysRemaining <= 0 || expDateObj < now;
  const isExhaustedBySessions = remainingSessions <= 0 || usedSessions >= totalSessions;
  const isExplicitlyExpired = pkg.status === 'expired';
  const isExplicitlyExhausted = pkg.status === 'exhausted';

  if (isExpiredByDate || isExplicitlyExpired) {
    return {
      accessGranted: false,
      status: 'expired',
      isExpired: true,
      isExhausted: isExhaustedBySessions,
      lockReason: 'package_expired',
      message: 'Your package has expired. Renew your plan to continue learning.',
      packageDetails: {
        purchaseDate,
        startDate,
        expiryDate,
        packageDuration,
        totalSessions,
        usedSessions,
        remainingSessions,
        status: 'expired',
        daysRemaining: Math.max(0, daysRemaining)
      }
    };
  }

  if (isExhaustedBySessions || isExplicitlyExhausted) {
    return {
      accessGranted: false,
      status: 'exhausted',
      isExpired: true,
      isExhausted: true,
      lockReason: 'sessions_exhausted',
      message: 'Your package has expired. Renew your plan to continue learning.',
      packageDetails: {
        purchaseDate,
        startDate,
        expiryDate,
        packageDuration,
        totalSessions,
        usedSessions,
        remainingSessions: 0,
        status: 'exhausted',
        daysRemaining: Math.max(0, daysRemaining)
      }
    };
  }

  return {
    accessGranted: true,
    status: 'active',
    isExpired: false,
    isExhausted: false,
    lockReason: null,
    message: 'Active package subscription verified',
    packageDetails: {
      purchaseDate,
      startDate,
      expiryDate,
      packageDuration,
      totalSessions,
      usedSessions,
      remainingSessions,
      status: 'active',
      daysRemaining: Math.max(0, daysRemaining)
    }
  };
}

/**
 * Handle resource permission checks for live class, course content, paid resources, and practice materials
 */
export function handleValidateResourceAccess(payload: {
  studentId?: string;
  resourceType: 'live_class' | 'course_content' | 'paid_resource' | 'practice_material';
  resourceId?: string;
  packageData?: any;
}): {
  allowed: boolean;
  resourceType: string;
  message: string;
  lockReason: 'package_expired' | 'sessions_exhausted' | 'inactive_subscription' | null;
} {
  const access = handleCheckPackageAccess({
    studentId: payload.studentId,
    packageData: payload.packageData
  });

  if (!access.accessGranted) {
    return {
      allowed: false,
      resourceType: payload.resourceType,
      lockReason: access.lockReason,
      message: 'Your package has expired. Renew your plan to continue learning.'
    };
  }

  return {
    allowed: true,
    resourceType: payload.resourceType,
    lockReason: null,
    message: 'Access granted'
  };
}
