import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Music, 
  Target, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Lock, 
  Check, 
  RefreshCw,
  Layers,
  Calendar,
  Filter
} from 'lucide-react';
import { UserProfile, StudentSubscriptionStatus, ClassSession } from '../../types';
import { useRouter } from '../../router/RouterContext';
import { ExpiredAccessLock } from '../common/ExpiredAccessLock';
import { 
  subscribeToStudentSyllabusSummary, 
  subscribeToStudentCompletedSessions,
  SyllabusProgressSummary 
} from '../../lib/academicPostClassService';
import { triggerHaptic } from '../../utils/haptics';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface StudentCourseTabProps {
  profile: UserProfile | null;
  subscriptionStatus?: StudentSubscriptionStatus;
  onRenew?: () => void;
}

export const StudentCourseTab: React.FC<StudentCourseTabProps> = ({ profile, subscriptionStatus, onRenew }) => {
  const { navigate } = useRouter();
  const [expandedPillar, setExpandedPillar] = useState<number | null>(0);
  const [topicFilter, setTopicFilter] = useState<'all' | 'completed' | 'in_progress' | 'remaining'>('all');
  
  const [syllabusSummary, setSyllabusSummary] = useState<SyllabusProgressSummary | null>(null);
  const [completedSessions, setCompletedSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const enrolledCourse = Array.isArray(profile?.enrolledCourses) ? profile?.enrolledCourses[0] : undefined;
  const courseTitle = enrolledCourse?.courseTitle || subscriptionStatus?.packageDetails?.courseTitle || 'Hindustani Classical Vocal Conservatory';
  const packageName = enrolledCourse?.packageName || subscriptionStatus?.packageDetails?.packageName || '3-Month Level Certification Term';
  const teacherName = enrolledCourse?.teacherName || subscriptionStatus?.packageDetails?.teacherName || (profile as any)?.assignedTeacher || 'Assigned Faculty Guru';

  const rawTotal = enrolledCourse?.totalSessions ?? subscriptionStatus?.totalSessions ?? 24;
  const totalSessions = typeof rawTotal === 'number' && rawTotal > 0 ? rawTotal : 24;

  const rawCompleted = typeof enrolledCourse?.sessionsCompleted === 'number'
    ? enrolledCourse.sessionsCompleted
    : typeof subscriptionStatus?.usedSessions === 'number'
    ? subscriptionStatus.usedSessions
    : completedSessions.length;
  const sessionsCompleted = typeof rawCompleted === 'number' && !isNaN(rawCompleted) ? Math.max(0, rawCompleted) : completedSessions.length;

  const sessionsRemaining = typeof subscriptionStatus?.classesRemaining === 'number'
    ? subscriptionStatus.classesRemaining
    : Math.max(0, totalSessions - sessionsCompleted);

  // Subscribe to real syllabus progress
  useEffect(() => {
    if (!profile?.id) return;
    setIsLoading(true);

    const unsubSyllabus = subscribeToStudentSyllabusSummary(
      profile.id,
      courseTitle,
      enrolledCourse?.enrollmentId,
      (summary) => {
        setSyllabusSummary(summary);
        setIsLoading(false);
      }
    );

    const unsubSessions = subscribeToStudentCompletedSessions(
      profile.id,
      enrolledCourse?.enrollmentId,
      (sessions) => {
        setCompletedSessions(sessions);
      }
    );

    return () => {
      unsubSyllabus();
      unsubSessions();
    };
  }, [profile?.id, courseTitle, enrolledCourse?.enrollmentId]);

  const progressPercentage = syllabusSummary?.percentageCompleted ?? (
    totalSessions > 0 ? Math.min(100, Math.max(0, Math.round((sessionsCompleted / totalSessions) * 100))) : 0
  );

  const hasEverHadPaidEnrollment = Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0;
  const isAccessLocked = subscriptionStatus?.isExpired && hasEverHadPaidEnrollment;

  // Swipe gesture handler to expand next/previous curriculum pillar module
  const moduleSwipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (expandedPillar === null) {
        setExpandedPillar(0);
        triggerHaptic('selection');
      } else if (expandedPillar < pillars.length - 1) {
        setExpandedPillar(expandedPillar + 1);
        triggerHaptic('selection');
      }
    },
    onSwipeRight: () => {
      if (expandedPillar !== null && expandedPillar > 0) {
        setExpandedPillar(expandedPillar - 1);
        triggerHaptic('selection');
      }
    },
    minDistance: 50
  });

  const pillars = syllabusSummary?.pillars || [];
  const completedCount = syllabusSummary?.completedTopicsCount ?? 0;
  const inProgressCount = syllabusSummary?.inProgressTopicsCount ?? 0;
  const remainingCount = syllabusSummary?.remainingTopicsCount ?? 0;
  const totalTopics = syllabusSummary?.totalTopics ?? 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#121829] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                Gandharva Mahavidyalaya Aligned
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 text-xs font-mono">
                Level 1 : Foundation
              </span>
            </div>
            
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {courseTitle}
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Enrolled Term: <strong className="text-amber-200">{packageName}</strong> • Lead Mentor:{' '}
              <strong className="text-amber-200">{teacherName}</strong>
            </p>
          </div>

          <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md min-w-[200px] text-center md:text-right space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Class Completion</span>
            <div className={`font-serif text-3xl font-black ${isAccessLocked ? 'text-rose-400' : 'text-amber-400'}`}>
              {sessionsCompleted} <span className="text-lg text-gray-400 font-normal">/ {totalSessions}</span>
            </div>
            <span className={`text-xs font-mono font-bold block ${isAccessLocked ? 'text-rose-300' : 'text-emerald-300'}`}>
              {sessionsRemaining} Classes Remaining
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-300">Authoritative Syllabus Progression</span>
            <span className="text-amber-400 font-mono">{progressPercentage}% Complete ({completedCount}/{totalTopics} topics)</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Curriculum & Modular Syllabus Roadmap */}
      {isAccessLocked ? (
        <ExpiredAccessLock
          subscriptionStatus={subscriptionStatus}
          resourceName="Detailed Course Curriculum & Modules"
          onRenew={onRenew}
        />
      ) : (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Syllabus Tracking & Modular Progression
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Authoritative curriculum verified and updated live by your assigned faculty mentor after each class session.
            </p>
          </div>

          {/* Filter Pills for Completed / In Progress / Remaining */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setTopicFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                topicFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Topics ({totalTopics})
            </button>
            <button
              onClick={() => setTopicFilter('completed')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                topicFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setTopicFilter('in_progress')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                topicFilter === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Clock className="w-3 h-3" />
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setTopicFilter('remaining')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                topicFilter === 'remaining'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Remaining ({remainingCount})
            </button>
          </div>
        </div>

        {/* Pillars / Modules Accordion with Touch Swipe Navigation */}
        <div 
          onTouchStart={moduleSwipeHandlers.onTouchStart}
          onTouchEnd={moduleSwipeHandlers.onTouchEnd}
          className="space-y-4 touch-pan-y"
        >
          {pillars.map((pillar, pIdx) => {
            const isExpanded = expandedPillar === pIdx;
            const pCompleted = pillar.topics.filter((t) => t.status === 'completed').length;
            const isAllCompleted = pCompleted === pillar.topics.length && pillar.topics.length > 0;
            const hasInProgress = pillar.topics.some((t) => t.status === 'in_progress');

            // Apply filter
            const filteredTopics = pillar.topics.filter((t) => {
              if (topicFilter === 'all') return true;
              if (topicFilter === 'completed') return t.status === 'completed';
              if (topicFilter === 'in_progress') return t.status === 'in_progress' || t.status === 'revision' || t.status === 'practice_required';
              if (topicFilter === 'remaining') return t.status === 'not_started' || !t.status;
              return true;
            });

            if (filteredTopics.length === 0 && topicFilter !== 'all') {
              return null;
            }

            return (
              <div
                key={pIdx}
                className={`rounded-2xl border transition-all ${
                  hasInProgress
                    ? 'border-amber-300 bg-amber-50/30 shadow-2xs'
                    : isAllCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div
                  onClick={() => setExpandedPillar(isExpanded ? null : pIdx)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isAllCompleted
                        ? 'bg-emerald-500 text-white'
                        : hasInProgress
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isAllCompleted ? <CheckCircle2 className="w-5 h-5" /> : (pIdx + 1)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900">{pillar.pillarTitle}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAllCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : hasInProgress
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isAllCompleted ? 'Mastered' : hasInProgress ? 'Active Focus' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {pCompleted} of {pillar.topics.length} topics validated
                      </p>
                    </div>
                  </div>

                  <button className="text-gray-400 hover:text-gray-700">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-3"
                  >
                    <strong className="text-xs font-bold text-gray-700 block mb-2">Curriculum Topics & Validation Status:</strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredTopics.map((topic, tIdx) => {
                        const isComp = topic.status === 'completed';
                        const isInProg = topic.status === 'in_progress';
                        const isRev = topic.status === 'revision' || topic.status === 'practice_required';

                        return (
                          <div
                            key={tIdx}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                              isComp
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : isInProg
                                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                                : isRev
                                ? 'bg-purple-50/60 border-purple-200 text-purple-950'
                                : 'bg-white border-gray-200 text-gray-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                {isComp ? (
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : isInProg ? (
                                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                                )}
                                <div>
                                  <span className="font-semibold block leading-snug">{topic.topic}</span>
                                  {topic.notes && (
                                    <p className="text-[11px] text-gray-500 mt-1 italic">"{topic.notes}"</p>
                                  )}
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                isComp
                                  ? 'bg-emerald-200/80 text-emerald-900'
                                  : isInProg
                                  ? 'bg-amber-200/80 text-amber-900'
                                  : isRev
                                  ? 'bg-purple-200/80 text-purple-900'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {isComp ? 'Completed' : isInProg ? 'In Progress' : isRev ? 'Revision' : 'Remaining'}
                              </span>
                            </div>

                            {topic.completedDate && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-1 border-t border-emerald-200/40">
                                <Calendar className="w-3 h-3" />
                                <span>Completed on {topic.completedDate}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
