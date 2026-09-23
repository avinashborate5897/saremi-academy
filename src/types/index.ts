export type Role =
  | 'visitor'
  | 'student'
  | 'parent'
  | 'teacher'
  | 'academic_coordinator'
  | 'sales'
  | 'finance'
  | 'admin'
  | 'super_admin';

export type Permission =
  | 'view_public'
  | 'access_student_portal'
  | 'access_teacher_portal'
  | 'access_admin_panel'
  | 'manage_students'
  | 'manage_teachers'
  | 'manage_curriculum'
  | 'manage_classes'
  | 'manage_payments'
  | 'manage_leads'
  | 'manage_events'
  | 'manage_reports'
  | 'manage_system_settings';

export type SessionStatus = 'scheduled' | 'started' | 'live' | 'completed' | 'cancelled' | 'rescheduled';
export type SessionType = '1:1' | 'trial' | 'group';

export interface ClassSession {
  id: string;
  sessionId?: string; // Standard alias for id
  studentId: string;
  studentName: string;
  studentEmail?: string;
  teacherId: string;
  teacherName: string;
  enrollmentId?: string;
  courseId: string;
  courseTitle: string;
  program?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  scheduledAt: string; // ISO timestamp
  durationMinutes: number;
  duration?: number; // Alias for durationMinutes
  status: SessionStatus;
  sessionType?: SessionType;
  timezone?: string; // e.g. 'Asia/Kolkata'
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  rescheduledFrom?: {
    scheduledAt: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
  };
  rescheduleReason?: string;
  cancellationReason?: string;
  meetingUrl?: string; // Legacy
  roomId?: string; // Secure meeting/session identifier for video integration
  lessonNotes?: string;
  teacherNotes?: string;
  homeworkAssigned?: string;
  recordingUrl?: string;
  // Live Room & Agora Architectural Hook
  agoraChannelName?: string;
  agoraToken?: string;
  agoraAppId?: string;
  topic?: string;
  time?: string;
  link?: string;
  attendanceRecorded?: boolean;
  attendanceMarked?: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  studentAttendanceDurationMinutes?: number;
  attendanceStatus?: 'Present' | 'Absent' | 'Late' | 'Excused';
  teacherFeedback?: string;
  sessionNumber?: number;
  totalSessions?: number;
  isTrial?: boolean;
  trialId?: string;
  discipline?: string;
  // Post-Class Academic Workflow Fields
  whatWasTaught?: string;
  topicsCovered?: string[];
  syllabusTopics?: Array<{
    topic: string;
    status: 'completed' | 'in_progress' | 'revision' | 'practice_required';
    notes?: string;
  }>;
  techniquesTaught?: string;
  mistakesNoticed?: string;
  nextLessonFocus?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  // Session Series & Recurring Schedule Fields
  seriesId?: string;
  seriesIndex?: number;
  totalSeriesSessions?: number;
  isRecurring?: boolean;
  recurringRule?: 'weekly' | 'biweekly' | 'custom';
  flaggedNotice?: string;
  autoAssigned?: boolean;
  autoAssignmentReason?: string;
}

export interface Assignment {
  id: string;
  sessionId?: string;
  enrollmentId?: string;
  courseId?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  assignedDate?: string;
  status: 'assigned' | 'viewed' | 'in_progress' | 'submitted' | 'reviewed' | 'pending';
  studentAudioUrl?: string;
  studentNotes?: string;
  teacherFeedbackNotes?: string;
  teacherAudioFeedbackUrl?: string;
  grade?: 'A+' | 'A' | 'B+' | 'B' | 'Needs Practice';
  createdAt: string;
  updatedAt?: string;
}

export interface SyllabusProgressRecord {
  id: string;
  studentId: string;
  studentName?: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  sessionId: string;
  teacherId: string;
  teacherName?: string;
  topic: string;
  pillarTitle?: string;
  moduleTitle?: string;
  status: 'completed' | 'in_progress' | 'revision' | 'practice_required';
  notes?: string;
  sessionDate: string;
  recordedAt: string;
  updatedAt?: string;
}

export interface LessonNoteRecord {
  id: string;
  sessionId: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  courseId: string;
  courseTitle?: string;
  whatWasTaught: string;
  notes: string;
  techniquesTaught?: string;
  mistakesNoticed?: string;
  nextLessonFocus?: string;
  teacherFeedback?: string;
  homeworkSummary?: string;
  sessionDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PracticeSession {
  id: string;
  studentId: string;
  instrument: Instrument;
  durationMinutes: number;
  exercisesPracticed: string[];
  swaraAccuracyScore?: number;
  bpm?: number;
  notes?: string;
  date: string;
}

export interface Masterclass {
  id: string;
  title: string;
  maestroName: string;
  maestroTitle: string;
  maestroAvatar: string;
  instrument: Instrument | 'all';
  date: string;
  time: string;
  durationMinutes: number;
  fee: number;
  currency: string;
  coverImage: string;
  description: string;
  topics: string[];
  enrolledUserIds: string[];
  streamUrl?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  instrument?: Instrument;
  gradeLevel?: CourseLevel;
  level?: CourseLevel | string;
  issuedDate?: string;
  issueDate?: string;
  mentorName?: string;
  issuedBy?: string;
  grade?: string;
  verificationCode: string;
  pdfUrl?: string;
  certificateUrl?: string;
}

export type Instrument = 'vocals' | 'piano' | 'guitar' | 'tabla' | 'sitar' | 'flute' | 'harmonium' | 'violin';

export type CourseLevel = 'All Levels' | 'Foundation' | 'Developing' | 'Proficient' | 'Advanced';

export interface EnrolledCourse {
  courseId: string;
  courseTitle: string;
  instrument: Instrument;
  enrolledAt: string;
  purchaseDate?: string;
  startDate?: string;
  expiryDate?: string;
  packageDuration?: string;
  durationMonths?: number;
  level: CourseLevel;
  sessionsCompleted: number;
  totalSessions: number;
  sessionsRemaining?: number;
  usedSessions?: number;
  remainingSessions?: number;
  packageId?: string;
  packageName?: string;
  status?: 'active' | 'expiring_soon' | 'expired' | 'exhausted' | 'paused' | 'completed' | 'graduated';
  teacherId?: string;
  teacherName: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
  nextSessionId?: string;
  meetingUrl?: string; // Legacy
  roomId?: string; // Secure video session room ID
  isRenewalEligible?: boolean;
}

export interface StudentSubscriptionStatus {
  hasActiveSubscription: boolean;
  accessGranted: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isExhausted: boolean;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  packageDuration: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  status: 'active' | 'expired' | 'exhausted' | 'pending';
  classesRemaining: number;
  classesTotal: number;
  completionPercentage: number;
  daysUntilExpiry: number;
  renewalDiscountPercent?: number;
  lockReason?: 'package_expired' | 'sessions_exhausted' | 'inactive_subscription' | null;
  message?: string;
  activeCourse?: EnrolledCourse;
  packageDetails?: {
    packageId?: string;
    packageName: string;
    courseTitle: string;
    teacherName: string;
    format: string;
  };
}

export interface CoursePackage {
  id: string;
  name: string;
  durationMonths: number;
  totalClasses: number;
  classesPerWeek: number;
  classDurationMins: number;
  priceINR: number;
  priceUSD: number;
  originalPriceINR?: number;
  originalPriceUSD?: number;
  discountPercentage?: number;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  certificateIncluded: boolean;
  masterclassAccess: boolean;
  practiceStudioUnlimited: boolean;
}

export interface TrialAssessment {
  id: string;
  trialId: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName: string;
  courseName: string;
  conductedAt: string;
  // Pedagogical Diagnostic Scores (0-10)
  pitchAccuracy: number;
  rhythmSense: number;
  earGrasping: number;
  vocalFlexibility: number;
  overallScore: number;
  // Assessment Notes
  strengths: string[];
  areasOfGrowth: string[];
  teacherFeedback: string;
  recommendedLevel: CourseLevel;
  recommendedPackageId: string;
  recommendedPackageName: string;
  createdAt: string;
}


export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface NotificationPreferences {
  marketingEmails: boolean;
  transactionalEmails: boolean; // Must remain true
  smsAlerts: boolean;
  whatsappAlerts?: boolean;
}

export type NotificationType =
  // Student Notifications
  | 'demo_booking_confirmation'
  | 'course_enrollment_confirmation'
  | 'class_booking'
  | 'upcoming_class_reminder'
  | 'class_meeting_link'
  | 'class_rescheduled'
  | 'class_cancelled'
  | 'admin_announcement'
  // Teacher Notifications
  | 'teacher_student_assigned'
  | 'teacher_class_assigned'
  | 'teacher_schedule_changed'
  | 'teacher_class_cancelled'
  | 'teacher_class_rescheduled'
  | 'teacher_student_booking_created'
  // Admin Notifications
  | 'admin_new_demo_booking'
  | 'admin_new_enrollment'
  | 'admin_new_student'
  | 'admin_teacher_assigned'
  | 'admin_booking_changed'
  | 'admin_notification_failure'
  | 'admin_system_event'
  // General & Legacy
  | 'class_reminder'
  | 'assignment'
  | 'payment'
  | 'feedback'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string; // Target User UID, or 'admin', or 'all'
  recipientRole?: 'student' | 'teacher' | 'admin' | 'all';
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string; // WhatsApp mobile number
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: any;
  channels?: ('in_app' | 'email' | 'whatsapp')[];
  deliveryStatus?: {
    email?: 'sent' | 'failed' | 'not_configured' | 'pending' | 'skipped';
    whatsapp?: 'sent' | 'failed' | 'ready' | 'pending' | 'skipped';
  };
  metadata?: Record<string, any>;
}

export interface Achievement {
  id: string;
  studentId: string;
  badgeId: string;
  title: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export interface UserAttendanceRecord {
  classId: string;
  sessionNumber?: number;
  date: string;
  time?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  topic?: string;
  teacherName?: string;
  teacherFeedback?: string;
}

export interface UserProgressRecord {
  courseId: string;
  courseTitle: string;
  level: string;
  completedModules: number;
  totalModules: number;
  percentage: number;
  streakDays: number;
  lastPracticedDate?: string;
  skills?: {
    pitch: number;
    rhythm: number;
    technique: number;
    theory: number;
    repertoire: number;
  };
}

export interface UserSubscriptionInfo {
  active: boolean;
  packageId?: string;
  packageName?: string;
  classesRemaining: number;
  totalClasses: number;
  enrolledDate?: string;
  expiresAt?: string;
  autoRenew?: boolean;
  status?: string;
  totalSessions?: number;
  remainingSessions?: number;
  usedSessions?: number;
  startDate?: string;
  expiryDate?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string; // Unique student user ID
  studentId?: string; // Conservatory Student ID (e.g. SM-STU-1082)
  email: string;
  name: string;
  role: Role;
  phone?: string; // Phone / WhatsApp Mobile Number
  whatsapp?: string; // WhatsApp Mobile Number
  photoURL?: string;
  bio?: string;
  teacherId?: string; // Conservatory Teacher ID (e.g. SM-TEA-1024)
  specialization?: string; // Music faculty specialization
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  requiresPasswordChange?: boolean; // Force change temporary password on first login
  status?: 'active' | 'inactive' | 'suspended';
  preferredInstrument?: string;
  preferredDays?: string[];
  preferredTimeSlot?: string;
  preferredTimeWindow?: {
    start: string; // HH:mm 24h
    end: string;   // HH:mm 24h
  };
  skillLevel?: string;
  timeZone?: string;
  notes?: string; // Staff/pedagogical notes
  tags?: string[]; // Custom tags
  purchasedCourses?: string[]; // Array of course IDs / titles
  subscriptionStatus?: UserSubscriptionInfo;
  classes?: ClassSession[];
  attendance?: UserAttendanceRecord[];
  progress?: UserProgressRecord[];
  enrolledCourses?: EnrolledCourse[];
  savedAddresses?: ShippingAddress[];
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  instrument: string;
  displayOrder: number;
}

export interface CourseLevelItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  prerequisites?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  learningObjectives: string[];
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  summary: string;
  order: number;
  durationMinutes: number;
  practiceFocus: string;
  ragasOrPieces?: string[];
}

export interface Course {
  id: string;
  name?: string;
  slug: string;
  title?: string;
  description: string;
  short_description?: string;
  tagline?: string;
  image?: string;
  imageUrl?: string;
  category: string;
  instrument?: Instrument;
  level: CourseLevel | string;
  age_group?: string;
  ageGroup?: string;
  teacher?:
    | string
    | {
        name: string;
        title?: string;
        avatar?: string;
        bio?: string;
      };
  teacher_id?: string;
  duration?: string;
  class_duration?: number;
  sessionLengthMinutes?: number;
  number_of_classes?: number;
  sessionsCount?: number;
  sessionsPerWeek?: number;
  priceMonthly?: number;
  currency?: string;
  curriculum:
    | Array<{
        pillar?: string;
        title?: string;
        topics: string[];
      }>
    | string[];
  modules?: CourseModule[];
  lessons?: CourseLesson[];
  assignments?: string[];
  assessment?: string;
  certificate?: string;
  active_status?: boolean;
  package_id?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherReview {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  photo: string;
  bio: string;
  specialization: string;
  experience: number;
  experienceYears?: number; // alias
  languages: string[];
  qualifications: string[];
  courses: string[];
  availability: string[];
  intro_video?: string;
  reviews?: TeacherReview[];
  rating: number;
  reviewCount?: number;
  title?: string;
  tradition?: string;
  email?: string;
  phone?: string; // WhatsApp Mobile Number
  whatsapp?: string; // WhatsApp Mobile Number
  teacherId?: string; // Conservatory Teacher ID code (e.g. SM-TEA-1082)
  active?: boolean;
  maxActiveStudents?: number; // Capacity limit, defaults to 20
  currentAssignedCount?: number;
  suitableLevels?: (CourseLevel | string)[];
  isEligibleForAutoAssign?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isBooked: boolean;
}

export interface WeeklyAvailabilitySlot {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string; // 'Monday', 'Tuesday', ...
  startTime: string; // 'HH:mm' 24h
  endTime: string; // 'HH:mm' 24h
  isActive: boolean;
  effectiveStartDate?: string; // YYYY-MM-DD
  effectiveEndDate?: string; // YYYY-MM-DD
  updatedAt?: string;
  updatedBy?: string;
}

export interface TeacherBlockedTime {
  id: string;
  teacherId: string;
  teacherName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface AcademyBlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
  isFullDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface AvailableTimeSlot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  displayTime: string; // e.g. "10:00 AM – 10:45 AM"
  isAvailable: boolean;
  conflictReason?: string;
  isStudentPreferred?: boolean;
}

export interface SessionSeriesRecord {
  id: string;
  seriesId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseTitle: string;
  totalSessions: number;
  frequency: 'weekly' | 'biweekly';
  startDate: string;
  startTime: string;
  durationMinutes: number;
  status: 'active' | 'completed' | 'cancelled';
  sessionIds: string[];
  createdAt: string;
  createdBy: string;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Trial Scheduled'
  | 'Trial Completed'
  | 'Interested'
  | 'Enrolled'
  | 'Follow-up'
  | 'Lost';

export interface Lead {
  id: string;
  student_name: string;
  parent_name?: string;
  phone: string;
  email: string;
  age: string;
  course: string;
  course_id?: string;
  level: string;
  teacher?: string;
  teacher_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  timezone?: string;
  learning_goal?: string;
  status: LeadStatus;
  notes?: string;
  assigned_to?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorName: string;
  authorId?: string;
  content: string;
  createdAt: string;
}

export interface TrialBookingRecord {
  id: string;
  leadId?: string;
  userId?: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  parentName?: string;
  email: string;
  phone: string;
  age: string;
  discipline?: string;
  courseId: string;
  courseName: string;
  level: string;
  preferredDate?: string;
  preferredTime?: string;
  proposedDate?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  teacherId?: string;
  teacherName?: string;
  date: string;
  time: string;
  timezone: string;
  learningGoal?: string;
  classId?: string;
  assignmentStatus?: 'unassigned' | 'slot_proposed' | 'assigned' | 'confirmed' | 'rescheduled';
  status: 'pending' | 'unassigned' | 'slot_proposed' | 'confirmed' | 'scheduled' | 'reschedule_requested' | 'live' | 'completed' | 'no_show' | 'rescheduled' | 'cancelled';
  rescheduleRequested?: boolean;
  rescheduleReason?: string;
  needsAdminAttention?: boolean;
  attentionReason?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  trialOutcome?: 'interested' | 'follow_up_required' | 'enrolled' | 'not_interested' | 'reschedule_required';
  bookingCreatedAt?: string;
  meetingUrl?: string; // Legacy
  roomId?: string; // Secure video room ID
  feedback?: string;
  recommendation?: string;
  assessmentId?: string;
  assessment?: TrialAssessment;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherAssignmentHistoryItem {
  teacherId: string;
  teacherIdentifier?: string;
  teacherName: string;
  assignedAt: string;
  unassignedAt?: string;
  assignedBy?: string;
  reason?: string;
}

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentIdentifier?: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: string;
  courseName: string;
  instrument?: string;
  level: string;
  packageId: string;
  packageName: string;
  learningMode?: string;
  sessionsPerMonth?: number;
  durationMonths?: number;
  teacherId?: string;
  teacherIdentifier?: string;
  teacherName?: string;
  teacherEmail?: string;
  teacherSpecialization?: string;
  teacherHistory?: TeacherAssignmentHistoryItem[];
  assignmentHistory?: TeacherAssignmentHistoryItem[];
  notes?: string;
  scheduleSummary?: string;
  roomId?: string;
  meetingUrl?: string;
  purchaseDate?: string;
  startDate: string;
  endDate?: string;
  expiryDate?: string;
  packageDuration?: string;
  totalSessions?: number;
  sessionsCompleted?: number;
  usedSessions?: number;
  remainingSessions?: number;
  classesTotal: number;
  classesCompleted: number;
  classesRemaining?: number;
  orderId?: string;
  status: 'active' | 'expired' | 'exhausted' | 'paused' | 'graduated' | 'cancelled';
  assignmentStatus?: 'UNASSIGNED' | 'AUTO_ASSIGNED' | 'ADMIN_ASSIGNED' | 'ACTIVE' | 'PAUSED' | 'REASSIGNMENT_REQUIRED' | 'COMPLETED';
  assignmentReason?: string;
  assignmentScore?: number;
  autoAssigned?: boolean;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: string;
  paymentMethod?: string;
  amountPaid?: number;
}

export type ProductType = 'digital' | 'affiliate' | 'DIGITAL_PRODUCT' | 'AFFILIATE_PRODUCT' | 'physical';
export type ProductCategory = 
  | 'ebooks'
  | 'practice_tracks'
  | 'music_resources'
  | 'practice_tools'
  | 'bundles'
  | 'challenges'
  | 'guitars'
  | 'keyboards'
  | 'microphones'
  | 'headphones'
  | 'audio_interfaces'
  | 'ukuleles'
  | 'tabla'
  | 'violin'
  | 'flute'
  | 'recording'
  | 'accessories'
  | 'practice_packs'
  | 'course_bundles'
  | 'gift_cards'
  | string;

export interface Product {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  type: ProductType;
  productType?: 'DIGITAL_PRODUCT' | 'AFFILIATE_PRODUCT';
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  displayPrice?: number;
  discountInfo?: string;
  currency: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  features?: string[];
  keyFeatures?: string[];
  whatYoullLearn?: string[];
  whoItsFor?: string[];
  suitableFor?: string[];
  whyWeRecommendIt?: string;
  fileFormat?: string;
  digitalDownloadUrl?: string;
  digitalFileUrl?: string;
  previewUrl?: string;
  brand?: string;
  retailer?: 'Amazon' | 'Flipkart' | string;
  affiliateUrl?: string;
  stock?: number;
  inStock?: boolean;
  imageUrl: string;
  coverImage?: string;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  isSaremiPick?: boolean;
  createdAt?: string;
}

export interface PurchasedProduct {
  id: string;
  productId: string;
  userId?: string;
  userEmail: string;
  customerName: string;
  productTitle: string;
  coverImage: string;
  fileFormat: string;
  downloadUrl: string;
  purchaseDate: string;
  orderId: string;
  paymentId: string;
  amountPaid: number;
  currency: string;
}

export interface CartItem {
  id: string; // product ID or course ID
  type: ProductType | 'course_enrollment';
  title: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl: string;
  category?: string;
  instrument?: Instrument;
  level?: CourseLevel;
}

export type OrderStatus =
  | 'order_placed'
  | 'payment_confirmed'
  | 'preparing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'enrolled'
  | 'cancelled';

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  items: CartItem[];
  orderType: 'physical' | 'digital' | 'mixed';
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  shippingAddress?: ShippingAddress | null;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  stripeSessionId?: string | null;
  estimatedDelivery?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  courseId?: string;
  courseTitle: string;
  instrument: string;
  ageGroup: string;
  preferredSlot?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  scheduledTime?: string;
  meetingLink?: string;
  meetingUrl?: string; // Legacy
  roomId?: string; // Secure video session room ID
  createdAt: string;
}

export interface TransactionalEmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'order_confirmation' | 'status_update' | 'trial_booking_confirmation' | 'class_reminder';
  sentAt?: string;
  timestamp?: string;
  status?: string;
  content?: string;
  orderId?: string;
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: string;
  validFrom?: string;
  validUntil?: string;
  usageLimit: number;
  usageCount?: number;
  usedCount?: number;
  minOrderValue: number;
  applicableCourses?: string[];
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  sessionId?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  courseId?: string;
  enrollmentId?: string;
  program?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
  lessonNotes?: string;
  whatWasTaught?: string;
  topicsCovered?: string[];
  homeworkAssigned?: string;
  recordedAt?: string;
  recordedBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  entityType: 'student' | 'teacher' | 'course' | 'package' | 'price' | 'pricing' | 'payment' | 'class' | 'certificate' | 'coupon' | 'lead' | 'cms' | 'admin' | 'settings' | 'attendance' | 'assignment' | 'syllabus' | 'academic';
  entityId?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  active: boolean;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CMSContent {
  id: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBadge: string;
  announcementBanner?: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
  };
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
  }>;
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    text: string;
    rating: number;
    avatarUrl?: string;
  }>;
  footerNotice: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SupportTicket {
  id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedAdmin?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShowcaseEvent {
  id: string;
  title: string;
  description: string;
  instrument: string;
  eventDate: string;
  status: 'upcoming' | 'live' | 'completed' | 'archived';
  coverImage?: string;
  submissions: Array<{
    id: string;
    studentName: string;
    studentId?: string;
    title: string;
    videoUrl: string;
    approved: boolean;
    published: boolean;
    submittedAt: string;
  }>;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  paymentReference: string;
  studentName: string;
  studentEmail: string;
  refundAmount: number;
  reason: string;
  adminName: string;
  adminId: string;
  status: 'processed' | 'requested' | 'failed';
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseName: string;
  packageName: string;
  amount: number;
  tax: number;
  totalAmount: number;
  paymentProvider: string;
  paymentReference: string;
  issuedDate: string;
  pdfUrl?: string;
  status: 'Paid' | 'Pending' | 'Refunded';
}

export interface AcademySettings {
  academyName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  gstNumber?: string;
  address: string;
  razorpayActive: boolean;
  trialAutoConfirmation: boolean;
  smsNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Automated & Controlled Teacher Assignment System
// ---------------------------------------------------------------------------

export type AssignmentEngineStatus =
  | 'UNASSIGNED'
  | 'AUTO_ASSIGNED'
  | 'ADMIN_ASSIGNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REASSIGNMENT_REQUIRED'
  | 'COMPLETED';

export interface TeacherAssignmentSettings {
  autoAssignmentEnabled: boolean;
  defaultMaxStudentsPerTeacher: number;
  prioritizeContinuity: boolean;
  fixedAssignmentOverridesAuto: boolean;
  excludeUnavailableTeachers: boolean;
  requireAdminApprovalForReassignment: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface TeacherWorkloadStats {
  teacherId: string;
  teacherName: string;
  teacherIdentifier?: string;
  specialization: string;
  activeEnrollmentCount: number;
  maxCapacity: number;
  availableCapacity: number;
  capacityPercentage: number;
  isAtCapacity: boolean;
  weeklyClassesScheduled: number;
  activeStatus: boolean;
  isEligibleForAutoAssign: boolean;
}

export interface TeacherMatchScoreBreakdown {
  disciplineMatch: number;      // 0-40 pts
  levelMatch: number;           // 0-15 pts
  availabilityMatch: number;    // 0-15 pts
  capacityScore: number;        // 0-15 pts
  continuityBonus: number;      // 0-15 pts
  workloadBalanceBonus: number; // 0-10 pts
}

export interface TeacherMatchResult {
  teacher: TeacherProfile;
  totalScore: number;
  breakdown: TeacherMatchScoreBreakdown;
  isEligible: boolean;
  recommendedStatus: AssignmentEngineStatus;
  primaryReason: string;
  explanationNotes: string[];
}

// ---------------------------------------------------------------------------
// Post-Class Academic Workspace Entities
// ---------------------------------------------------------------------------

export interface AcademicResourceItem {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'audio' | 'image' | 'sheet' | 'link';
  sizeBytes?: number;
}

export interface AcademicHomework {
  id: string;
  sessionId: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  instructions: string;
  dueDate: string;
  // Teacher Audio Demonstration / Guided Exercise
  audioUrl?: string;
  audioTitle?: string;
  audioDurationSeconds?: number;
  resources?: AcademicResourceItem[];
  status: 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'redo_requested';
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSubmission {
  id: string;
  homeworkId: string;
  sessionId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  audioUrl?: string;
  videoUrl?: string;
  notes?: string;
  durationSeconds?: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'REVIEWED' | 'REDO_REQUESTED';
  submittedAt: string;
  reviewedAt?: string;
  teacherFeedbackText?: string;
  teacherFeedbackAudioUrl?: string;
  teacherGrade?: 'A+' | 'A' | 'B+' | 'B' | 'Needs Practice';
  updatedAt: string;
}

export interface ClassMessage {
  id: string;
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
  timestamp: string;
  read: boolean;
}

export interface TeacherPrivateNote {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}
