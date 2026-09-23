export type PortalType = 'public' | 'student' | 'teacher' | 'admin';

export interface RouteConfig {
  path: string;
  title: string;
  portal: PortalType;
  requiresAuth?: boolean;
  requiredRole?: string[];
  iconName?: string;
  description?: string;
}

export const APP_ROUTES: RouteConfig[] = [
  // Public Routes
  { path: '/', title: 'Home', portal: 'public' },
  { path: '/courses', title: 'Curriculum & Courses', portal: 'public' },
  { path: '/course/:slug', title: 'Course Details', portal: 'public' },
  { path: '/enroll', title: 'Enroll in Course', portal: 'public' },
  { path: '/enroll/:slug', title: 'Enroll in Course', portal: 'public' },
  { path: '/checkout', title: 'Secure Checkout', portal: 'public' },
  { path: '/booking', title: 'Book 1:1 Diagnostic Trial', portal: 'public' },
  { path: '/teachers', title: 'Faculty & Gurus', portal: 'public' },
  { path: '/teacher/:id', title: 'Faculty Profile', portal: 'public' },
  { path: '/pricing', title: 'Tuition & Packages', portal: 'public' },
  { path: '/free-trial', title: 'Book 1:1 Diagnostic Trial', portal: 'public' },
  { path: '/masterclasses', title: 'Maestro Masterclasses', portal: 'public' },
  { path: '/masterclass/:id', title: 'Masterclass Detail', portal: 'public' },
  { path: '/performances', title: 'Student Performances', portal: 'public' },
  { path: '/showcase/:id', title: 'Showcase Detail', portal: 'public' },
  { path: '/events', title: 'Recitals & Concerts', portal: 'public' },
  { path: '/tools', title: 'Riyaaz Tools & Tanpura', portal: 'public' },
  { path: '/blog', title: 'Conservatory Journal', portal: 'public' },
  { path: '/blog/:slug', title: 'Article Details', portal: 'public' },
  { path: '/contact', title: 'Contact & Admissions Desk', portal: 'public' },
  { path: '/faq', title: 'Frequently Asked Questions', portal: 'public' },
  { path: '/certifications', title: '4-Pillar Grading & Diplomas', portal: 'public' },
  { path: '/about', title: 'Our Story & Philosophy', portal: 'public' },
  { path: '/shop', title: 'Instrument Emporium', portal: 'public' },
  { path: '/tracking/:id', title: 'Live Order Tracking', portal: 'public' },
  { path: '/verify-certificate/:certificateId', title: 'Certificate Verification', portal: 'public' },

  // Student Portal Routes (/app/*)
  { path: '/app', title: 'Student Sanctuary', portal: 'student', requiresAuth: true },
  { path: '/app/learn', title: 'My Enrolled Courses', portal: 'student', requiresAuth: true },
  { path: '/app/course', title: 'My Course & Syllabus', portal: 'student', requiresAuth: true },
  { path: '/app/classes', title: 'Live 1:1 Classes & Recordings', portal: 'student', requiresAuth: true },
  { path: '/app/practice', title: 'Practice Studio (Riyaaz)', portal: 'student', requiresAuth: true },
  { path: '/app/resources', title: 'Practice & Resources', portal: 'student', requiresAuth: true },
  { path: '/app/attendance', title: 'Attendance & Punctuality', portal: 'student', requiresAuth: true },
  { path: '/app/assignments', title: 'Assignments & Video Homework', portal: 'student', requiresAuth: true },
  { path: '/app/submissions', title: 'Performance Submissions', portal: 'student', requiresAuth: true },
  { path: '/app/progress', title: 'Progress & Swara Mastery', portal: 'student', requiresAuth: true },
  { path: '/app/events', title: 'Recital Auditions', portal: 'student', requiresAuth: true },
  { path: '/app/masterclasses', title: 'Enrolled Masterclasses', portal: 'student', requiresAuth: true },
  { path: '/app/certificates', title: 'Graded Diplomas', portal: 'student', requiresAuth: true },
  { path: '/app/payments', title: 'Tuition Subscriptions & Invoices', portal: 'student', requiresAuth: true },
  { path: '/app/messages', title: 'Guru Direct Messages', portal: 'student', requiresAuth: true },
  { path: '/app/profile', title: 'Learner Profile & Settings', portal: 'student', requiresAuth: true },
  { path: '/app/settings', title: 'Learner Settings & Profile', portal: 'student', requiresAuth: true },

  // Teacher Portal Routes (/teacher-app/*)
  { path: '/teacher-app', title: 'Faculty Studio Dashboard', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/today-classes', title: "Today's Live Classes", portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/classes', title: "Today's Live Classes", portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/calendar', title: 'Faculty Timetable & Calendar', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/students', title: 'Student Roster & Profiles', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/availability', title: 'Schedule & Slot Availability', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/profile', title: 'Faculty Conservatory Profile', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/assignments', title: 'Homework Review & Feedback', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },
  { path: '/teacher-app/messages', title: 'Student Communication Board', portal: 'teacher', requiresAuth: true, requiredRole: ['teacher', 'admin', 'super_admin'] },

  // Admin Portal Routes (/admin/*)
  { path: '/admin', title: 'Executive Command Center', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator', 'sales', 'finance'] },
  { path: '/admin/students', title: 'Student Directory', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator'] },
  { path: '/admin/teachers', title: 'Faculty & Gurus Directory', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator'] },
  { path: '/admin/courses', title: 'Curriculum & Syllabi', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator'] },
  { path: '/admin/classes', title: 'Live Class Schedule Operations', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator'] },
  { path: '/admin/payments', title: 'Razorpay Orders & Financials', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'finance'] },
  { path: '/admin/leads', title: 'Trial Booking Leads Pipeline', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'sales'] },
  { path: '/admin/events', title: 'Recitals & Concert Planning', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin'] },
  { path: '/admin/masterclasses', title: 'Maestro Masterclass Operations', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin'] },
  { path: '/admin/content', title: 'Content, Blog & Testimonials', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin'] },
  { path: '/admin/reports', title: 'Academic & Financial Reports', portal: 'admin', requiresAuth: true, requiredRole: ['admin', 'super_admin', 'academic_coordinator', 'finance'] },
  { path: '/admin/settings', title: 'System Settings & RBAC', portal: 'admin', requiresAuth: true, requiredRole: ['super_admin'] }
];

export function getPortalFromPath(path: string): PortalType {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/teacher-app')) return 'teacher';
  if (path.startsWith('/app')) return 'student';
  return 'public';
}
