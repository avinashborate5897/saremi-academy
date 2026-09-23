import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { HomepageView } from '../public/HomepageView';
import { CoursesView } from '../public/CoursesView';
import { TeachersView } from '../public/TeachersView';
import { PricingView } from '../public/PricingView';
import { FreeTrialFunnel } from '../public/FreeTrialFunnel';
import { MasterclassesView } from '../public/MasterclassesView';
import { EventsView } from '../public/EventsView';
import { ToolsView } from '../public/ToolsView';
import { BlogView } from '../public/BlogView';
import { ContactView } from '../public/ContactView';
import { FAQView } from '../public/FAQView';
import { CertificationsView } from '../public/CertificationsView';
import { AboutView } from '../public/AboutView';
import { EnrollmentView } from '../public/EnrollmentView';
import { Shop } from '../Shop';
import { OrderTracking } from '../OrderTracking';
import { MasterclassDetailView } from '../public/MasterclassDetailView';
import { PerformancesView } from '../public/PerformancesView';
import { ShowcaseDetailView } from '../public/ShowcaseDetailView';
import { CheckoutView } from '../public/CheckoutView';
import { CertificateVerificationView } from '../public/CertificateVerificationView';
import { Course } from '../../types';

interface PublicViewProps {
  onOpenBooking: () => void;
  onOpenAuth: () => void;
  onOpenEnrollment?: (course?: Course, packageId?: string) => void;
}

export const PublicView: React.FC<PublicViewProps> = ({ onOpenBooking, onOpenAuth, onOpenEnrollment }) => {
  const { currentPath, activeRoute, params, navigate } = useRouter();

  // Normalize current path (remove trailing slash and search params if any)
  const normalizedPath = (currentPath || '/').split('?')[0].replace(/\/+$/, '') || '/';

  // /checkout
  if (normalizedPath === '/checkout' || activeRoute?.path === '/checkout') {
    return <CheckoutView onOpenBooking={onOpenBooking} onOpenEnrollment={onOpenEnrollment} />;
  }

  // /booking
  if (normalizedPath === '/booking' || activeRoute?.path === '/booking') {
    return <FreeTrialFunnel onOpenBooking={onOpenBooking} />;
  }

  // /course/:slug
  if (normalizedPath.startsWith('/course/') || activeRoute?.path === '/course/:slug') {
    return <CoursesView onOpenBooking={onOpenBooking} onOpenEnrollment={onOpenEnrollment} slug={params.slug} />;
  }

  // /courses
  if (normalizedPath === '/courses' || activeRoute?.path === '/courses') {
    return <CoursesView onOpenBooking={onOpenBooking} onOpenEnrollment={onOpenEnrollment} />;
  }

  // /enroll/:slug
  if (normalizedPath.startsWith('/enroll/') || activeRoute?.path === '/enroll/:slug') {
    return <EnrollmentView courseSlug={params.slug} onOpenBooking={onOpenBooking} />;
  }

  // /enroll
  if (normalizedPath === '/enroll' || activeRoute?.path === '/enroll') {
    return <EnrollmentView onOpenBooking={onOpenBooking} />;
  }

  // /teacher/:id
  if (currentPath.startsWith('/teacher/')) {
    return <TeachersView onOpenBooking={onOpenBooking} teacherId={params.id} />;
  }

  // /teachers
  if (currentPath === '/teachers') {
    return <TeachersView onOpenBooking={onOpenBooking} />;
  }

  // /pricing
  if (currentPath === '/pricing') {
    return <PricingView onOpenBooking={onOpenBooking} />;
  }

  // /free-trial
  if (currentPath === '/free-trial') {
    return <FreeTrialFunnel />;
  }

  // /masterclasses
  if (currentPath === '/masterclasses') {
    return <MasterclassesView onOpenBooking={onOpenBooking} />;
  }

  // /masterclass/:id
  if (currentPath.startsWith('/masterclass/')) {
    return <MasterclassDetailView id={params.id} onOpenBooking={onOpenBooking} />;
  }

  // /performances
  if (currentPath === '/performances') {
    return <PerformancesView />;
  }

  // /showcase/:id
  if (currentPath.startsWith('/showcase/')) {
    return <ShowcaseDetailView id={params.id} />;
  }

  // /events
  if (currentPath === '/events') {
    return <EventsView onOpenBooking={onOpenBooking} />;
  }

  // /tools
  if (currentPath === '/tools') {
    return <ToolsView />;
  }

  // /blog/:slug
  if (currentPath.startsWith('/blog/')) {
    return <BlogView slug={params.slug} onOpenBooking={onOpenBooking} />;
  }

  // /blog
  if (currentPath === '/blog') {
    return <BlogView onOpenBooking={onOpenBooking} />;
  }

  // /contact
  if (currentPath === '/contact') {
    return <ContactView />;
  }

  // /faq
  if (currentPath === '/faq') {
    return <FAQView onOpenBooking={onOpenBooking} />;
  }

  // /certifications
  if (currentPath === '/certifications') {
    return <CertificationsView onOpenBooking={onOpenBooking} />;
  }

  // /about
  if (currentPath === '/about') {
    return <AboutView onOpenBooking={onOpenBooking} />;
  }

  // /shop
  if (currentPath === '/shop') {
    return <Shop />;
  }

  // /verify-certificate/:certificateId
  if (currentPath.startsWith('/verify-certificate')) {
    return <CertificateVerificationView />;
  }

  // /tracking/:id
  if (currentPath.startsWith('/tracking')) {
    const orderId = params.id || '';
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OrderTracking orderId={orderId} onBackToDashboard={() => navigate('/app')} />
      </div>
    );
  }

  // Default Homepage (/)
  if (currentPath === '/') {
    return <HomepageView onOpenBooking={onOpenBooking} onOpenAuth={onOpenAuth} />;
  }

  // 404 NotFoundView inline
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-20 bg-saremi-bg">
      <div className="text-8xl mb-6 animate-bounce">🎶</div>
      <h1 className="font-serif text-5xl font-bold text-gray-900 mb-4">Oops! The song stopped.</h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto mb-8 font-medium">
        We can't seem to find the page you're looking for. Like a lost musical note looking for its song!
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-8 py-3 rounded-full bg-saremi-primary text-white font-bold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl active:scale-95"
      >
        Back to Saremi
      </button>
    </div>
  );
};
