import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  FileText, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  Lock,
  BookOpen,
  Music,
  MessageSquare,
  Check,
  RotateCcw
} from 'lucide-react';
import { ClassSession, UserProfile, StudentSubscriptionStatus, TrialBookingRecord } from '../../types';
import { formatSessionDateIST, formatSessionTimeIST } from '../../lib/sessionService';
import { LiveClassroomModal } from '../classroom/LiveClassroomModal';
import { AcademicSessionModal } from './AcademicSessionModal';
import { SaremiCard, SaremiButton, SaremiBadge, SaremiEmptyState } from '../common/SaremiUI';
import { ExpiredAccessLock } from '../common/ExpiredAccessLock';
import { useRouter } from '../../router/RouterContext';
import { subscribeToStudentTrialBookings, confirmTrialBookingSlot, requestTrialReschedule } from '../../lib/courseCrmService';
import { triggerHaptic } from '../../utils/haptics';

const ACADEMY_WHATSAPP_NUMBER = '918591174823';

interface StudentClassesTabProps {
  profile: UserProfile | null;
  classes?: ClassSession[];
  subscriptionStatus?: StudentSubscriptionStatus;
  onRenew?: () => void;
}

export const StudentClassesTab: React.FC<StudentClassesTabProps> = ({ 
  profile, 
  classes = [],
  subscriptionStatus,
  onRenew 
}) => {
  const { navigate } = useRouter();
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'cancelled' | 'missed' | 'rescheduled'>('upcoming');
  const [activeLiveClass, setActiveLiveClass] = useState<ClassSession | null>(null);
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<ClassSession | null>(null);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [trialBookings, setTrialBookings] = useState<TrialBookingRecord[]>([]);
  const [isConfirmingTrial, setIsConfirmingTrial] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id && !profile?.email) return;
    const unsub = subscribeToStudentTrialBookings(
      profile?.id || '',
      profile?.email || '',
      (trials) => {
        setTrialBookings(trials);
      }
    );
    return () => unsub();
  }, [profile?.id, profile?.email]);

  const hasEverHadPaidEnrollment = Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0;
  const isAccessLocked = subscriptionStatus?.isExpired && hasEverHadPaidEnrollment;

  const allClasses: ClassSession[] = Array.isArray(classes) ? classes : [];

  const filteredClasses = allClasses.filter((c) => {
    const s = c.status as string;
    const a = (c.attendanceStatus || '') as string;
    if (filter === 'upcoming') {
      return s === 'scheduled' || s === 'live';
    }
    if (filter === 'completed') {
      return s === 'completed' || a === 'Present' || c.attendanceRecorded;
    }
    if (filter === 'cancelled') {
      return s === 'cancelled';
    }
    if (filter === 'missed') {
      return s === 'missed' || s === 'absent' || a === 'Absent' || a === 'Missed';
    }
    if (filter === 'rescheduled') {
      return s === 'rescheduled' || a === 'Rescheduled' || a === 'Excused';
    }
    return true;
  });

  const upcomingCount = allClasses.filter((c) => (c.status as string) === 'scheduled' || (c.status as string) === 'live').length;
  const completedCount = allClasses.filter((c) => (c.status as string) === 'completed' || (c.attendanceStatus as string) === 'Present' || c.attendanceRecorded).length;
  const cancelledCount = allClasses.filter((c) => (c.status as string) === 'cancelled').length;
  const missedCount = allClasses.filter((c) => {
    const s = c.status as string;
    const a = (c.attendanceStatus || '') as string;
    return s === 'missed' || s === 'absent' || a === 'Absent' || a === 'Missed';
  }).length;
  const rescheduledCount = allClasses.filter((c) => {
    const s = c.status as string;
    const a = (c.attendanceStatus || '') as string;
    return s === 'rescheduled' || a === 'Rescheduled' || a === 'Excused';
  }).length;

  const activeTrials = trialBookings.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );

  const handleConfirmTrial = async (trial: TrialBookingRecord) => {
    triggerHaptic('medium');
    setIsConfirmingTrial(trial.id);
    try {
      await confirmTrialBookingSlot({
        bookingId: trial.id,
        confirmedBy: profile?.name || profile?.id || 'Student'
      });
      triggerHaptic('success');
    } catch (e) {
      console.error('Failed to confirm trial slot:', e);
      triggerHaptic('warning');
    } finally {
      setIsConfirmingTrial(null);
    }
  };

  const handleLaunchTrialClassroom = (trial: TrialBookingRecord) => {
    triggerHaptic('heavy');
    const trialSession: ClassSession = {
      id: (trial as any).sessionId || `trial_sess_${trial.id}`,
      courseId: trial.courseId || 'singing',
      courseTitle: trial.courseName || 'Free Demo Diagnostic Session',
      teacherId: trial.teacherId || 'faculty_mentor',
      teacherName: trial.teacherName || 'Faculty Maestro',
      studentId: trial.studentId || profile?.id || 'trial_student',
      studentName: trial.studentName || profile?.name || 'Student',
      scheduledAt: `${trial.proposedDate || trial.date || 'TBD'} ${trial.proposedStartTime || (trial as any).proposedTime || trial.time || '18:00 IST'}`,
      durationMinutes: 30,
      status: 'scheduled',
      meetingUrl: trial.roomId || `saremi_trial_${trial.id}`,
      isTrial: true,
      trialId: trial.id
    };
    setActiveLiveClass(trialSession);
  };

  const getRescheduleWhatsAppUrl = (trial: TrialBookingRecord) => {
    const text = `Hi Saremi Academy! 👋\n\nI would like to reschedule my Free Demo Class.\n\n*Booking ID:* ${trial.id}\n*Student:* ${trial.studentName}\n*Discipline:* ${trial.courseName}\n*Current Slot:* ${trial.proposedDate || trial.date} at ${trial.proposedStartTime || (trial as any).proposedTime || trial.time}\n\nPlease let me know alternative timings. Thank you! 🎵`;
    return `https://wa.me/${ACADEMY_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const handleClassAction = (cls: ClassSession) => {
    triggerHaptic('heavy');
    if (cls.status === 'completed' || cls.attendanceRecorded) {
      // Completed history: Open Academic Wrap-Up modal
      setSelectedAcademicSession(cls);
      return;
    }

    if (cls.status === 'cancelled') {
      return;
    }

    // Explicitly scheduled or live classes are always directly accessible
    setActiveLiveClass(cls);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Book Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
            1:1 Mentorship Schedule
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">My Classes</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Your live 1:1 video classes, completed lesson history, and guru notes.
          </p>
        </div>

        {isAccessLocked ? (
          <button
            onClick={onRenew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Package</span>
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic('medium');
              navigate('/booking');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Book Class Slot</span>
          </button>
        )}
      </div>

      {/* Lock banner for upcoming live classes if expired */}
      {isAccessLocked && filter === 'upcoming' && (
        <ExpiredAccessLock
          subscriptionStatus={subscriptionStatus}
          resourceName="Live 1:1 Classroom & Studio Sessions"
          onRenew={onRenew}
        />
      )}

      {/* Active Free Demo / Diagnostic Trials Section */}
      {activeTrials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wider">
              Free Demo & Diagnostic Mentorship
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeTrials.map((trial) => {
              const isProposed = trial.status === 'slot_proposed' || trial.assignmentStatus === 'slot_proposed';
              const isConfirmed = trial.status === 'confirmed' || trial.status === 'scheduled';
              const isReschedule = trial.status === 'reschedule_requested' || trial.rescheduleRequested;
              const isConfirming = isConfirmingTrial === trial.id;

              return (
                <motion.div
                  key={trial.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-[#FFFDF9] to-[#FBF7EE] border-2 border-[#E8DCC4] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCC4]/60">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0F0F0F] text-[#D8A84A]">
                          1:1 Free Demo Trial
                        </span>
                        {isConfirmed && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed & Scheduled
                          </span>
                        )}
                        {isProposed && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Slot Proposed — Awaiting Your Confirmation
                          </span>
                        )}
                        {isReschedule && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            Reschedule Coordination in Progress
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-lg text-gray-900 mt-1">
                        {trial.courseName || 'Music Performance Demo'}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-gray-900 flex items-center sm:justify-end gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                        <span>{trial.proposedDate || trial.date || 'To be scheduled'}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 font-mono">
                        {trial.proposedTime || trial.time || 'Flexible IST'}
                      </div>
                    </div>
                  </div>

                  {/* Mentor details and studio readiness */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#E8DCC4]">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Assigned Faculty</div>
                        <div className="font-bold text-gray-900">{trial.teacherName || 'Faculty Mentor (Assignment in Progress)'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#E8DCC4]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Live Classroom</div>
                        <div className="font-bold text-emerald-800">Agora 1:1 Live Acoustic Studio</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={getRescheduleWhatsAppUrl(trial)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>Reschedule on WhatsApp</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      {isProposed && (
                        <button
                          onClick={() => handleConfirmTrial(trial)}
                          disabled={isConfirming}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D8A84A] hover:bg-[#c9993d] text-[#0F0F0F] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 text-[#0F0F0F]" />
                          <span>{isConfirming ? 'Confirming...' : 'Confirm This Slot'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleLaunchTrialClassroom(trial)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>Enter Demo Studio</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-2xl overflow-x-auto hide-scrollbar gap-1">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filter === 'upcoming'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filter === 'completed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filter === 'cancelled'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
        <button
          onClick={() => setFilter('missed')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filter === 'missed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Missed ({missedCount})
        </button>
        <button
          onClick={() => setFilter('rescheduled')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filter === 'rescheduled'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Rescheduled ({rescheduledCount})
        </button>
      </div>

      {/* Class List */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-gray-200 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              <CalendarIcon className="w-7 h-7 text-amber-600" />
            </div>
            <h4 className="font-serif font-bold text-xl text-gray-900 mb-1 capitalize">
              No {filter} classes found
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
              {filter === 'upcoming' 
                ? 'You have no scheduled sessions at the moment. Pick an available slot with your Guru to continue your training.'
                : filter === 'completed'
                ? 'Your attended sessions, teacher lesson notes, and recording references will appear here once conducted.'
                : filter === 'cancelled'
                ? 'You have no cancelled class records.'
                : filter === 'missed'
                ? 'Great attendance record! You have not missed any scheduled classes.'
                : 'You have no rescheduled classes.'}
            </p>
            {filter === 'upcoming' && !isAccessLocked && (
              <button
                onClick={() => navigate('/booking')}
                className="px-6 py-2.5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Book Class Slot</span>
              </button>
            )}
          </div>
        ) : (
          filteredClasses.map((cls, idx) => {
            const isLive = cls.status === 'live';
            const isUpcoming = cls.status === 'scheduled' || isLive;
            const isTrial = Boolean(cls.isTrial || cls.trialId || cls.id?.startsWith('cls_trial'));
            // Explicitly scheduled classes are already authorized for the student to attend
            const isSessionLocked = false;
            const classDate = formatSessionDateIST(cls);
            const classTime = formatSessionTimeIST(cls);
            const classTopic = cls.topic || cls.courseTitle || '1:1 Classical Music Mentorship Session';
            const teacherName = cls.teacherName || 'Assigned Guru';
            const sessionNum = cls.sessionNumber ?? (idx + 1);
            const totalSess = cls.totalSessions ?? (subscriptionStatus?.totalClasses || 24);
            const s = cls.status as string;
            const a = (cls.attendanceStatus || '') as string;
            const isMissed = s === 'missed' || s === 'absent' || a === 'Absent' || a === 'Missed';
            const isRescheduled = s === 'rescheduled' || a === 'Rescheduled' || a === 'Excused';
            const isCancelled = s === 'cancelled';
            const isCompleted = s === 'completed' || a === 'Present';

            return (
              <motion.div
                key={cls.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                  isSessionLocked ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200/90'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSessionLocked
                      ? 'bg-amber-100 text-amber-800'
                      : isLive 
                      ? 'bg-red-50 text-red-600 ring-2 ring-red-400 animate-pulse' 
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : isMissed
                      ? 'bg-rose-50 text-rose-700'
                      : isRescheduled
                      ? 'bg-orange-50 text-orange-700'
                      : isCancelled
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isSessionLocked ? (
                      <Lock className="w-7 h-7 text-amber-700" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : isMissed ? (
                      <AlertCircle className="w-7 h-7 text-rose-600" />
                    ) : isRescheduled ? (
                      <RefreshCw className="w-7 h-7 text-orange-600" />
                    ) : isCancelled ? (
                      <XCircle className="w-7 h-7" />
                    ) : (
                      <Video className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSessionLocked
                          ? 'bg-rose-100 text-rose-800'
                          : isLive
                          ? 'bg-red-500 text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isMissed
                          ? 'bg-rose-100 text-rose-800'
                          : isRescheduled
                          ? 'bg-orange-100 text-orange-800'
                          : isCancelled
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isSessionLocked
                          ? '🔒 Access Locked'
                          : isLive
                          ? '🔴 Live Now'
                          : isCompleted
                          ? 'Completed'
                          : isMissed
                          ? 'Missed'
                          : isRescheduled
                          ? 'Rescheduled'
                          : isCancelled
                          ? 'Cancelled'
                          : 'Upcoming'}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        Session #{sessionNum} of {totalSess}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-gray-900 leading-snug">
                      {classTopic}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-600 font-medium">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                        <strong className="text-gray-900">{classDate}</strong> at {classTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {cls.durationMinutes || 45} mins
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Guru: <strong className="text-gray-900">{teacherName}</strong>
                      </span>
                    </div>

                    {cls.rescheduleReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 leading-relaxed">
                        <strong className="text-purple-900 block mb-0.5 font-bold">Reschedule Update:</strong>
                        {cls.rescheduleReason}
                      </div>
                    )}

                    {cls.cancellationReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
                        <strong className="text-rose-900 block mb-0.5 font-bold">Cancellation Reason:</strong>
                        {cls.cancellationReason}
                      </div>
                    )}

                    {cls.whatWasTaught && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                        <strong className="text-amber-900 block mb-0.5 font-bold flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-amber-700" />
                          What Was Taught:
                        </strong>
                        {cls.whatWasTaught}
                      </div>
                    )}

                    {cls.teacherNotes && (
                      <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                        <strong className="text-gray-900 block mb-0.5">Guru's Session Notes:</strong>
                        {cls.teacherNotes}
                      </div>
                    )}
                    {cls.homeworkAssigned && (
                      <div className="mt-1 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50 text-xs text-amber-900 leading-relaxed">
                        <strong className="text-amber-900 block mb-0.5">Practice Assignment:</strong>
                        {cls.homeworkAssigned}
                      </div>
                    )}
                    {cls.status === 'completed' && cls.attendanceStatus && (
                      <div className="mt-1 flex gap-2">
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                          Attendance: {cls.attendanceStatus}
                        </span>
                        {cls.actualDurationMinutes !== undefined && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                            Class Duration: {cls.actualDurationMinutes} mins
                          </span>
                        )}
                        {cls.studentAttendanceDurationMinutes !== undefined && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                            You Attended: {cls.studentAttendanceDurationMinutes} mins
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-auto shrink-0 flex items-center gap-2">
                  {isCompleted ? (
                    <button
                      onClick={() => setSelectedAcademicSession(cls)}
                      className="w-full lg:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>View Academic Record</span>
                    </button>
                  ) : isUpcoming ? (
                    isSessionLocked ? (
                      <button
                        onClick={onRenew}
                        className="w-full lg:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Renew Package</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClassAction(cls)}
                        className={`w-full lg:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                          isLive
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-900 hover:bg-black text-white'
                        }`}
                      >
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>{isLive ? 'Join Live Class' : isTrial ? 'Join 1:1 Diagnostic Trial' : 'Enter Class Studio'}</span>
                      </button>
                    )
                  ) : null}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Live Classroom Modal */}
      {activeLiveClass && (
        <LiveClassroomModal
          session={activeLiveClass}
          currentUser={profile}
          role="student"
          subscriptionStatus={subscriptionStatus}
          onClose={() => setActiveLiveClass(null)}
          onRenew={onRenew}
        />
      )}

      {/* Academic Wrap-Up Modal for Completed History */}
      {selectedAcademicSession && (
        <AcademicSessionModal
          session={selectedAcademicSession}
          onClose={() => setSelectedAcademicSession(null)}
        />
      )}
    </div>
  );
};

