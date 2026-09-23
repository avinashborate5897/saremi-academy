import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';
import { Card } from '../../design-system';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  User,
  Video,
  CheckCircle2,
  MessageCircle,
  Music,
  ArrowRight,
  BookOpen,
  Award,
  CreditCard,
  Check,
  ShieldCheck,
  Lock,
  RotateCcw
} from 'lucide-react';
import {
  subscribeToStudentTrialBookings,
  subscribeToStudentEnrollments,
  confirmTrialBookingSlot
} from '../../lib/courseCrmService';
import {
  subscribeToStudentSessions,
  formatSessionDateIST,
  formatSessionTimeIST
} from '../../lib/sessionService';
import {
  subscribeToStudentTrialAssessments,
  ACADEMY_PACKAGES
} from '../../lib/academyWorkflowService';
import {
  TrialBookingRecord,
  ClassSession,
  TrialAssessment,
  EnrollmentRecord
} from '../../types';
import { LiveClassroomModal } from '../classroom/LiveClassroomModal';
import { CourseEnrollmentModal } from '../checkout/CourseEnrollmentModal';
import { CoursesView } from '../public/CoursesView';

const ACADEMY_WHATSAPP_NUMBER = '918591174823';

export const StudentDemoDashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();

  // Real-time Firestore state
  const [trialBookings, setTrialBookings] = useState<TrialBookingRecord[]>([]);
  const [studentClasses, setStudentClasses] = useState<ClassSession[]>([]);
  const [trialAssessments, setTrialAssessments] = useState<TrialAssessment[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  // Modals state
  const [activeLiveClass, setActiveLiveClass] = useState<ClassSession | null>(null);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-3month-term');

  const studentName = profile?.name || user?.displayName || 'Learner';
  const studentEmail = user?.email || profile?.email || '';
  const studentUid = user?.uid || profile?.id || '';

  // 1. Real-time trial bookings listener
  useEffect(() => {
    if (!studentUid && !studentEmail) return;
    const unsub = subscribeToStudentTrialBookings(studentUid, studentEmail, (records) => {
      setTrialBookings(records || []);
    });
    return () => unsub();
  }, [studentUid, studentEmail]);

  // 2. Real-time class sessions listener
  useEffect(() => {
    if (!studentUid && !studentEmail) return;
    const unsub = subscribeToStudentSessions(studentUid, studentEmail, (sessions) => {
      setStudentClasses(sessions || []);
    });
    return () => unsub();
  }, [studentUid, studentEmail]);

  // 3. Real-time trial assessments listener
  useEffect(() => {
    if (!studentEmail && !studentUid) return;
    const unsub = subscribeToStudentTrialAssessments(studentEmail, (assessments) => {
      setTrialAssessments(assessments || []);
    });
    return () => unsub();
  }, [studentEmail, studentUid]);

  // 4. Real-time enrollments listener
  useEffect(() => {
    if (!studentUid && !studentEmail) return;
    const unsub = subscribeToStudentEnrollments(studentUid, studentEmail, (records) => {
      setEnrollments(records || []);
    });
    return () => unsub();
  }, [studentUid, studentEmail]);

  // Compute status metrics
  const activePaidEnrollment = Array.isArray(enrollments) && enrollments.find(e => e?.status === 'active');
  const hasActivePaidEnrollment = !!activePaidEnrollment ||
    (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0 && profile?.status === 'active');

  // Trial bookings resolution
  const activeTrial = (Array.isArray(trialBookings) && trialBookings.length > 0)
    ? trialBookings.find(t => t && t.status !== 'completed' && t.status !== 'cancelled')
    : (profile as any)?.trialBooking;

  const completedTrial = (Array.isArray(trialBookings) && trialBookings.length > 0)
    ? trialBookings.find(t => t && t.status === 'completed')
    : null;

  const trialClassSession = Array.isArray(studentClasses)
    ? studentClasses.find(c => c && (c.isTrial || c.trialId) && c.status !== 'cancelled')
    : undefined;

  const liveDemoClass = Array.isArray(studentClasses)
    ? studentClasses.find(c => c && (c.isTrial || c.trialId) && c.status === 'live')
    : undefined;

  const scheduledDemoClass = Array.isArray(studentClasses)
    ? studentClasses.find(c => c && (c.isTrial || c.trialId) && c.status === 'scheduled')
    : undefined;

  const nextDemoClass = liveDemoClass || scheduledDemoClass || trialClassSession || null;
  const latestAssessment = trialAssessments.length > 0 ? trialAssessments[0] : null;

  // Determine Dashboard Workflow Mode
  const isUpcomingDemoMode = !hasActivePaidEnrollment && (
    (!!activeTrial && activeTrial.status !== 'completed') ||
    (!!trialClassSession && trialClassSession.status !== 'completed')
  );

  const isChooseCourseMode = !hasActivePaidEnrollment && !isUpcomingDemoMode;

  // =========================================================================
  // IF PAID ENROLLMENT IS ACTIVE
  // =========================================================================
  if (hasActivePaidEnrollment) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-left py-4">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 w-fit mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Course Active & Enrolled</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to Your Saremi Sanctuary, {String(studentName).split(' ')[0]}!
          </h1>
          <p className="text-sm text-emerald-100/90 max-w-2xl">
            Your 1:1 mentorship package is active. Access your live classes, practice studio, and classical syllabus.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer hover:brightness-110"
            >
              <span>Go to Full Student Sanctuary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // WORKFLOW A: UPCOMING DEMO STATUS (Stage 1)
  // =========================================================================
  if (isUpcomingDemoMode) {
    const demoTeacher = nextDemoClass?.teacherName || nextDemoClass?.instructorName || activeTrial?.teacherName || (profile as any)?.assignedTeacher || 'Faculty Guru';
    const demoDiscipline = nextDemoClass?.courseTitle || activeTrial?.courseName || (profile as any)?.trialDiscipline || '1:1 Diagnostic Music Demo';
    const demoDateStr = nextDemoClass ? formatSessionDateIST(nextDemoClass) : (activeTrial?.proposedDate || activeTrial?.date || 'Scheduled Date');
    const demoTimeStr = nextDemoClass ? formatSessionTimeIST(nextDemoClass) : (activeTrial?.proposedTime || activeTrial?.time || 'Scheduled Time');
    const isDemoLiveNow = nextDemoClass?.status === 'live';
    const isSlotProposed = activeTrial?.status === 'slot_proposed';

    return (
      <div className="space-y-6 pb-20 sm:pb-0 text-left max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Complimentary 1:1 Diagnostic Free Demo</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
              Your Free Demo is Scheduled
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Namaste, {String(studentName || 'Learner').split(' ')[0]} 👋 Welcome to Saremi Academy! Your live 1:1 diagnostic music session with our faculty guru is confirmed.
            </p>
          </div>
        </div>

        {/* Prevent Duplicate Booking Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">One Demo Per Student Policy:</span> You have an active 1:1 demo booking in place. Duplicate bookings are disabled. Access your live session or reschedule below.
          </div>
        </div>

        {/* Demo Details Card */}
        <Card variant="default" padding="lg" className="border-2 border-amber-200 bg-amber-50/50 rounded-3xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-600 text-white flex items-center gap-1.5 shadow-sm">
              {isDemoLiveNow ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>🔴 Live Demo Active</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Scheduled Demo</span>
                </>
              )}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              IST (India Standard Time)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm">
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Demo Details</div>
              <div>
                <div className="text-xs text-gray-500">Mentorship Discipline</div>
                <div className="font-serif font-bold text-lg text-gray-900">{demoDiscipline}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Assigned Faculty Guru</div>
                <div className="font-bold text-sm text-amber-900 flex items-center gap-2 mt-0.5">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>{demoTeacher}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm">
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Scheduled Timing</div>
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-bold text-sm text-gray-900 flex items-center gap-2 mt-0.5">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  <span>{demoDateStr}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Time (IST)</div>
                <div className="font-bold text-sm text-gray-900 flex items-center gap-2 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{demoTimeStr} IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isSlotProposed ? (
              <button
                onClick={() => activeTrial && confirmTrialBookingSlot({ bookingId: activeTrial.id, confirmedBy: studentName })}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Free Demo Slot</span>
              </button>
            ) : isDemoLiveNow ? (
              <button
                onClick={() => nextDemoClass && setActiveLiveClass(nextDemoClass)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <Video className="w-5 h-5 text-white" />
                <span>🔴 Join Free Demo</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (nextDemoClass) {
                    setActiveLiveClass(nextDemoClass);
                  } else if (activeTrial) {
                    setActiveLiveClass({
                      id: `cls_demo_${activeTrial.id}`,
                      sessionId: `cls_demo_${activeTrial.id}`,
                      studentId: user?.uid || activeTrial.studentId || 'trial_std',
                      studentName: studentName,
                      studentEmail: user?.email || activeTrial.email || '',
                      teacherId: activeTrial.teacherId || 'faculty_mentor',
                      teacherName: demoTeacher,
                      courseId: 'course_trial',
                      courseTitle: demoDiscipline,
                      scheduledAt: `${demoDateStr} ${demoTimeStr}`,
                      date: demoDateStr,
                      time: `${demoTimeStr} IST`,
                      durationMinutes: 30,
                      status: 'scheduled',
                      isTrial: true,
                      trialId: activeTrial.id,
                      roomId: activeTrial.roomId || `saremi_trial_${activeTrial.id}`
                    });
                  }
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-5 h-5 text-amber-400" />
                <span>Attend Your Free Demo</span>
              </button>
            )}

            <a
              href={`https://wa.me/${ACADEMY_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Saremi Academy! I would like to check details for my Free Demo (${demoDiscipline} with ${demoTeacher} on ${demoDateStr} at ${demoTimeStr}).`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Need to Reschedule?</span>
            </a>
          </div>
        </Card>

        {/* Expectation & Practice Studio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="default" padding="md" className="border border-gray-200 bg-white rounded-3xl">
            <h3 className="font-serif font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              What to Expect in Your Free Demo
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>1:1 Diagnostic Vocal & Rhythm evaluation with senior Guru</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>HD 1:1 Live Classroom with real-time audio tanpura drone</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Personalized Riyaaz feedback & recommended course roadmap</span>
              </li>
            </ul>
          </Card>

          <Card variant="interactive" padding="md" className="border border-purple-200 bg-purple-50/50 rounded-3xl flex flex-col justify-between cursor-pointer" onClick={() => navigate('/app/practice')}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-900">Tanpura Practice Studio</span>
              </div>
              <h4 className="font-bold text-sm text-gray-900">Warm Up Before Your Demo</h4>
              <p className="text-xs text-gray-600 mt-1">Try our acoustic 4-string Tanpura drone to align your pitch before class.</p>
            </div>
            <div className="mt-3 text-xs font-bold text-purple-700 flex items-center gap-1">
              Open Tanpura Studio <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </div>

        {/* Option to Choose Course */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-3">Ready to start your regular 1:1 classical music mentorship right away?</p>
          <button
            onClick={() => setIsEnrollOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Choose Your Course & Enroll</span>
          </button>
        </div>

        {/* Live Classroom Modal */}
        {activeLiveClass && (
          <LiveClassroomModal
            session={activeLiveClass}
            currentUser={profile ? { ...profile, uid: user?.uid || profile.uid } : { uid: user?.uid, email: user?.email || '', name: studentName, role: 'student' } as any}
            role="student"
            subscriptionStatus={{ hasActiveSubscription: true, accessGranted: true, isExpired: false, status: 'active', remainingSessions: 1 } as any}
            onClose={() => setActiveLiveClass(null)}
          />
        )}

        {/* Course Enrollment Modal */}
        {isEnrollOpen && (
          <CourseEnrollmentModal
            isOpen={isEnrollOpen}
            isRenewal={false}
            preselectedPackageId={selectedPackageId}
            onClose={() => setIsEnrollOpen(false)}
            onSuccess={() => {
              setIsEnrollOpen(false);
              if (refreshProfile) refreshProfile();
            }}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // WORKFLOW B: CHOOSE YOUR COURSE WORKFLOW (Stage 2 / Demo Completed)
  // =========================================================================
  return (
    <div className="space-y-6 pb-20 sm:pb-0 text-left max-w-4xl mx-auto">
      {/* Banner: Demo Completed & Purchase Eligible */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>1:1 Diagnostic Demo Passed • Purchase Eligible</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
            Your Demo is Complete & Passed 🎉
          </h1>
          <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Congratulations! You are officially eligible to enroll in Saremi Academy. Purchase your personalized course to confirm your Guru assignment and access live classes, homework, teacher audio recordings, and practice studios.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (latestAssessment?.recommendedPackageId) {
                  setSelectedPackageId(latestAssessment.recommendedPackageId);
                }
                setIsEnrollOpen(true);
              }}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900" />
              <span>Purchase Course</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-emerald-200/80 font-medium">
              Instant teacher assignment & live schedule generation upon payment.
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic Assessment Report (If available) */}
      {latestAssessment && (
        <Card variant="default" padding="lg" className="border-2 border-indigo-100 bg-indigo-50/40 rounded-3xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  Guru Diagnostic Evaluation Report
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Conducted by {latestAssessment.teacherName || 'Faculty Guru'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Diagnostic Score:</span>
              <span className="font-serif font-black text-2xl text-indigo-700 bg-white px-3 py-1 rounded-xl shadow-sm border border-indigo-200">
                {latestAssessment.overallScore ?? 9}/10
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Pitch Accuracy</span>
              <span className="font-bold text-base text-gray-900">{latestAssessment.pitchAccuracy ?? 8}/10</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Rhythm & Taal</span>
              <span className="font-bold text-base text-gray-900">{latestAssessment.rhythmSense ?? 8}/10</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Ear Grasping</span>
              <span className="font-bold text-base text-gray-900">{latestAssessment.earGrasping ?? 8}/10</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Voice Flex</span>
              <span className="font-bold text-base text-gray-900">{latestAssessment.vocalFlexibility ?? 8}/10</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 text-xs text-gray-700 leading-relaxed italic">
            "{latestAssessment.teacherFeedback || 'Great potential in vocal resonance. Recommended for structured 1:1 Conservatory Term.'}"
          </div>

          {/* Recommended Package Callout */}
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50/70 p-5 rounded-2xl border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
                Recommended Course
              </span>
              <h4 className="font-serif font-bold text-base text-gray-900">
                {latestAssessment.recommendedPackage || '3-Month Level Certification Term (24 Classes)'}
              </h4>
              <p className="text-xs text-gray-600">
                {latestAssessment.guruRecommendation || 'Recommended for structured 1:1 lessons twice a week with personalized Riyaaz exercises.'}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPackageId(latestAssessment.recommendedPackageId || 'pkg-3month-term');
                setIsEnrollOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Enroll in Recommended Course</span>
            </button>
          </div>
        </Card>
      )}

      {/* Reuse Existing Explore Courses / Select Your Course & Learning Plan Section */}
      <div className="pt-2">
        <CoursesView
          hideHeroHeader={true}
          onOpenBooking={() => {}}
          onOpenEnrollment={(course, packageId) => {
            if (packageId) setSelectedPackageId(packageId);
            setIsEnrollOpen(true);
          }}
        />
      </div>

      {/* Course Enrollment Modal */}
      {isEnrollOpen && (
        <CourseEnrollmentModal
          isOpen={isEnrollOpen}
          isRenewal={false}
          preselectedPackageId={selectedPackageId}
          onClose={() => setIsEnrollOpen(false)}
          onSuccess={() => {
            setIsEnrollOpen(false);
            if (refreshProfile) refreshProfile();
          }}
        />
      )}
    </div>
  );
};
