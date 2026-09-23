/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider, useRouter } from './router/RouterContext';
import { PortalNavigation } from './components/shells/PortalNavigation';
import { PublicView } from './components/views/PublicView';
import { BookingModal } from './components/BookingModal';
import { AuthModal } from './components/AuthModal';
import { FirstLoginPasswordModal } from './components/auth/FirstLoginPasswordModal';
import { CourseEnrollmentModal } from './components/checkout/CourseEnrollmentModal';
import { Footer } from './components/Footer';
import { FloatingWhatsAppButton } from './components/common/FloatingWhatsAppButton';
import { AIPanditChatbot } from './components/home/AIPanditChatbot';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingState } from './design-system/LoadingState';
import { seedInitialDataIfEmpty } from './lib/firestoreService';
import { useAuth } from './context/AuthContext';
import { subscribeToStudentTrialBookings } from './lib/courseCrmService';
import { Course, TrialBookingRecord } from './types';

// Code-split heavy portal views to dramatically reduce initial bundle size
const StudentAppView = lazy(() =>
  import('./components/views/StudentAppView').then((m) => ({ default: m.StudentAppView }))
);
const TeacherAppView = lazy(() =>
  import('./components/views/TeacherAppView').then((m) => ({ default: m.TeacherAppView }))
);
const AdminAppView = lazy(() =>
  import('./components/views/AdminAppView').then((m) => ({ default: m.AdminAppView }))
);

function SaremiAppContent() {
  const { user, profile } = useAuth();
  const { portal, currentPath, navigate } = useRouter();

  // Determine if user is currently on the Hero landing / Home page
  const normalizedPath = (currentPath || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const isHeroLandingPage = portal === 'public' && (normalizedPath === '/' || normalizedPath === '/home');

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | undefined>(undefined);
  const [selectedPackageIdForEnrollment, setSelectedPackageIdForEnrollment] = useState<string | undefined>(undefined);
  const [trialBookings, setTrialBookings] = useState<TrialBookingRecord[]>([]);

  // Real-time trial bookings subscription for authenticated user
  useEffect(() => {
    if (!user?.uid) {
      setTrialBookings([]);
      return;
    }
    const unsub = subscribeToStudentTrialBookings(user.uid, user.email || '', (trials) => {
      setTrialBookings(trials);
    });
    return () => unsub();
  }, [user]);

  // Seed Firestore on startup if empty
  useEffect(() => {
    seedInitialDataIfEmpty().catch((err) => {
      console.warn('Initial seeding note:', err);
    });
  }, []);

  const hasExistingDemoBooking = 
    trialBookings.length > 0 || 
    Boolean((profile as any)?.trialBooking) || 
    (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0);

  const handleOpenBooking = () => {
    // If authenticated student already has a trial booking, redirect to DemoDashboard (/app)
    if (user && hasExistingDemoBooking) {
      navigate('/app');
      return;
    }
    setIsBookingOpen(true);
  };

  const handleOpenEnrollment = (course?: Course, packageId?: string) => {
    const courseId = course?.id || course?.slug || 'singing';
    navigate(`/checkout?course=${encodeURIComponent(courseId)}${packageId ? `&package=${encodeURIComponent(packageId)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#121829] flex flex-col font-sans selection:bg-[#D49A3D]/30 selection:text-[#121829]">
      {/* Top Main Navigation & Role Bar */}
      <PortalNavigation
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Main View Router based on active portal & route */}
      <main className="flex-1">
        <ErrorBoundary>
          {portal === 'public' && (
            <PublicView
              onOpenBooking={handleOpenBooking}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenEnrollment={handleOpenEnrollment}
            />
          )}

          {portal === 'student' && (
            <Suspense
              fallback={
                <LoadingState
                  message="Entering Student Sanctuary..."
                  subtext="Connecting to your personal curriculum, practice studio & classes"
                  className="min-h-[60vh]"
                />
              }
            >
              <StudentAppView />
            </Suspense>
          )}

          {portal === 'teacher' && (
            <Suspense
              fallback={
                <LoadingState
                  message="Loading Faculty Studio..."
                  subtext="Accessing teacher timetable, live classroom rosters & gradebook"
                  className="min-h-[60vh]"
                />
              }
            >
              <TeacherAppView />
            </Suspense>
          )}

          {portal === 'admin' && (
            <Suspense
              fallback={
                <LoadingState
                  message="Opening Administrative Control Panel..."
                  subtext="Authenticating and loading academy operations, student directory & schedules"
                  className="min-h-[60vh]"
                />
              }
            >
              <AdminAppView />
            </Suspense>
          )}
        </ErrorBoundary>
      </main>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {/* Course Enrollment & Checkout Modal */}
      {isEnrollmentOpen && (
        <CourseEnrollmentModal
          isOpen={isEnrollmentOpen}
          course={selectedCourseForEnrollment}
          preselectedPackageId={selectedPackageIdForEnrollment}
          onClose={() => {
            setIsEnrollmentOpen(false);
            setSelectedCourseForEnrollment(undefined);
            setSelectedPackageIdForEnrollment(undefined);
          }}
          onSuccess={() => {
            setIsEnrollmentOpen(false);
            setSelectedCourseForEnrollment(undefined);
            setSelectedPackageIdForEnrollment(undefined);
            navigate('/app');
          }}
        />
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}

      {/* Mandatory First-Login Password Change Modal for Faculty/Staff */}
      <FirstLoginPasswordModal />

      {/* Footer (shown on public and student portal) */}
      {(portal === 'public' || portal === 'student') && (
        <Footer
          onNavigate={(v) => {
            if (v === 'home') navigate('/');
            else if (v === 'courses') navigate('/courses');
            else if (v === 'shop') navigate('/shop');
            else if (v === 'dashboard') navigate('/app');
            else if (v === 'admin') navigate('/admin');
          }}
          onOpenBooking={handleOpenBooking}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Floating Saremi AI Pandit & Floating WhatsApp Quick Action Button - Hero / Landing page only */}
      {isHeroLandingPage && <AIPanditChatbot />}
      {isHeroLandingPage && <FloatingWhatsAppButton />}

      {/* Network Connectivity Status Indicator for Weak Connections */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <SaremiAppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
