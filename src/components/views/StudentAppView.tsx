import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';
import { 
  Home, 
  BookOpen, 
  Mic, 
  Calendar, 
  User, 
  Video, 
  Upload, 
  Star, 
  Flame, 
  PlusCircle,
  Award,
  LogOut,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Layers,
  ChevronRight,
  ShieldCheck,
  Activity,
  Lock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

import { dashboardService } from '../../lib/dashboardService';
import { calculateSubscriptionStatus } from '../../lib/academyWorkflowService';
import { subscribeToStudentEnrollments, subscribeToStudentTrialBookings } from '../../lib/courseCrmService';
import { subscribeToStudentSessions } from '../../lib/sessionService';
import { Assignment, ClassSession, EnrollmentRecord, StudentSubscriptionStatus, TrialBookingRecord } from '../../types';
import { StudentHome } from '../student/StudentHome';
import { StudentDemoDashboard } from './StudentDemoDashboard';
import { StudentClassesTab } from '../student/StudentClassesTab';
import { StudentCourseTab } from '../student/StudentCourseTab';
import { StudentResourcesTab } from '../student/StudentResourcesTab';
import { StudentAttendanceTab } from '../student/StudentAttendanceTab';
import { StudentSubscriptionTab } from '../student/StudentSubscriptionTab';
import { StudentProfileView } from '../student/StudentProfileView';
import { PracticeStudio } from '../student/PracticeStudio';
import { StudentSubmissionsView } from '../student/StudentSubmissionsView';
import { StudentNotificationsTab } from '../student/StudentNotificationsTab';
import { SaremiEmptyState } from '../common/SaremiUI';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { CourseEnrollmentModal } from '../checkout/CourseEnrollmentModal';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

export const StudentAppView: React.FC = () => {
  const { user, profile, role, loading: authLoading, isProfileReady, profileSyncError, retryProfileSync, logout } = useAuth();
  const { navigate, currentPath } = useRouter();

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [trials, setTrials] = useState<TrialBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [subscriptionOverride, setSubscriptionOverride] = useState<'active' | 'expired' | 'exhausted' | null>(null);

  useEffect(() => {
    // Gate execution: Ensure authentication is complete and profile is hydrated before calling protected listeners
    if (authLoading || !user || !isProfileReady) {
      if (!authLoading && !user) {
        setLoading(false);
      }
      return;
    }
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const cls = await dashboardService.getStudentClasses(user.uid);
        if (isMounted) {
          setClasses(Array.isArray(cls) ? cls : []);
        }
      } catch (error) {
        console.error("Error fetching student classes", error);
        if (isMounted) {
          setClasses([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDashboardData();

    // Subscribe to student's enrollments for live reactive subscription state
    const studentEmail = user.email || profile?.email;
    let unsubEnrollments: (() => void) | undefined;
    if (studentEmail || user.uid) {
      try {
        unsubEnrollments = subscribeToStudentEnrollments(user.uid, studentEmail, (records) => {
          if (isMounted) {
            setEnrollments(Array.isArray(records) ? records : []);
          }
        });
      } catch (err) {
        console.warn("Notice subscribing to student enrollments:", err);
      }
    }

    // Subscribe to student's live trial bookings using onSnapshot for real-time status transitions
    let unsubTrials: (() => void) | undefined;
    if (user.uid || studentEmail) {
      try {
        unsubTrials = subscribeToStudentTrialBookings(user.uid, studentEmail, (liveTrials) => {
          if (isMounted) {
            setTrials(Array.isArray(liveTrials) ? liveTrials : []);
          }
        });
      } catch (err) {
        console.warn("Notice subscribing to student trial bookings:", err);
      }
    }

    // Subscribe to student's live sessions for real-time timetable updates
    let unsubSessions: (() => void) | undefined;
    try {
      unsubSessions = subscribeToStudentSessions(user.uid, studentEmail, (liveList) => {
        if (isMounted) {
          setClasses(liveList || []);
        }
      });
    } catch (err) {
      console.warn("Notice subscribing to student sessions:", err);
    }

    return () => {
      isMounted = false;
      if (unsubEnrollments) {
        unsubEnrollments();
      }
      if (unsubTrials) {
        unsubTrials();
      }
      if (unsubSessions) {
        unsubSessions();
      }
    };
  }, [user, profile?.email, authLoading, isProfileReady]);

  // Compute calculated subscription status from real database/profile state
  const computedStatus = calculateSubscriptionStatus(profile || null, enrollments);

  // Active paid enrollment check
  const activePaidEnrollment = Array.isArray(enrollments) && enrollments.find(e => e?.status === 'active');
  const hasActivePaidEnrollment = !!activePaidEnrollment || 
    (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0 && computedStatus?.hasActiveSubscription);

  // Trial booking check
  const hasTrialBooking = (Array.isArray(trials) && trials.length > 0) || !!(profile as any)?.trialBooking;

  // Helper check: Has student ever purchased a paid enrollment?
  const hasEverHadPaidEnrollment = (Array.isArray(enrollments) && enrollments.length > 0) || (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0);

  // Compute effective subscription status with optional simulator override
  const subscriptionStatus: StudentSubscriptionStatus = React.useMemo(() => {
    if (!subscriptionOverride) return computedStatus;
    if (subscriptionOverride === 'expired') {
      const pastExp = new Date(Date.now() - 5 * 86400000).toISOString();
      return {
        ...computedStatus,
        hasActiveSubscription: false,
        accessGranted: false,
        isExpired: true,
        status: 'expired',
        expiryDate: pastExp,
        daysUntilExpiry: 0,
        lockReason: 'package_expired',
        message: 'Your package has expired. Renew your plan to continue learning.'
      };
    }
    if (subscriptionOverride === 'exhausted') {
      return {
        ...computedStatus,
        hasActiveSubscription: false,
        accessGranted: false,
        isExhausted: true,
        isExpired: true,
        status: 'exhausted',
        usedSessions: computedStatus.totalSessions,
        remainingSessions: 0,
        classesRemaining: 0,
        lockReason: 'sessions_exhausted',
        message: 'Your package has expired. Renew your plan to continue learning.'
      };
    }
    return {
      ...computedStatus,
      hasActiveSubscription: true,
      accessGranted: true,
      isExpired: false,
      isExhausted: false,
      status: 'active',
      lockReason: null
    };
  }, [computedStatus, subscriptionOverride]);

  // Authorization & Loading Check AFTER all hooks
  if (authLoading) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Student Sanctuary...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-left">
        <SaremiEmptyState
          icon="🔐"
          title="Sign in to Saremi Student Sanctuary"
          description="Access your personalized curriculum, 1:1 live classes, Tanpura practice studio, and progress."
          actionText="Log In / Register"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  if (!isProfileReady && profileSyncError) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Connecting Your Student Sanctuary</h2>
        <p className="text-gray-600 text-sm mb-6">
          Setting up your personalized profile and curriculum. Click below to proceed.
        </p>
        <button
          onClick={() => retryProfileSync()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Initialize Profile
        </button>
      </div>
    );
  }

  if (profile?.status === 'inactive' && role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900">Student Account Inactive</h2>
        <p className="text-gray-500 mt-2 text-xs leading-relaxed">
          Your student account (<strong>{profile.studentId || user.email}</strong>) is currently deactivated.
          Your course progress, practice submissions, and academic milestones remain safely preserved.
        </p>
        <p className="text-gray-400 mt-2 text-[11px]">
          Please contact academy support at support@saremiacademy.com to reactivate your portal access.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Return to Academy Home
          </button>
          <button
            onClick={logout}
            className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (role && role !== 'student' && role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2 text-sm">
          You do not have permission to access the Student Portal.
        </p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  // The 6 Official Student Dashboard Areas
  const dashboardTabs = [
    { path: '/app', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    { path: '/app/classes', label: 'My Classes', icon: <Calendar className="w-4 h-4" /> },
    { path: '/app/course', label: 'My Course', icon: <BookOpen className="w-4 h-4" /> },
    { path: '/app/practice', label: 'Practice & Resources', icon: <Mic className="w-4 h-4" /> },
    { path: '/app/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { path: '/app/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  // Mobile Bottom Navigation Items
  const mobileNavItems = [
    { id: '/app', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { id: '/app/classes', icon: <Calendar className="w-5 h-5" />, label: 'Classes' },
    { id: '/app/course', icon: <BookOpen className="w-5 h-5" />, label: 'Course' },
    { id: '/app/practice', icon: <Mic className="w-5 h-5" />, label: 'Practice' },
    { id: '/app/notifications', icon: <Bell className="w-5 h-5" />, label: 'Alerts' },
    { id: '/app/profile', icon: <User className="w-5 h-5" />, label: 'Profile' }
  ];

  const isOverview = currentPath === '/app' || currentPath === '/app/';
  const isClasses = currentPath === '/app/classes';
  const isCourse = currentPath === '/app/course' || currentPath === '/app/learn';
  const isPracticeStudio = currentPath === '/app/practice';
  const isResources = currentPath === '/app/resources' || currentPath === '/app/assignments';
  const isNotifications = currentPath === '/app/notifications';
  const isSettings = currentPath === '/app/settings' || currentPath === '/app/profile';
  const isAttendance = currentPath === '/app/attendance';
  const isSubmissions = currentPath === '/app/submissions';
  const isPayments = currentPath === '/app/payments';

  // Swipe Gestures Handler for Mobile App Views
  const currentTabPath = isOverview ? '/app'
    : isClasses ? '/app/classes'
    : isCourse ? '/app/course'
    : isPracticeStudio ? '/app/practice'
    : isNotifications ? '/app/notifications'
    : isSettings ? '/app/profile'
    : '/app';

  const currentTabIndex = mobileNavItems.findIndex(item => item.id === currentTabPath);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentTabIndex >= 0 && currentTabIndex < mobileNavItems.length - 1) {
        triggerHaptic('selection');
        navigate(mobileNavItems[currentTabIndex + 1].id);
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        triggerHaptic('selection');
        navigate(mobileNavItems[currentTabIndex - 1].id);
      }
    },
    minDistance: 60
  });

  return (
    <div 
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchEnd={swipeHandlers.onTouchEnd}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen text-left touch-pan-y"
    >
      
      {/* GLOBAL PACKAGE EXPIRY NOTIFICATION BANNER (Only shown for former paid students whose package has ACTUALLY expired) */}
      {hasEverHadPaidEnrollment && subscriptionStatus.isExpired && (
        <div className="mb-6 bg-gradient-to-r from-rose-900 via-rose-950 to-neutral-900 text-white rounded-3xl p-5 sm:p-6 border border-rose-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Subscription Status: {subscriptionStatus.status.toUpperCase()}
                </span>
                <span className="text-xs text-rose-300/80 font-mono">
                  {subscriptionStatus.remainingSessions} Credits Remaining
                </span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Your package has expired. Renew your plan to continue learning.
              </h3>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Live 1:1 sessions, interactive classroom access, premium curriculum modules, and Tanpura practice studio are locked. Your historical lessons, attendance records, and payment receipts are safely preserved.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Package</span>
          </button>
        </div>
      )}

      {/* TOP DESKTOP & TABLET DASHBOARD SUB-NAVIGATION BAR */}
      <div className="hidden sm:flex items-center justify-between gap-2 bg-white/90 backdrop-blur-md p-2 rounded-3xl border border-gray-200/80 shadow-sm mb-8 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {dashboardTabs.map((tab) => {
            const isActive = 
              (tab.path === '/app' && isOverview) ||
              (tab.path === '/app/classes' && isClasses) ||
              (tab.path === '/app/attendance' && isAttendance) ||
              (tab.path === '/app/practice' && isPracticeStudio) ||
              (tab.path === '/app/resources' && isResources) ||
              (tab.path === '/app/submissions' && isSubmissions) ||
              (tab.path === '/app/settings' && isSettings);

            return (
              <button
                key={tab.path}
                onClick={() => {
                  triggerHaptic('selection');
                  navigate(tab.path);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            navigate('/app/practice');
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer border border-amber-200 shrink-0"
        >
          <Mic className="w-3.5 h-3.5 text-amber-700" />
          <span>Tanpura Studio</span>
        </button>
      </div>

      {/* ACTIVE TAB VIEWS PROTECTED BY ERROR BOUNDARY */}
      <ErrorBoundary fallbackTitle="Student Sanctuary Section" fallbackMessage="We encountered an issue loading this section. Please reload or select another tab.">
        {/* 1. VIEW: Dashboard Overview (/app) */}
        {isOverview && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {(hasTrialBooking || !hasActivePaidEnrollment) && !hasActivePaidEnrollment ? (
              <StudentDemoDashboard />
            ) : (
              <StudentHome 
                subscriptionStatus={subscriptionStatus}
                onRenew={() => setIsRenewalModalOpen(true)}
              />
            )}
          </motion.div>
        )}

        {/* 2. VIEW: Classes (/app/classes) */}
        {isClasses && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentClassesTab 
              profile={profile} 
              classes={classes} 
              subscriptionStatus={subscriptionStatus}
              onRenew={() => setIsRenewalModalOpen(true)}
            />
          </motion.div>
        )}

        {/* 3. VIEW: Attendance (/app/attendance) */}
        {isAttendance && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentAttendanceTab profile={profile} classes={classes} />
          </motion.div>
        )}

        {/* 4. VIEW: Practice Studio (/app/practice) */}
        {isPracticeStudio && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="pb-24 sm:pb-0">
            <PracticeStudio 
              subscriptionStatus={subscriptionStatus}
              onRenew={() => setIsRenewalModalOpen(true)}
            />
          </motion.div>
        )}

        {/* 5. VIEW: Study Resources (/app/resources, /app/assignments) */}
        {isResources && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentResourcesTab 
              profile={profile} 
              subscriptionStatus={subscriptionStatus}
              onRenew={() => setIsRenewalModalOpen(true)}
            />
          </motion.div>
        )}

        {/* 6. VIEW: Showcase / Submissions (/app/submissions) */}
        {isSubmissions && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentSubmissionsView />
          </motion.div>
        )}

        {/* 5. VIEW: Notifications (/app/notifications) */}
        {isNotifications && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentNotificationsTab />
          </motion.div>
        )}

        {/* 6. VIEW: Settings / Profile (/app/settings, /app/profile) */}
        {isSettings && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentProfileView />
          </motion.div>
        )}

        {/* Optional Secondary Views: Course Curriculum & Payments */}
        {isCourse && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentCourseTab 
              profile={profile} 
              subscriptionStatus={subscriptionStatus}
              onRenew={() => setIsRenewalModalOpen(true)}
            />
          </motion.div>
        )}

        {isPayments && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <StudentSubscriptionTab 
              profile={profile || null}
              enrollments={enrollments}
              subscriptionOverride={subscriptionOverride}
              onSetSubscriptionOverride={setSubscriptionOverride}
            />
          </motion.div>
        )}
      </ErrorBoundary>

      {/* RENEWAL MODAL */}
      {isRenewalModalOpen && (
        <CourseEnrollmentModal
          isOpen={isRenewalModalOpen}
          isRenewal={true}
          existingEnrollment={profile?.enrolledCourses?.[0] || (enrollments.length > 0 ? {
            courseId: enrollments[0].courseId || 'course-vocal-01',
            courseTitle: enrollments[0].courseTitle || enrollments[0].courseName || 'Hindustani Classical Vocal Conservatory',
            packageName: enrollments[0].packageName || '3-Month Term (24 Classes)',
            packageId: enrollments[0].packageId || 'pkg-3m',
            teacherId: enrollments[0].teacherId || 'tch_sunanda',
            teacherName: enrollments[0].teacherName || 'Vidushi Sunanda Sharma',
            totalSessions: enrollments[0].totalSessions || enrollments[0].classesTotal || 24,
            sessionsCompleted: enrollments[0].usedSessions || enrollments[0].classesCompleted || 0,
            remainingSessions: enrollments[0].remainingSessions || enrollments[0].classesRemaining || 24,
            expiryDate: enrollments[0].expiryDate || new Date(Date.now() + 60 * 86400000).toISOString(),
            enrolledAt: enrollments[0].startDate || new Date().toISOString()
          } : undefined)}
          onClose={() => setIsRenewalModalOpen(false)}
          onSuccess={() => {
            setIsRenewalModalOpen(false);
            setSubscriptionOverride('active');
          }}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION (Fixed at bottom for mobile screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 sm:hidden pb-[calc(env(safe-area-inset-bottom)+0.4rem)] shadow-lg rounded-t-[28px]">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = 
              (item.id === '/app' && isOverview) ||
              (item.id === '/app/classes' && isClasses) ||
              (item.id === '/app/attendance' && isAttendance) ||
              (item.id === '/app/practice' && isPracticeStudio) ||
              (item.id === '/app/resources' && isResources) ||
              (item.id === '/app/submissions' && isSubmissions) ||
              (item.id === '/app/settings' && isSettings);

            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  navigate(item.id);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-h-[48px] min-w-[56px] relative cursor-pointer ${
                  isActive ? 'text-amber-700 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-amber-100 text-amber-800' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 leading-none font-semibold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

