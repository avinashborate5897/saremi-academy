import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button } from '../../design-system';
import { 
  Play, 
  Flame, 
  Trophy, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Music, 
  Mic, 
  Activity, 
  Calendar as CalendarIcon, 
  MessageCircle,
  Clock,
  BookOpen,
  Award,
  Video,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ChevronRight,
  ExternalLink,
  User,
  CreditCard,
  FileText,
  Radio,
  Lock
} from 'lucide-react';
import { useRouter } from '../../router/RouterContext';
import { dashboardService } from '../../lib/dashboardService';
import { calculateSubscriptionStatus, subscribeToStudentTrialAssessments, ACADEMY_PACKAGES } from '../../lib/academyWorkflowService';
import { COURSE_CATALOG, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { subscribeToStudentEnrollments, subscribeToStudentTrialBookings, confirmTrialBookingSlot } from '../../lib/courseCrmService';
import { subscribeToStudentSessions, formatSessionDateIST, formatSessionTimeIST } from '../../lib/sessionService';
import { ClassSession, TrialAssessment, EnrollmentRecord, StudentSubscriptionStatus, TrialBookingRecord } from '../../types';

const ACADEMY_WHATSAPP_NUMBER = '918591174823';
import { LiveClassroomModal } from '../classroom/LiveClassroomModal';
import { CourseEnrollmentModal } from '../checkout/CourseEnrollmentModal';
import { StudentDemoDashboard } from '../views/StudentDemoDashboard';
import { AcademicSessionModal } from './AcademicSessionModal';

interface StudentHomeProps {
  subscriptionStatus?: StudentSubscriptionStatus;
  onRenew?: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ subscriptionStatus: propSubStatus, onRenew: propOnRenew }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [trialAssessments, setTrialAssessments] = useState<TrialAssessment[]>([]);
  const [studentClasses, setStudentClasses] = useState<ClassSession[]>([]);

  const [trialBookings, setTrialBookings] = useState<TrialBookingRecord[]>([]);

  // Modals
  const [activeLiveClass, setActiveLiveClass] = useState<ClassSession | null>(null);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [academicWorkspaceSession, setAcademicWorkspaceSession] = useState<ClassSession | null>(null);
  const [academicWorkspaceInitialTab, setAcademicWorkspaceInitialTab] = useState<'overview' | 'homework' | 'practice' | 'chat'>('overview');

  const handleOpenRenewal = () => {
    if (propOnRenew) {
      propOnRenew();
    } else {
      setIsRenewalOpen(true);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const studentEmail = profile?.email || user.email;
        const [curr, cls] = await Promise.all([
          dashboardService.getCurriculum('test-course-id'),
          dashboardService.getStudentClasses(user.uid, studentEmail)
        ]);
        setCurriculum(curr.length ? curr : [
          { title: "Voice Architecture", icon: 'Mic', status: 'completed' },
          { title: "Rhythm & Taal", icon: 'Activity', status: 'completed' },
          { title: "Raag Yaman Bandish", icon: 'Music', status: 'current' },
          { title: "Morning Raag Bhairav", icon: 'Play', status: 'locked' },
          { title: "Performance Recital", icon: 'Star', status: 'locked' },
          { title: "Graded Diploma", icon: 'Award', status: 'locked' },
        ]);
        setStudentClasses(cls || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();

    // Subscribe to student's enrollments & assessments
    const email = profile?.email || user?.email || '';
    let unsubSessions: (() => void) | undefined;
    if (user?.uid) {
      unsubSessions = subscribeToStudentSessions(user.uid, email, (liveClasses) => {
        setStudentClasses(liveClasses || []);
      });
    }

    if (email || user?.uid) {
      const unsubEnr = email ? subscribeToStudentEnrollments(email, setEnrollments) : () => {};
      const unsubAssess = email ? subscribeToStudentTrialAssessments(email, setTrialAssessments) : () => {};
      const unsubTrials = subscribeToStudentTrialBookings(user?.uid || '', email, (trials) => {
        setTrialBookings(trials || []);
      });
      return () => {
        unsubEnr();
        unsubAssess();
        unsubTrials();
        if (unsubSessions) unsubSessions();
      };
    }

    return () => {
      if (unsubSessions) unsubSessions();
    };
  }, [user, profile]);

  // Compute live subscription status
  const subStatus = propSubStatus || calculateSubscriptionStatus(profile, enrollments);
  const latestAssessment = (Array.isArray(trialAssessments) && trialAssessments.length > 0) 
    ? trialAssessments[0] 
    : ((profile as any)?.trialAssessment || (profile as any)?.trialRecommendation)
      ? {
          id: 'assess_profile',
          teacherName: (profile as any)?.assignedTeacher || (profile as any)?.trialTeacher || 'Faculty Guru',
          courseName: (profile as any)?.trialDiscipline || '1:1 Diagnostic Music Trial',
          pitchAccuracy: 8,
          rhythmSense: 8,
          voiceRange: 'Natural Musical Resonance',
          guruRecommendation: (profile as any)?.trialRecommendation || 'Recommended for structured Conservatory Term.',
          recommendedLevel: (profile as any)?.recommendedLevel || 'Foundation',
          recommendedPackage: (profile as any)?.recommendedPackage || '3-Month Term (24 Classes)',
          overallScore: 9,
          createdAt: new Date().toISOString()
        }
      : undefined;

  const enrolledCourse = Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0 
    ? profile.enrolledCourses[0] 
    : undefined;
  const activeEnrollment = Array.isArray(enrollments) && enrollments.length > 0 
    ? (enrollments.find((e) => e?.status === 'active') || enrollments[0]) 
    : undefined;

  const studentName = profile?.name || user?.displayName || 'Student Musician';
  const hasEnrollmentData = !!enrolledCourse || !!activeEnrollment || subStatus?.hasActiveSubscription;
  
  const activeCourse = enrolledCourse?.courseTitle || enrolledCourse?.courseName || activeEnrollment?.courseTitle || activeEnrollment?.courseName || subStatus?.packageDetails?.courseTitle || (hasEnrollmentData ? 'Hindustani Classical Vocal Conservatory' : 'No Active Course');
  const currentPackage = enrolledCourse?.packageName || activeEnrollment?.packageName || subStatus?.packageDetails?.packageName || (hasEnrollmentData ? 'Standard Term Package' : 'No Active Package');
  const teacherName = enrolledCourse?.teacherName || activeEnrollment?.teacherName || subStatus?.packageDetails?.teacherName || (profile as any)?.assignedTeacher || 'Faculty Mentor';
  
  const rawTotalClasses = enrolledCourse?.totalSessions ?? activeEnrollment?.totalSessions ?? activeEnrollment?.classesTotal ?? subStatus?.totalSessions;
  const totalClasses = typeof rawTotalClasses === 'number' && rawTotalClasses > 0 ? rawTotalClasses : (hasEnrollmentData ? 24 : 0);
  
  const rawCompletedClasses = typeof enrolledCourse?.sessionsCompleted === 'number' 
    ? enrolledCourse.sessionsCompleted 
    : typeof activeEnrollment?.usedSessions === 'number'
    ? activeEnrollment.usedSessions
    : typeof activeEnrollment?.classesCompleted === 'number' 
    ? activeEnrollment.classesCompleted 
    : typeof subStatus?.usedSessions === 'number'
    ? subStatus.usedSessions
    : 0;
  const completedClasses = typeof rawCompletedClasses === 'number' && !isNaN(rawCompletedClasses) ? Math.max(0, rawCompletedClasses) : 0;
  
  const remainingClasses = typeof subStatus?.classesRemaining === 'number' 
    ? subStatus.classesRemaining 
    : Math.max(0, totalClasses - completedClasses);
    
  const rawExpDate = subStatus?.expiryDate || enrolledCourse?.expiryDate || activeEnrollment?.expiryDate;
  const expDateObj = rawExpDate ? new Date(rawExpDate) : null;
  const expiryDate = (expDateObj && !isNaN(expDateObj.getTime()))
    ? expDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : (hasEnrollmentData ? 'Ongoing Active Term' : 'No Active Plan');

  // =========================================================================
  // TARGETED FREE DEMO UX FLOW STAGE CALCULATIONS
  // =========================================================================
  const activePaidEnrollment = Array.isArray(enrollments) && enrollments.find(e => e?.status === 'active');
  const hasActivePaidEnrollment = !!activePaidEnrollment || 
    (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0 && subStatus?.hasActiveSubscription);
  const hasEverHadPaidEnrollment = (Array.isArray(enrollments) && enrollments.length > 0) || 
    (Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0);

  // Active trial booking or demo session
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

  // If student does not have an active paid enrollment, render the unified StudentDemoDashboard
  if (!hasActivePaidEnrollment) {
    return <StudentDemoDashboard />;
  }

  // Next upcoming or live class (Real data only - prioritize active live classes)
  const liveClass = Array.isArray(studentClasses)
    ? studentClasses.find((c) => c && c.status === 'live')
    : undefined;
  const scheduledClass = Array.isArray(studentClasses)
    ? studentClasses.find((c) => c && c.status === 'scheduled')
    : undefined;
  const nextClass: ClassSession | null = liveClass || scheduledClass || null;

  const nextClassDate = nextClass ? formatSessionDateIST(nextClass) : '';
  const nextClassTime = nextClass ? formatSessionTimeIST(nextClass) : '';

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mic': return <Mic className="w-5 h-5"/>;
      case 'Activity': return <Activity className="w-5 h-5"/>;
      case 'Music': return <Music className="w-5 h-5"/>;
      case 'Star': return <Star className="w-5 h-5"/>;
      case 'Award': return <Award className="w-5 h-5"/>;
      default: return <Play className="w-5 h-5"/>;
    }
  };

  const isStage1 = false;
  const isStage2 = false;
  const isStage3 = false;

  // =========================================================================
  // STAGE 1 — FREE DEMO SCHEDULED / UPCOMING VIEW
  // =========================================================================
  if (isStage1) {
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
  // STAGE 2 — FREE DEMO COMPLETED VIEW
  // =========================================================================
  if (isStage2) {
    return (
      <div className="space-y-6 pb-20 sm:pb-0 text-left max-w-4xl mx-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1:1 Diagnostic Demo Completed</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Your Free Demo is Complete 🎉
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Ready to continue your musical journey with Saremi Academy? Select your preferred course package to continue 1:1 mentorship with your Guru.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setIsEnrollOpen(true)}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold text-sm uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>Choose Your Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
                  {latestAssessment.recommendedPackage || '3-Month Conservatory Term (24 Classes)'}
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

        {/* Package Selection Options */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900">Choose Your Course Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACADEMY_PACKAGES.slice(0, 4).map((pkg) => (
              <Card key={pkg.id} variant="default" padding="lg" className="border border-gray-200 hover:border-amber-400 bg-white rounded-3xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-lg text-gray-900">{pkg.name}</span>
                    {pkg.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{pkg.tagline}</p>
                  <div className="font-serif font-bold text-2xl text-amber-700 mb-4">
                    ₹{pkg.priceINR.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-gray-500">/ (${pkg.priceUSD})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600 mb-6">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{pkg.totalClasses} Live 1:1 Sessions</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{pkg.classesPerWeek} Sessions / Week ({pkg.classDurationMins} Mins)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Retain Your Assigned Faculty Guru</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPackageId(pkg.id);
                    setIsEnrollOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Purchase Course</span>
                </button>
              </Card>
            ))}
          </div>
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
  }

  // =========================================================================
  // STAGE 3 — COURSE SELECTION / PURCHASE VIEW (Never Paid Student)
  // =========================================================================
  if (isStage3) {
    return (
      <div className="space-y-6 pb-20 sm:pb-0 text-left max-w-4xl mx-auto">
        <div className="bg-[#121829] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 inline-block">
              1:1 Classical Music Mentorship
            </span>
            <h1 className="font-serif text-3xl font-bold text-white">
              Choose Your Course
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Select a structured 1:1 mentorship package to start your regular classical music lessons with Saremi Academy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACADEMY_PACKAGES.map((pkg) => (
            <Card key={pkg.id} variant="default" padding="lg" className="border border-gray-200 hover:border-amber-400 bg-white rounded-3xl flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-lg text-gray-900">{pkg.name}</span>
                  {pkg.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      {pkg.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4">{pkg.tagline}</p>
                <div className="font-serif font-bold text-2xl text-amber-700 mb-4">
                  ₹{pkg.priceINR.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-gray-500">/ (${pkg.priceUSD})</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-600 mb-6">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pkg.totalClasses} Live 1:1 Sessions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pkg.classesPerWeek} Sessions / Week ({pkg.classDurationMins} Mins)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPackageId(pkg.id);
                  setIsEnrollOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Purchase Course</span>
              </button>
            </Card>
          ))}
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
  }

  return (
    <div className="space-y-8 pb-20 sm:pb-0 text-left">
      
      {/* 1. DASHBOARD OVERVIEW HEADER: GREETING & ENROLLMENT STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              You're enrolled in Saremi Academy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Active Conservatory Student
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Namaste, {String(studentName || 'Student').split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5">
            Your classical music mentorship portal, upcoming sessions & academic workspace.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-200 shadow-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-orange-800 text-xs sm:text-sm">7 Day Riyaz Streak</span>
          </div>

          <button
            onClick={handleOpenRenewal}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew Term</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/app/course')}
          className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 group-hover:text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Course</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="font-serif font-bold text-base text-gray-900 mt-2 line-clamp-1">
            {activeCourse}
          </h4>
          <span className="text-[11px] text-gray-500 mt-1 block">Level 1: Foundation</span>
        </div>

        <div 
          onClick={() => navigate('/app/classes')}
          className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 group-hover:text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Remaining Classes</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {remainingClasses} <span className="text-xs font-normal text-gray-400">/ {totalClasses}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">{completedClasses} Completed</span>
        </div>

        <div 
          onClick={() => navigate('/app/profile')}
          className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 group-hover:text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Mentor / Guru</span>
            <User className="w-4 h-4" />
          </div>
          <h4 className="font-serif font-bold text-base text-gray-900 mt-2 line-clamp-1">
            {teacherName}
          </h4>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">1:1 Assigned Faculty</span>
        </div>

        <div 
          onClick={() => navigate('/app/payments')}
          className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 group-hover:text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Package Status</span>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-gray-900 mt-2 flex items-center gap-2">
            <span>{expiryDate}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              subStatus.status === 'active' 
                ? 'bg-emerald-100 text-emerald-800' 
                : subStatus.status === 'expired' 
                ? 'bg-rose-100 text-rose-800'
                : subStatus.status === 'exhausted'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {subStatus.status.toUpperCase()}
            </span>
            {subStatus.hasActiveSubscription && typeof subStatus.daysUntilExpiry === 'number' && (
              <span className="text-[10px] text-gray-500 font-medium">
                ({subStatus.daysUntilExpiry} days left)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. ACTIVE COURSE HERO + NEXT CLASS LAUNCHER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Course Progress */}
        <div className="md:col-span-2">
          <Card variant="default" padding="lg" className="bg-[#121829] text-white border-none shadow-xl relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {currentPackage}
                </span>
                <span className="text-xs font-mono text-gray-300">
                  Assigned Guru: <strong className="text-amber-200">{teacherName}</strong>
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                {activeCourse}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mb-6">
                Active Module: Raag Yaman Bandish, Swar-sthana precision & Kharaj voice cultivation.
              </p>

              {/* Progress Bar & Class Metrics */}
              <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-300">
                    Sessions Completed: {completedClasses} / {totalClasses}
                  </span>
                  <span className="text-amber-400 font-mono">
                    {remainingClasses} Classes Remaining
                  </span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${totalClasses > 0 ? Math.min(100, Math.max(0, Math.round((completedClasses / totalClasses) * 100))) : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Enrolled: Foundation Term</span>
                  <span>Expires: {expiryDate}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {nextClass ? (
                  nextClass.status === 'live' ? (
                    <button
                      onClick={() => setActiveLiveClass(nextClass)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all animate-pulse"
                    >
                      <Video className="w-4 h-4" />
                      <span>🔴 Join Live Class Now</span>
                    </button>
                  ) : nextClass.status === 'scheduled' ? (
                    <button
                      onClick={() => setActiveLiveClass(nextClass)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Class</span>
                    </button>
                  ) : nextClass.status === 'completed' ? (
                    <button
                      disabled
                      className="px-6 py-3 rounded-xl bg-gray-500 text-gray-200 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-not-allowed opacity-75"
                    >
                      <span>Class Ended</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-3 rounded-xl bg-gray-500 text-gray-200 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-not-allowed opacity-75"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Class starts at {nextClassTime}</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => navigate('/app/classes')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>View Class Schedule</span>
                  </button>
                )}

                <button
                  onClick={() => navigate('/app/practice')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Open Tanpura Studio</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Live Class Action Card */}
        <div>
          {nextClass ? (
            <Card variant="default" padding="lg" className="border-2 border-amber-200 bg-amber-50/60 h-full flex flex-col justify-between rounded-3xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Next Class
                  </span>
                  <span className="text-xs font-bold text-amber-800">1:1 Live</span>
                </div>

                <h3 className="font-serif font-bold text-xl text-gray-900 mb-1">
                  {nextClass.courseTitle || 'Classical Music Mentorship'}
                </h3>
                <p className="text-xs text-gray-600 mb-4 font-medium line-clamp-2">
                  {nextClass.topic || 'Voice Foundation & Bandish Work'}
                </p>

                <div className="space-y-2 text-xs text-gray-700 bg-white p-3.5 rounded-2xl border border-amber-200/80 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-amber-600" />
                    <span className="font-bold">{nextClassDate} at {nextClassTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{nextClass.durationMinutes || 45} Minutes Session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Guru: {nextClass.teacherName || 'Assigned Faculty'}</span>
                  </div>
                </div>
              </div>

              {nextClass.status === 'live' || nextClass.status === 'scheduled' ? (
                (!nextClass.isTrial && !nextClass.trialId && (!subStatus.accessGranted || subStatus.isExpired)) ? (
                  <button
                    onClick={() => setIsRenewalOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Renew Package to Join</span>
                  </button>
                ) : nextClass.status === 'live' ? (
                  <button
                    onClick={() => setActiveLiveClass(nextClass)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Video className="w-4 h-4 text-white" />
                    <span>🔴 Join Live Class Now</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveLiveClass(nextClass)}
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>{nextClass.isTrial || nextClass.trialId ? 'Join 1:1 Diagnostic Trial' : 'Join Live Class'}</span>
                  </button>
                )
              ) : nextClass.status === 'completed' ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                >
                  <span>Class Ended</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                >
                  <Clock className="w-4 h-4 text-gray-200" />
                  <span>Class starts at {nextClassTime}</span>
                </button>
              )}
            </Card>
          ) : (
            <Card variant="default" padding="lg" className="border-2 border-gray-200 bg-white h-full flex flex-col justify-between rounded-3xl text-center p-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 mb-2 inline-block">
                  No Active Schedule
                </span>
                <h3 className="font-serif font-bold text-lg text-gray-900 mb-1">
                  No Upcoming Classes
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  You do not have any live 1:1 classes scheduled right now. Check your classes tab to view past sessions or plan upcoming classes.
                </p>
              </div>

              <button
                onClick={() => navigate('/app/classes')}
                className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span>Go to My Classes</span>
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* POST-CLASS ACADEMIC WORKSPACE: HOMEWORK, TEACHER AUDIO, PRACTICE RECORDINGS, FEEDBACK & CHAT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Post-Class Academic Workspace</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-900">
              Riyaz & Class Studio
            </h2>
            <p className="text-xs text-gray-500">
              Homework tasks, Guru audio demonstrations, practice uploads, feedback reviews, and 1:1 academic chat.
            </p>
          </div>

          <button
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                discipline: activeCourse,
                date: 'Current Term',
                time: '18:00',
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('overview');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-4 h-4" />
            <span>Open Academic Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Core Post-Class Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Homework */}
          <div
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('homework');
            }}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-amber-800">Homework</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Assigned exercises & Riyaaz schedules</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-amber-700 flex items-center gap-1">
              View Tasks <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 2. Teacher Audio */}
          <div
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('practice');
            }}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-purple-800">Teacher Audio</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Guru demonstrations & Tanpura pitch</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-purple-700 flex items-center gap-1">
              Play Demos <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 3. Practice Upload */}
          <div
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('practice');
            }}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-emerald-800">Practice Upload</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Record vocal audio or upload clips</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              Submit Riyaaz <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 4. Feedback & Redo */}
          <div
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('overview');
            }}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-800">Guru Feedback</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Grades, critiques & redo requests</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-indigo-700 flex items-center gap-1">
              Review Notes <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 5. 1:1 Class Chat */}
          <div
            onClick={() => {
              const target = studentClasses.find(c => c.status === 'completed' || c.status === 'scheduled') || studentClasses[0] || nextClass;
              setAcademicWorkspaceSession(target || ({
                id: 'active_session',
                studentId: user?.uid,
                studentName: studentName,
                teacherId: enrolledCourse?.teacherId || '',
                teacherName: teacherName,
                courseTitle: activeCourse,
                status: 'completed'
              } as any));
              setAcademicWorkspaceInitialTab('chat');
            }}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-rose-800">Class Chat</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Direct messaging with your Guru</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-rose-700 flex items-center gap-1">
              Open Chat <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 6. Academic Resources */}
          <div
            onClick={() => navigate('/app/resources')}
            className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 group-hover:text-teal-800">Resources</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Bandish notations & Tanpura drone</p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-teal-700 flex items-center gap-1">
              Explore Library <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
      {latestAssessment && (
        <Card variant="default" padding="lg" className="border-2 border-indigo-100 bg-indigo-50/40 rounded-3xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  Guru Diagnostic Trial Assessment Report
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Conducted by {latestAssessment.teacherName || 'Faculty Guru'} for {latestAssessment.courseName || 'Course Assessment'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Diagnostic Score:</span>
              <span className="font-serif font-black text-2xl text-indigo-700 bg-white px-3 py-1 rounded-xl shadow-sm border border-indigo-200">
                {latestAssessment.overallScore ?? 8}/10
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
            "{latestAssessment.teacherFeedback || 'Evaluation and diagnostic guidance completed.'}"
          </div>

          {/* GURU COURSE & PROGRAM RECOMMENDATION CALLOUT */}
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50/70 p-5 rounded-2xl border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
                  Recommended Course & Program
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Track: {latestAssessment.recommendedLevel || 'Foundation Classical Term'}
                </span>
              </div>
              <h4 className="font-serif font-bold text-base text-gray-900">
                {latestAssessment.recommendedPackage || latestAssessment.recommendedPackageName || '3-Month Level Certification Term (24 Classes)'}
              </h4>
              <p className="text-xs text-gray-600 max-w-xl">
                {latestAssessment.guruRecommendation || 'Based on your diagnostic trial vocal report, your Guru recommends starting structured 1:1 lessons twice a week with personalized Riyaaz exercises.'}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPackageId(latestAssessment.recommendedPackageId || 'pkg-3month-term');
                setIsEnrollOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Select Package & Enroll</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* 5. SYLLABUS ROADMAP & PRACTICE TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl font-bold text-gray-900">Pedagogical Roadmap</h3>
              <button 
                onClick={() => navigate('/app/course')}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                Full Syllabus <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-[32px] p-6 border-2 border-gray-100 shadow-sm overflow-x-auto hide-scrollbar">
              <div className="flex items-center min-w-max gap-4 px-4 py-8 relative">
                <div className="absolute top-1/2 left-8 right-8 h-2 bg-gray-100 -translate-y-1/2 rounded-full z-0" />
                <div className="absolute top-1/2 left-8 w-[45%] h-2 bg-emerald-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000" />

                {curriculum.map((node, idx) => {
                  const isNodeLocked = node.status === 'locked';
                  let colorClass = 'bg-gray-100 text-gray-400 border-gray-200';
                  if (node.status === 'completed') colorClass = 'bg-emerald-500 text-white border-emerald-600';
                  if (node.status === 'current') colorClass = 'bg-white text-amber-600 border-amber-500 border-4 shadow-lg scale-110';
                  
                  return (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${colorClass} transition-all duration-300`}>
                        {isNodeLocked && node.status !== 'completed' ? <Lock className="w-5 h-5" /> : getIcon(node.icon)}
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${node.status === 'current' ? 'text-gray-900' : 'text-gray-500'}`}>
                        {node.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">Practice Studio Quick Launch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="interactive" padding="md" className="bg-amber-50/50 border-amber-100 flex flex-col justify-between" onClick={() => navigate('/app/practice')}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      <Music className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-amber-900">Tanpura Drone</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Acoustic Tanpura Studio</h4>
                  <p className="text-sm text-gray-600 font-medium">12 Tonic Keys • Sa-Pa / Sa-Ma</p>
                </div>
                <div className="mt-4 text-xs font-bold text-amber-700 flex items-center gap-1">
                  Launch Tanpura <ArrowRight className="w-3 h-3" />
                </div>
              </Card>

              <Card variant="interactive" padding="md" className="bg-emerald-50/50 border-emerald-100 flex flex-col justify-between" onClick={() => navigate('/app/practice')}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-emerald-900">Taal Metronome</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Laya & Taal Tracker</h4>
                  <p className="text-sm text-gray-600 font-medium">Teentaal, Keherwa, Dadra & Rupak</p>
                </div>
                <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  Start Metronome <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card variant="default" padding="md" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" alt="Guru" className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover" />
                <div>
                  <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Latest Guru Review</div>
                  <div className="font-bold text-sm">Vidushi Sunanda Sharma</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-xs text-gray-200 font-medium leading-relaxed italic">
                  "Your pitch holding in Mandra Saptak (lower octave) has stabilized remarkably well. Keep regular 20 mins morning Kharaj riyaaz."
                </p>
              </div>
              <button 
                onClick={() => navigate('/app/resources')}
                className="w-full mt-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                View Riyaz Tasks & Notes
              </button>
            </div>
          </Card>

          <Card variant="default" padding="md" className="border-2 border-gray-100 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Discipline Badges</h3>
              <span className="text-xs font-bold text-amber-600">4 Earned</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square bg-orange-50 rounded-[20px] border-2 border-orange-200 flex flex-col items-center justify-center text-center p-2">
                <Flame className="w-6 h-6 text-orange-500 mb-1" />
                <span className="text-[10px] font-bold text-orange-800 leading-tight">7 Day<br/>Streak</span>
              </div>
              <div className="aspect-square bg-purple-50 rounded-[20px] border-2 border-purple-200 flex flex-col items-center justify-center text-center p-2">
                <Play className="w-6 h-6 text-purple-500 mb-1 fill-current" />
                <span className="text-[10px] font-bold text-purple-800 leading-tight">First<br/>Lesson</span>
              </div>
              <div className="aspect-square bg-blue-50 rounded-[20px] border-2 border-blue-200 flex flex-col items-center justify-center text-center p-2">
                <Mic className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-[10px] font-bold text-blue-800 leading-tight">First<br/>Riyaz</span>
              </div>
              <div className="aspect-square bg-pink-50 rounded-[20px] border-2 border-pink-200 flex flex-col items-center justify-center text-center p-2">
                <Star className="w-6 h-6 text-pink-500 mb-1 fill-current" />
                <span className="text-[10px] font-bold text-pink-800 leading-tight">Raag<br/>Explorer</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* LIVE CLASSROOM MODAL */}
      {activeLiveClass && (
        <LiveClassroomModal
          session={activeLiveClass}
          currentUser={
            profile
              ? { ...profile, uid: user?.uid || profile.uid || profile.id }
              : ({
                  uid: user?.uid,
                  email: user?.email || '',
                  name: user?.displayName || 'Student Learner',
                  role: 'student'
                } as any)
          }
          role="student"
          subscriptionStatus={subStatus}
          onClose={() => setActiveLiveClass(null)}
        />
      )}

      {/* SUBSCRIPTION RENEWAL MODAL */}
      {isRenewalOpen && (
        <CourseEnrollmentModal
          isOpen={isRenewalOpen}
          isRenewal={true}
          existingEnrollment={profile?.enrolledCourses?.[0]}
          onClose={() => setIsRenewalOpen(false)}
          onSuccess={() => {
            setIsRenewalOpen(false);
            if (refreshProfile) refreshProfile();
          }}
        />
      )}

      {/* NEW COURSE ENROLLMENT / TRIAL RECOMMENDATION CHECKOUT */}
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

      {/* POST-CLASS ACADEMIC WORKSPACE MODAL */}
      {academicWorkspaceSession && (
        <AcademicSessionModal
          session={academicWorkspaceSession}
          initialTab={academicWorkspaceInitialTab}
          onClose={() => setAcademicWorkspaceSession(null)}
        />
      )}
    </div>
  );
};
