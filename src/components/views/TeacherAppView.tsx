import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../lib/dashboardService';
import { ClassSession, Assignment } from '../../types';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Mic,
  Music,
  Plus,
  Star,
  Upload,
  UserCheck,
  Users,
  Video,
  FileText,
  ChevronRight,
  TrendingUp,
  Activity,
  LogOut,
  ShieldAlert,
  Lock,
  ClipboardList,
  BookOpen,
  Award,
  Check,
  Play,
  X,
  Bell,
  Smartphone,
  Phone,
  CalendarCheck,
  CalendarX,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { SaremiCard, SaremiButton, SaremiBadge, SaremiEmptyState } from '../common/SaremiUI';
import { PostClassModal } from '../teacher/PostClassModal';
import { LiveClassroomModal } from '../classroom/LiveClassroomModal';
import { AcademicSessionModal } from '../student/AcademicSessionModal';
import { completeTrialWithAssessment } from '../../lib/courseCrmService';
import { getFriendlyAuthErrorMessage } from '../../lib/authErrorUtils';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  subscribeToUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../lib/notificationService';
import {
  subscribeToTeacherSessions,
  createSession,
  rescheduleSession,
  cancelSession,
  detectSessionConflict,
  computeEndTime,
  formatSessionDateIST,
  formatSessionTimeIST,
  isSessionTodayIST,
  isSessionUpcomingIST,
  isSessionCompleted,
  getTodayISTDateString
} from '../../lib/sessionService';
import type { AppNotification } from '../../types';
import { TeacherStudentProgressModal } from '../teacher/TeacherStudentProgressModal';
import { TeacherAvailabilityManager } from '../teacher/TeacherAvailabilityManager';
import { IntelligentSlotPicker } from '../common/IntelligentSlotPicker';

interface AssignedStudent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  discipline: string;
  packageName: string;
  classesCount: number;
  completedCount: number;
  remainingCount: number;
  status: string;
  enrolledAt?: string;
}

export const TeacherAppView: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, profile, role, loading: authLoading, isProfileReady, signInWithEmail, sendResetEmail, logout } = useAuth();

  // Faculty sign-in state
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);
  const [facultyLoginLoading, setFacultyLoginLoading] = useState(false);
  const [facultyLoginError, setFacultyLoginError] = useState<string | null>(null);
  
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedClassForAction, setSelectedClassForAction] = useState<ClassSession | null>(null);
  const [activeLiveSession, setActiveLiveSession] = useState<ClassSession | null>(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState<ClassSession | null>(null);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<AssignedStudent | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStudentTarget, setAssignStudentTarget] = useState<AssignedStudent | null>(null);

  // Assignment Creation State
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Assignment Review State
  const [reviewingAssignment, setReviewingAssignment] = useState<Assignment | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackGrade, setFeedbackGrade] = useState<'A+' | 'A' | 'B+' | 'B' | 'Needs Practice'>('A');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  // Teacher Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Teacher Schedule Session State
  const [isTeacherScheduleOpen, setIsTeacherScheduleOpen] = useState(false);
  const [scheduleStudentTarget, setScheduleStudentTarget] = useState<AssignedStudent | null>(null);
  const [scheduleEnrollmentId, setScheduleEnrollmentId] = useState<string>('');
  const [teacherSessionDate, setTeacherSessionDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [teacherSessionStartTime, setTeacherSessionStartTime] = useState<string>('16:00');
  const [teacherSessionDuration, setTeacherSessionDuration] = useState<number>(45);
  const [teacherSessionNotes, setTeacherSessionNotes] = useState<string>('');
  const [teacherSessionConflict, setTeacherSessionConflict] = useState<string | null>(null);
  const [teacherSessionError, setTeacherSessionError] = useState<string | null>(null);
  const [isSubmittingTeacherSession, setIsSubmittingTeacherSession] = useState<boolean>(false);

  const [teacherProfileDoc, setTeacherProfileDoc] = useState<any>(null);
  const [isProvisioned, setIsProvisioned] = useState<boolean | null>(null);

  // Profile Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [teacherCancelTarget, setTeacherCancelTarget] = useState<ClassSession | null>(null);
  const [teacherCancelReason, setTeacherCancelReason] = useState<string>('');
  const [isSubmittingTeacherCancel, setIsSubmittingTeacherCancel] = useState<boolean>(false);

  // Faculty Reschedule Session state
  const [teacherRescheduleTarget, setTeacherRescheduleTarget] = useState<ClassSession | null>(null);
  const [teacherRescheduleDate, setTeacherRescheduleDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [teacherRescheduleTime, setTeacherRescheduleTime] = useState<string>('16:00');
  const [teacherRescheduleReason, setTeacherRescheduleReason] = useState<string>('');
  const [teacherRescheduleConflict, setTeacherRescheduleConflict] = useState<string | null>(null);
  const [isSubmittingTeacherReschedule, setIsSubmittingTeacherReschedule] = useState<boolean>(false);

  useEffect(() => {
    if (authLoading || !user?.uid || !isProfileReady) return;
    const unsub = subscribeToUserNotifications(user.uid, (items) => {
      setNotifications(items);
    });
    return () => unsub();
  }, [user?.uid, authLoading, isProfileReady]);

  // Conflict detection for teacher session creation
  useEffect(() => {
    if (!scheduleStudentTarget || !user?.uid || !teacherSessionDate || !teacherSessionStartTime) {
      setTeacherSessionConflict(null);
      return;
    }

    const scheduledAt = `${teacherSessionDate}T${teacherSessionStartTime}:00+05:30`;
    const check = detectSessionConflict(
      {
        teacherId: user.uid,
        studentId: scheduleStudentTarget.id,
        scheduledAt,
        durationMinutes: teacherSessionDuration
      },
      classes
    );

    if (check.hasConflict) {
      setTeacherSessionConflict(check.reason || 'Schedule conflict detected.');
    } else {
      setTeacherSessionConflict(null);
    }
  }, [scheduleStudentTarget, teacherSessionDate, teacherSessionStartTime, teacherSessionDuration, classes, user?.uid]);

  // Conflict detection for teacher reschedule
  useEffect(() => {
    if (!teacherRescheduleTarget || !user?.uid || !teacherRescheduleDate || !teacherRescheduleTime) {
      setTeacherRescheduleConflict(null);
      return;
    }

    const scheduledAt = `${teacherRescheduleDate}T${teacherRescheduleTime}:00+05:30`;
    const check = detectSessionConflict(
      {
        teacherId: user.uid,
        studentId: teacherRescheduleTarget.studentId,
        scheduledAt,
        durationMinutes: teacherRescheduleTarget.durationMinutes || 45,
        excludeSessionId: teacherRescheduleTarget.id
      },
      classes
    );

    if (check.hasConflict) {
      setTeacherRescheduleConflict(check.reason || 'Schedule conflict detected.');
    } else {
      setTeacherRescheduleConflict(null);
    }
  }, [teacherRescheduleTarget, teacherRescheduleDate, teacherRescheduleTime, classes, user?.uid]);

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const handleMarkTeacherNotifsRead = async () => {
    await markAllNotificationsAsRead(notifications);
  };

  const handleTeacherNotifClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !isProfileReady || role !== 'teacher') return;
    const loadData = async () => {
      try {
        setLoading(true);
        // Teacher data boundary: strictly query by authenticated teacher's UID
        const teacherId = user.uid;

        // Verify that teachers/{teacherId} exists in Firestore
        try {
          const teacherDocSnap = await getDoc(doc(db, 'teachers', teacherId));
          const userDocSnap = await getDoc(doc(db, 'users', teacherId));

          if (!teacherDocSnap.exists() && !userDocSnap.exists()) {
            console.warn(`[Teacher Provisioning Check] No teacher profile found for UID ${teacherId}`);
            setIsProvisioned(false);
            setLoading(false);
            return;
          }

          setIsProvisioned(true);
          const mergedData = {
            ...(userDocSnap.exists() ? userDocSnap.data() : {}),
            ...(teacherDocSnap.exists() ? teacherDocSnap.data() : {})
          };
          setTeacherProfileDoc(mergedData);
        } catch (verErr) {
          console.warn('[Teacher Provisioning Check Notice]', verErr);
          setIsProvisioned(true); // Allow standard error handling
        }
        
        const [loadedClasses, loadedAssignments, loadedEnrollments] = await Promise.all([
          dashboardService.getTeacherClasses(teacherId),
          dashboardService.getTeacherAssignments(teacherId),
          dashboardService.getTeacherEnrollments(teacherId)
        ]);

        setClasses(loadedClasses);
        setAssignments(loadedAssignments);
        setEnrollments(loadedEnrollments);
      } catch (e) {
        console.error("Failed to load teacher data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Subscribe to teacher's live sessions for real-time timetable updates
    let unsubSessions: (() => void) | undefined;
    try {
      unsubSessions = subscribeToTeacherSessions(user.uid, (liveClasses) => {
        if (liveClasses && liveClasses.length > 0) {
          setClasses(liveClasses);
        }
      });
    } catch (e) {
      console.warn("Notice subscribing to teacher sessions:", e);
    }

    // Subscribe to teacher's verified enrollments for automated roster updates
    let unsubEnrollments: (() => void) | undefined;
    try {
      unsubEnrollments = dashboardService.subscribeToTeacherEnrollments(user.uid, profile?.teacherCode, (newEnrollments) => {
        setEnrollments(newEnrollments);
      });
    } catch (e) {
      console.warn("Notice subscribing to teacher enrollments:", e);
    }

    return () => {
      if (unsubSessions) {
        unsubSessions();
      }
      if (unsubEnrollments) {
        unsubEnrollments();
      }
    };
  }, [user, profile, role, authLoading, isProfileReady]);

  // Authorization & Loading Check
  if (authLoading) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Faculty Studio...</p>
      </div>
    );
  }

  const handleFacultySignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyLoginError(null);
    try {
      setFacultyLoginLoading(true);
      await signInWithEmail(facultyEmail.trim(), facultyPassword);
    } catch (err: any) {
      console.warn('Faculty login notice:', err?.message || err);
      setFacultyLoginError(getFriendlyAuthErrorMessage(err));
    } finally {
      setFacultyLoginLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-amber-50/20 text-left">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/70 shadow-xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700" />
          
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <Music className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-1.5">
              Saremi Conservatory Faculty
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Guru & Faculty Studio Login
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Access your student schedules, lesson plans, Agora live video classrooms, and performance evaluations.
            </p>
          </div>

          <form onSubmit={handleFacultySignIn} className="space-y-3.5 text-left pt-2">
            {facultyLoginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {facultyLoginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Email</label>
              <input
                type="email"
                required
                placeholder="guru@saremi.academy"
                value={facultyEmail}
                onChange={(e) => setFacultyEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!facultyEmail.trim()) {
                      setFacultyLoginError('Please enter your Faculty email above first to receive a password reset link.');
                      return;
                    }
                    try {
                      await sendResetEmail(facultyEmail.trim());
                      setFacultyLoginError(null);
                      alert(`Password reset link dispatched to ${facultyEmail.trim()}. Please check your inbox.`);
                    } catch (err: any) {
                      setFacultyLoginError(getFriendlyAuthErrorMessage(err));
                    }
                  }}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showFacultyPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter temporary or private password"
                  value={facultyPassword}
                  onChange={(e) => setFacultyPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  {showFacultyPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={facultyLoginLoading}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {facultyLoginLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Enter Faculty Studio</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Return to Academy Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (profile?.status === 'inactive' && role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900">Faculty Account Deactivated</h2>
        <p className="text-gray-500 mt-2 text-xs leading-relaxed">
          Your faculty account (<strong>{user?.email}</strong>) is currently deactivated.
          Historical session records, feedback, and student notes remain safely preserved in academy archives.
        </p>
        <p className="text-gray-400 mt-2 text-[11px]">
          Please contact Academic Operations if you believe this is in error.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Return to Academy Home
          </button>
          <button
            onClick={async () => {
              await logout();
            }}
            className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-gray-900">Faculty Authorization Required</h2>
        <p className="text-gray-500 mt-2 text-sm">
          You are currently logged in as <strong>{user?.email}</strong> with student access. This area is strictly reserved for assigned faculty members.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={() => navigate('/app')}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Return to Student Dashboard
          </button>
          <button
            onClick={async () => {
              await logout();
            }}
            className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Log Out & Sign In with Faculty Account
          </button>
        </div>
      </div>
    );
  }

  if (isProvisioned === false) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900">Account Not Fully Provisioned</h2>
        <p className="text-gray-600 mt-2 text-xs leading-relaxed">
          Your teacher account is not fully provisioned. Please contact Saremi Academy Admin.
        </p>
        <p className="text-gray-400 mt-2 text-[11px]">
          Authenticated UID: <span className="font-mono text-gray-600">{user?.uid}</span>
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Return to Academy Home
          </button>
          <button
            onClick={async () => {
              await logout();
            }}
            className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handlePostClassSubmit = async (data: any) => {
    if (!selectedClassForAction) return;
    try {
      const isTrialClass = !!(
        selectedClassForAction.isTrial ||
        selectedClassForAction.trialId ||
        selectedClassForAction.id?.startsWith('cls_trial') ||
        data.isTrial
      );

      if (isTrialClass) {
        const trialId =
          selectedClassForAction.trialId ||
          selectedClassForAction.id.replace('cls_trial_', '');

        await completeTrialWithAssessment({
          trialId,
          teacherId: user?.uid || selectedClassForAction.teacherId,
          teacherName: profile?.name || user?.displayName || selectedClassForAction.teacherName || 'Faculty',
          notes: data.notes || 'Diagnostic assessment completed by teacher.',
          recommendation: data.recommendation || 'Recommended for Level 1 Foundation Term.',
          attendance: data.attendance === 'Absent' ? 'Absent' : 'Present',
          recommendedLevel: data.recommendedLevel || 'Foundation',
          recommendedPackageName: data.recommendedPackage || `${data.recommendedLevel || 'Foundation'} Term (24 Classes)`
        });
      } else {
        const updateData = {
          attendanceStatus: data.attendance,
          attendanceMarked: true,
          lessonNotes: data.notes,
          homeworkAssigned: data.homework,
          recordingUrl: data.materialUrl,
          status: 'completed',
          updatedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, 'classes', selectedClassForAction.id), updateData).catch(() => {});
        await updateDoc(doc(db, 'live_classes', selectedClassForAction.id), updateData).catch(() => {});

        // Save real attendance record for student/parent visibility
        await addDoc(collection(db, 'attendance'), {
          classId: selectedClassForAction.id,
          studentId: selectedClassForAction.studentId,
          studentName: selectedClassForAction.studentName,
          teacherId: user?.uid || selectedClassForAction.teacherId,
          teacherName: profile?.name || user?.displayName || selectedClassForAction.teacherName,
          courseTitle: selectedClassForAction.courseTitle || 'Classical Music',
          status: data.attendance === 'Absent' ? 'Absent' : (data.attendance === 'Late' ? 'Late' : 'Present'),
          lessonNotes: data.notes || '',
          homeworkAssigned: data.homework || '',
          date: selectedClassForAction.date || new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }).catch((attErr) => console.warn('Attendance save note:', attErr));

        // If homework was assigned, create an assignment record in Firestore
        if (data.homework && data.homework.trim().length > 0) {
          await dashboardService.createTeacherAssignment({
            studentId: selectedClassForAction.studentId,
            studentName: selectedClassForAction.studentName,
            teacherId: user?.uid || selectedClassForAction.teacherId,
            teacherName: profile?.name || user?.displayName || selectedClassForAction.teacherName,
            courseTitle: selectedClassForAction.courseTitle || 'Classical Music',
            title: data.homework,
            description: data.notes ? `Lesson context: ${data.notes}` : 'Practice assigned after live class.',
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            status: 'Pending'
          }).catch((asgnErr) => console.warn('Assignment creation note:', asgnErr));
        }
      }

      // Refresh teacher's class schedule and assignments
      const teacherId = user?.uid;
      if (teacherId) {
        const [updatedClasses, updatedAssignments] = await Promise.all([
          dashboardService.getTeacherClasses(teacherId),
          dashboardService.getTeacherAssignments(teacherId)
        ]);
        setClasses(updatedClasses);
        setAssignments(updatedAssignments);
      }

      setSelectedClassForAction(null);
      if (selectedClassDetails?.id === selectedClassForAction.id) {
        setSelectedClassDetails(null);
      }
      alert(isTrialClass ? "🎉 Trial diagnostic completed! Notes and level recommendation recorded." : "Class evaluated successfully. Attendance and notes saved.");
    } catch (err) {
      console.error("Failed to submit post-class assessment:", err);
      alert("Notice saving assessment. Please retry.");
    }
  };

  // Helper for Date Parsing using standardized IST calculations
  const isTodayClass = (cls: ClassSession): boolean => {
    return isSessionTodayIST(cls);
  };

  const isUpcomingClass = (cls: ClassSession): boolean => {
    return isSessionUpcomingIST(cls);
  };

  const isCompletedClass = (cls: ClassSession): boolean => {
    return isSessionCompleted(cls);
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' (IST)';
  const todayClasses = classes.filter(isTodayClass);
  const upcomingClasses = classes.filter(isUpcomingClass);
  const completedClasses = classes.filter(isCompletedClass);

  // Derive Assigned Students:
  // Strict filter: Demo completed/passed + verified payment + active enrollment + valid assignment to this teacher
  const studentMap = new Map<string, AssignedStudent>();

  // Add from real active, verified enrollments only
  enrollments.forEach((enr) => {
    const isActive = !enr.status || enr.status === 'active';
    const isPaid = !enr.paymentStatus || enr.paymentStatus === 'paid' || enr.paymentVerified;
    const isThisTeacher = (user?.uid && enr.teacherId === user.uid) || (profile?.id && enr.teacherId === profile.id) || (profile?.teacherCode && enr.teacherId === profile.teacherCode);

    if (enr.studentId && isActive && isPaid && isThisTeacher) {
      studentMap.set(enr.studentId, {
        id: enr.studentId,
        name: enr.studentName || 'Student',
        email: enr.studentEmail || '',
        discipline: enr.courseTitle || enr.courseName || 'Classical Music',
        packageName: enr.packageName || 'Active Term',
        classesCount: enr.totalSessions || enr.classesTotal || 24,
        completedCount: enr.sessionsCompleted || enr.classesCompleted || 0,
        remainingCount: enr.remainingSessions || enr.classesRemaining || 24,
        status: enr.status || 'active',
        enrolledAt: enr.startDate || enr.createdAt || ''
      });
    }
  });

  // Calculate completed sessions only for confirmed enrolled students
  classes.forEach((c) => {
    if (!c.studentId || !studentMap.has(c.studentId)) return;
    const s = studentMap.get(c.studentId)!;
    if (isCompletedClass(c) && s.completedCount < s.classesCount) {
      s.completedCount = Math.min(s.classesCount, s.completedCount + 1);
      s.remainingCount = Math.max(0, s.classesCount - s.completedCount);
    }
  });

  const students = Array.from(studentMap.values());

  // Handle Practice Assignment Creation
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentTarget || !assignTitle.trim()) {
      alert("Please select a student and enter a title.");
      return;
    }
    setIsAssigning(true);
    try {
      await dashboardService.createTeacherAssignment({
        studentId: assignStudentTarget.id,
        studentName: assignStudentTarget.name,
        teacherId: user?.uid || '',
        teacherName: profile?.name || user?.displayName || 'Faculty Instructor',
        courseTitle: assignStudentTarget.discipline || 'Classical Music',
        title: assignTitle.trim(),
        description: assignDesc.trim() || 'Daily riyaaz and practice assignment.',
        dueDate: assignDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'Pending'
      });

      // Refresh assignments
      if (user?.uid) {
        const loaded = await dashboardService.getTeacherAssignments(user.uid);
        setAssignments(loaded);
      }

      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      setIsAssignModalOpen(false);
      setAssignStudentTarget(null);
      alert("Practice assignment assigned successfully to student!");
    } catch (err) {
      console.error("Failed to create assignment:", err);
      alert("Notice saving assignment. Please retry.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Submitting Assignment Review & Grade
  const handleSubmitReview = async () => {
    if (!reviewingAssignment) return;
    setIsSubmittingReview(true);
    try {
      await dashboardService.updateTeacherAssignment(reviewingAssignment.id, {
        feedback: feedbackNotes,
        grade: feedbackGrade,
        status: 'Reviewed'
      });

      if (user?.uid) {
        const loaded = await dashboardService.getTeacherAssignments(user.uid);
        setAssignments(loaded);
      }

      setReviewingAssignment(null);
      setFeedbackNotes('');
      alert("Review, notes, and grade saved successfully!");
    } catch (err) {
      console.error("Failed to update review:", err);
      alert("Notice updating assignment review. Please retry.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const activeTab = (() => {
    if (currentPath === '/teacher-app/today-classes' || currentPath === '/teacher-app/classes') return 'today-classes';
    if (currentPath === '/teacher-app/calendar') return 'calendar';
    if (currentPath === '/teacher-app/students') return 'students';
    if (currentPath === '/teacher-app/availability') return 'availability';
    if (currentPath === '/teacher-app/profile') return 'profile';
    if (currentPath === '/teacher-app/assignments') return 'assignments';
    return 'overview';
  })();

  // -------------------------------------------------------------
  // VIEW: Today's Scheduled Classes (Direct from Firestore)
  // -------------------------------------------------------------
  const renderTodayClassesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-gray-900">Today's Scheduled Classes</h2>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {todayClasses.length} {todayClasses.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Live schedule for {todayStr} (IST). Launch live classrooms or mark student attendance.
          </p>
        </div>
      </div>

      {todayClasses.length === 0 ? (
        <SaremiCard>
          <SaremiEmptyState 
            icon="📅"
            title="No classes scheduled for today"
            description="You have no classes scheduled for today. Check the Calendar tab for upcoming scheduled lessons."
          />
        </SaremiCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayClasses.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-700 mb-0.5" />
                      <span className="text-[10px] font-bold text-amber-900 leading-tight">{item.time?.split(' ')[0] || '18:00'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{item.studentName || 'Learner'}</h4>
                      <p className="text-xs font-medium text-amber-800">{item.discipline || item.courseTitle || 'Classical Music'}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    item.status === 'live' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      : item.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Scheduled'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium uppercase">Date</span>
                    <span className="font-semibold text-gray-800">{item.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium uppercase">Time (IST)</span>
                    <span className="font-semibold text-gray-800">{item.time}</span>
                  </div>
                  {item.topic && (
                    <div className="col-span-2 pt-1 border-t border-gray-100">
                      <span className="text-gray-400 block text-[10px] font-medium uppercase">Topic / Raga</span>
                      <span className="font-medium text-gray-700">{item.topic}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 mt-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveLiveSession(item)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{item.status === 'completed' ? 'Re-open Studio' : 'Start / Join Class'}</span>
                </button>

                <button
                  onClick={() => setSelectedClassDetails(item)}
                  className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>

                <button
                  onClick={() => setSelectedClassForAction(item)}
                  className="py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Evaluate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // VIEW: Teacher Profile & Security Settings
  // -------------------------------------------------------------
  const renderProfileTab = () => {
    const faculty = teacherProfileDoc || profile || {};
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Faculty Conservatory Profile</h2>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative faculty credentials and security management in Saremi Academy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <SaremiCard className="md:col-span-1 text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
              {faculty.photoURL || faculty.photo ? (
                <img 
                  src={faculty.photoURL || faculty.photo} 
                  alt={faculty.name || 'Guru'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Music className="w-10 h-10 text-amber-700" />
              )}
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">{faculty.name || user?.displayName || 'Faculty Guru'}</h3>
              <p className="text-xs font-semibold text-amber-800 mt-0.5">{faculty.specialization || 'Indian Classical Music'}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <CheckCircle className="w-3 h-3" />
                <span>Active Faculty</span>
              </div>
            </div>

            <div className="text-left text-xs space-y-2 border-t border-gray-100 pt-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Teacher ID</span>
                <span className="font-mono font-bold text-gray-800">{faculty.teacherId || faculty.id || user?.uid}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Email</span>
                <span className="font-semibold text-gray-800">{user?.email}</span>
              </div>
              {faculty.phone && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Phone / WhatsApp</span>
                  <span className="font-semibold text-gray-800">{faculty.phone}</span>
                </div>
              )}
            </div>
          </SaremiCard>

          {/* Details & Password Update */}
          <div className="md:col-span-2 space-y-6">
            <SaremiCard className="space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Conservatory Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Experience</span>
                  <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{faculty.experience || '10+ Years Conservatory Teaching'}</span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Languages</span>
                  <span className="font-semibold text-gray-800 text-sm mt-0.5 block">
                    {Array.isArray(faculty.languages) ? faculty.languages.join(', ') : (faculty.languages || 'English, Hindi, Marathi')}
                  </span>
                </div>
              </div>

              {faculty.bio && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Guru Biography</span>
                  <p className="text-xs text-gray-600 bg-[#FAF8F5] p-3 rounded-xl border border-gray-100 leading-relaxed">
                    {faculty.bio}
                  </p>
                </div>
              )}
            </SaremiCard>

            {/* Change Password Form */}
            <SaremiCard className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-gray-900">Change Password</h3>
              </div>

              {passwordChangeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your password was updated successfully!</span>
                </div>
              )}

              {passwordChangeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {passwordChangeError}
                </div>
              )}

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPasswordChangeError(null);
                  setPasswordChangeSuccess(false);

                  if (newPassword.length < 6) {
                    setPasswordChangeError('Password must be at least 6 characters long.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordChangeError('Passwords do not match.');
                    return;
                  }

                  setIsChangingPassword(true);
                  try {
                    if (user) {
                      const { updatePassword } = await import('firebase/auth');
                      await updatePassword(user, newPassword);
                      await updateDoc(doc(db, 'users', user.uid), {
                        requiresPasswordChange: false,
                        updatedAt: new Date().toISOString()
                      });
                      setPasswordChangeSuccess(true);
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  } catch (err: any) {
                    console.error('Password change error:', err);
                    setPasswordChangeError(getFriendlyAuthErrorMessage(err));
                  } finally {
                    setIsChangingPassword(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </SaremiCard>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VIEW: Overview (Dashboard)
  // -------------------------------------------------------------
  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Today's Classes */}
        <SaremiCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Today's Classes
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{todayStr}</span>
          </div>
          
          {todayClasses.length === 0 ? (
            <SaremiEmptyState 
              icon="📅"
              title="No classes scheduled for today"
              description="Enjoy your day off or review student practice submissions."
            />
          ) : (
            <div className="space-y-3">
              {todayClasses.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 bg-[#FAF8F5] gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-amber-900 leading-none">{item.time?.split(' ')[0] || '18:00'}</span>
                      <span className="text-[10px] text-amber-700 font-medium">{item.time?.split(' ')[1] || 'IST'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.studentName}</h4>
                      <p className="text-xs text-gray-600 mb-1">{item.discipline || item.courseTitle} • {item.topic}</p>
                      <div className="flex items-center gap-2">
                        <SaremiBadge variant="amber">{item.status || 'Scheduled'}</SaremiBadge>
                        {(item.isTrial || item.trialId || item.id?.startsWith('cls_trial')) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            1:1 Diagnostic Trial
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <SaremiButton 
                      variant="outline" 
                      className="text-xs py-2"
                      onClick={() => setSelectedClassDetails(item)}
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      Open Class
                    </SaremiButton>

                    {(item.isTrial || item.trialId || item.id?.startsWith('cls_trial')) && (
                      <SaremiButton 
                        variant="secondary" 
                        className="text-xs py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200"
                        onClick={() => setSelectedClassForAction(item)}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Evaluate
                      </SaremiButton>
                    )}

                    {item.status === 'live' ? (
                      <SaremiButton 
                        variant="primary" 
                        className="text-xs py-2 bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse"
                        onClick={() => setActiveLiveSession(item)}
                      >
                        <Video className="w-4 h-4 mr-1.5" />
                        Enter Live Class
                      </SaremiButton>
                    ) : item.status === 'completed' ? (
                      <SaremiButton 
                        variant="outline" 
                        className="text-xs py-2 text-emerald-700 bg-emerald-50 border-emerald-200 font-bold"
                        onClick={() => setSelectedClassForAction(item)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        View Notes
                      </SaremiButton>
                    ) : (
                      <SaremiButton 
                        variant="primary" 
                        className="text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                        onClick={() => setActiveLiveSession(item)}
                      >
                        <Video className="w-4 h-4 mr-1.5" />
                        Start Class
                      </SaremiButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SaremiCard>

        {/* Upcoming Classes */}
        <SaremiCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Upcoming Classes
            </h3>
            <span className="text-xs font-bold text-gray-500">{upcomingClasses.length} Scheduled</span>
          </div>
          {upcomingClasses.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No upcoming classes scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcomingClasses.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedClassDetails(item)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.studentName}</h4>
                      <p className="text-xs text-gray-500">{item.date || item.scheduledAt} • {item.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 hidden sm:inline">{item.courseTitle || item.discipline}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SaremiCard>
      </div>

      <div className="space-y-6">
        {/* Action Required: Post-Class Evaluation & Attendance */}
        <SaremiCard className="bg-gradient-to-br from-gray-900 to-black text-white border-0">
          <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Action Required
          </h3>
          <div className="space-y-3">
            {completedClasses.filter(c => !c.lessonNotes && !(c as any).teacherNotes).slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/10 border border-white/10 text-sm">
                <div className="font-bold text-white mb-0.5">{item.studentName}</div>
                <div className="text-xs text-gray-400 mb-3">{item.date} • Needs Attendance & Notes</div>
                <button 
                  onClick={() => setSelectedClassForAction(item)}
                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  Add Notes & Attendance
                </button>
              </div>
            ))}
            {completedClasses.filter(c => !c.lessonNotes && !(c as any).teacherNotes).length === 0 && (
              <p className="text-xs text-emerald-300 font-medium">All past classes have been evaluated with attendance marked. Great job!</p>
            )}
          </div>
        </SaremiCard>

        {/* Pending Practice Submissions */}
        <SaremiCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Mic className="w-5 h-5 text-indigo-600" />
              Practice Submissions
            </h3>
            <button 
              onClick={() => navigate('/teacher-app/assignments')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {assignments.filter(a => a.status === 'Pending' || a.status === 'pending' || a.status === 'submitted').slice(0, 4).map((sub, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-[#FAF8F5] text-xs">
                <div className="flex justify-between font-bold text-gray-900 mb-1">
                  <span>{sub.studentName}</span>
                  <span className="text-[10px] text-gray-400 font-normal">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Active'}</span>
                </div>
                <p className="text-gray-600 text-[11px] mb-2">{sub.title}</p>
                <button 
                  onClick={() => {
                    setReviewingAssignment(sub);
                    setFeedbackNotes(sub.teacherFeedbackNotes || sub.feedback || '');
                    setFeedbackGrade((sub.grade as any) || 'A');
                  }}
                  className="w-full py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Review Submission
                </button>
              </div>
            ))}
            {assignments.filter(a => a.status === 'Pending' || a.status === 'pending' || a.status === 'submitted').length === 0 && (
              <p className="text-xs text-gray-500">No pending submissions awaiting review.</p>
            )}
          </div>
        </SaremiCard>

        {/* Quick Assignment Action */}
        <SaremiCard className="bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Assign Practice Material</h4>
              <p className="text-xs text-gray-600">Assign riyaaz or repertoire tasks to students</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setAssignStudentTarget(students[0] || null);
              setIsAssignModalOpen(true);
            }}
            disabled={students.length === 0}
            className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Create New Practice Task
          </button>
        </SaremiCard>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // VIEW: Assigned Students
  // -------------------------------------------------------------
  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-gray-900">My Assigned Students</h2>
          <p className="text-xs text-gray-500 mt-1">Students officially assigned to your conservatory studio</p>
        </div>
        <div className="flex items-center gap-3">
          <SaremiBadge variant="outline">{students.length} Total Enrolled</SaremiBadge>
          <SaremiButton 
            variant="primary" 
            className="text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
            onClick={() => {
              setAssignStudentTarget(students[0] || null);
              setIsAssignModalOpen(true);
            }}
            disabled={students.length === 0}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Assign Material
          </SaremiButton>
        </div>
      </div>
      
      {students.length === 0 ? (
        <SaremiEmptyState 
          icon="👥"
          title="No assigned students yet"
          description="Students enrolled in your courses or diagnostic trials will automatically appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student, idx) => (
            <SaremiCard key={idx} className="hover:shadow-md transition-shadow group flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-serif font-bold text-lg shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors truncate">{student.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{student.discipline}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{student.packageName}</p>
                    
                    <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Activity className="w-3.5 h-3.5" />
                        {student.completedCount} / {student.classesCount} Classes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <button 
                  onClick={() => setSelectedStudentForProgress(student)}
                  className="flex-1 py-1.5 rounded-lg text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer text-center"
                >
                  Profile
                </button>
                <button 
                  onClick={() => {
                    setScheduleStudentTarget(student);
                    // Find student's active enrollment
                    const studentEnr = enrollments.find(e => 
                      (e.studentId === student.id || e.studentEmail === (student as any).email) &&
                      (!e.status || e.status === 'active')
                    );
                    if (studentEnr) {
                      setScheduleEnrollmentId(studentEnr.id);
                    } else if (enrollments.length > 0) {
                      setScheduleEnrollmentId(enrollments[0].id);
                    }
                    setTeacherSessionError(null);
                    setTeacherSessionConflict(null);
                    setIsTeacherScheduleOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer text-center shadow-xs"
                >
                  Schedule Class
                </button>
              </div>
            </SaremiCard>
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // VIEW: Class History & Timetable
  // -------------------------------------------------------------
  const renderClassesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-gray-900">Faculty Timetable & Class Records</h2>
          <p className="text-xs text-gray-500 mt-1">Review scheduled 1:1 sessions, live classes, and lesson archives</p>
        </div>
        <div className="flex items-center gap-3">
          <SaremiBadge variant="outline">{upcomingClasses.length + todayClasses.length} Scheduled</SaremiBadge>
          <SaremiBadge variant="outline">{completedClasses.length} Completed</SaremiBadge>
          <button
            onClick={() => {
              if (students.length > 0) {
                setScheduleStudentTarget(students[0]);
                const studentEnr = enrollments.find(e => 
                  (e.studentId === students[0].id || e.studentEmail === (students[0] as any).email) &&
                  (!e.status || e.status === 'active')
                );
                if (studentEnr) {
                  setScheduleEnrollmentId(studentEnr.id);
                } else if (enrollments.length > 0) {
                  setScheduleEnrollmentId(enrollments[0].id);
                }
              }
              setTeacherSessionError(null);
              setTeacherSessionConflict(null);
              setIsTeacherScheduleOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule 1:1 Session</span>
          </button>
        </div>
      </div>

      {/* Upcoming & Scheduled Sessions Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-amber-600" />
          <span>Upcoming & Scheduled Sessions ({upcomingClasses.length + todayClasses.length})</span>
        </h3>
        
        {upcomingClasses.length + todayClasses.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No upcoming sessions scheduled. Click "Schedule 1:1 Session" or select an assigned student to book a class.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...todayClasses, ...upcomingClasses].map((cls) => {
              const isLive = cls.status === 'live';
              const isRescheduled = cls.status === 'rescheduled';

              return (
                <div key={cls.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{cls.courseTitle}</span>
                        {isLive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            🔴 Live
                          </span>
                        )}
                        {isRescheduled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Rescheduled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">Student: {cls.studentName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{formatSessionDateIST(cls)}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatSessionTimeIST(cls)} ({cls.durationMinutes || 45}m)</span>
                      </div>
                      {cls.rescheduleReason && (
                        <p className="text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded mt-1.5 border border-purple-100">
                          Rescheduled: {cls.rescheduleReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setTeacherRescheduleTarget(cls);
                          setTeacherRescheduleDate(cls.date || cls.scheduledAt?.split('T')[0] || '');
                          setTeacherRescheduleTime(cls.startTime || '16:00');
                          setTeacherRescheduleReason('');
                          setTeacherRescheduleConflict(null);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setTeacherCancelTarget(cls);
                          setTeacherCancelReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedClassDetails(cls)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                        title="View full class details"
                      >
                        Details
                      </button>
                      {isLive ? (
                        <button
                          onClick={() => setActiveLiveSession(cls)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer animate-pulse shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Enter Live Class</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveLiveSession(cls)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Start Class</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed History Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Completed Class Archives ({completedClasses.length})</span>
        </h3>

        {completedClasses.length === 0 ? (
          <SaremiEmptyState 
            icon="📚"
            title="No completed classes yet"
            description="Once you conduct live sessions, you can add notes, attendance, and homework here."
          />
        ) : (
          <div className="space-y-3">
            {completedClasses.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.studentName}</h4>
                    <p className="text-xs text-gray-500 mb-1">{item.discipline || item.courseTitle} • {item.topic}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                      <span>{item.date} at {item.time}</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        {(item as any).attendanceStatus || 'Completed'}
                      </span>
                    </div>
                    {item.lessonNotes && (
                      <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-700">Notes:</span> {item.lessonNotes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setSelectedClassForAction(item)}
                    className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors border border-amber-200 cursor-pointer"
                  >
                    Edit Notes & Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // VIEW: Review Assignments & Materials
  // -------------------------------------------------------------
  const renderAssignmentsTab = () => {
    const filtered = assignments.filter((a) => {
      if (assignmentFilter === 'pending') return a.status === 'Pending' || a.status === 'pending' || a.status === 'submitted';
      if (assignmentFilter === 'reviewed') return a.status === 'Reviewed' || a.status === 'reviewed';
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900">Assignment Review & Material Center</h2>
            <p className="text-xs text-gray-500 mt-1">Review student riyaaz audio submissions, provide teacher notes, and assign new tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
              <button 
                onClick={() => setAssignmentFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${assignmentFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : ''}`}
              >
                All ({assignments.length})
              </button>
              <button 
                onClick={() => setAssignmentFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${assignmentFilter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : ''}`}
              >
                Pending Review
              </button>
              <button 
                onClick={() => setAssignmentFilter('reviewed')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${assignmentFilter === 'reviewed' ? 'bg-white text-gray-900 shadow-sm' : ''}`}
              >
                Reviewed
              </button>
            </div>

            <SaremiButton 
              variant="primary" 
              className="text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => {
                setAssignStudentTarget(students[0] || null);
                setIsAssignModalOpen(true);
              }}
              disabled={students.length === 0}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Assign Task
            </SaremiButton>
          </div>
        </div>

        {filtered.length === 0 ? (
          <SaremiEmptyState 
            icon="🎙️"
            title="No assignments found"
            description={assignmentFilter === 'pending' ? "All student assignments have been reviewed." : "Assign a practice task or check back when students submit their riyaaz recordings."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, idx) => (
              <SaremiCard key={idx} className="flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-amber-700 font-medium">Student: {item.studentName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Reviewed' || item.status === 'reviewed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status || 'Pending'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{item.description}</p>

                  {/* If student submitted audio */}
                  {(item.audioUrl || (item as any).studentAudioUrl) && (
                    <div className="mb-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-gray-700">
                        <Music className="w-3.5 h-3.5 text-amber-600" />
                        <span>Student Riyaaz Audio Recording:</span>
                      </div>
                      <audio 
                        controls 
                        className="w-full h-8" 
                        src={item.audioUrl || (item as any).studentAudioUrl} 
                      />
                    </div>
                  )}

                  {/* If student added notes */}
                  {(item as any).studentNotes && (
                    <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg mb-3">
                      "{ (item as any).studentNotes }"
                    </div>
                  )}

                  {/* Teacher Feedback if already provided */}
                  {(item.feedback || item.teacherFeedbackNotes) && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-emerald-900">Your Evaluation:</span>
                        {item.grade && (
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold text-[10px]">
                            Grade: {item.grade}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-800">{item.feedback || item.teacherFeedbackNotes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-400 text-[11px]">Due: {item.dueDate || 'Flexible'}</span>
                  <button 
                    onClick={() => {
                      setReviewingAssignment(item);
                      setFeedbackNotes(item.feedback || item.teacherFeedbackNotes || '');
                      setFeedbackGrade((item.grade as any) || 'A');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-colors cursor-pointer border border-indigo-200"
                  >
                    {item.status === 'Reviewed' || item.status === 'reviewed' ? 'Edit Review' : 'Grade & Feedback'}
                  </button>
                </div>
              </SaremiCard>
            ))}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // VIEW: Teacher Availability & Working Hours
  // -------------------------------------------------------------
  const renderAvailabilityTab = () => (
    <div className="space-y-6">
      <TeacherAvailabilityManager
        teacherId={user?.uid || ''}
        teacherName={profile?.displayName || user?.displayName || 'Faculty Guru'}
        actor={{
          id: user?.uid || 'teacher',
          name: profile?.displayName || user?.displayName || 'Faculty Guru',
          role: 'teacher'
        }}
        isAdminMode={false}
      />
    </div>
  );

  const tabs = [
    { id: 'overview', label: "Dashboard", path: "/teacher-app" },
    { id: 'today-classes', label: "Today's Classes", path: "/teacher-app/today-classes" },
    { id: 'calendar', label: "Calendar", path: "/teacher-app/calendar" },
    { id: 'students', label: "Students", path: "/teacher-app/students" },
    { id: 'assignments', label: "Homework & Audio", path: "/teacher-app/assignments" },
    { id: 'availability', label: "Availability", path: "/teacher-app/availability" },
    { id: 'profile', label: "Profile", path: "/teacher-app/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-left">
      {/* Teacher Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SaremiBadge variant="amber">Faculty Portal</SaremiBadge>
                <span className="text-xs font-medium text-gray-500 border-l border-gray-300 pl-2">
                  Strictly Confidential
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome, {profile?.name || user?.displayName || 'Instructor'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 relative cursor-pointer transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">Faculty Alerts</span>
                        {unreadNotifCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {unreadNotifCount} New
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkTeacherNotifsRead}
                          className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No notifications yet. You'll be alerted when new students or classes are assigned.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleTeacherNotifClick(notif)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              notif.isRead 
                                ? 'bg-[#FAF8F5] border-gray-100 opacity-80 hover:opacity-100' 
                                : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                                <Bell className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {notif.title}
                                  </span>
                                  <span className="text-[9px] text-gray-400 shrink-0">
                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <SaremiButton variant="outline" className="text-xs py-2" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </SaremiButton>
            </div>
          </div>
          
          {/* Sub Navigation */}
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === 'overview' && (activeTab as string) === 'teacher-app');
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'border-amber-600 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {((activeTab as string) === 'overview' || (activeTab as string) === 'teacher-app') && renderOverview()}
        {((activeTab as string) === 'today-classes' || (activeTab as string) === 'classes') && renderTodayClassesTab()}
        {activeTab === 'calendar' && renderClassesTab()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'availability' && renderAvailabilityTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'assignments' && renderAssignmentsTab()}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Open Class (Class Session Details & Actions) */}
      {/* ------------------------------------------------------------- */}
      {selectedClassDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {selectedClassDetails.isTrial ? '1:1 Diagnostic Trial' : 'Curriculum Class Session'}
                </span>
                <h3 className="font-serif text-xl font-bold text-gray-900 mt-2">
                  {selectedClassDetails.topic || selectedClassDetails.courseTitle}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedClassDetails(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm bg-[#FAF8F5] p-4 rounded-2xl border border-gray-100 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-bold text-gray-900">{selectedClassDetails.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discipline / Course:</span>
                <span className="font-medium text-gray-800">{selectedClassDetails.courseTitle || selectedClassDetails.discipline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled Date & Time:</span>
                <span className="font-medium text-gray-800">{selectedClassDetails.date} at {selectedClassDetails.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Studio Room / Channel:</span>
                <span className="font-mono text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  {selectedClassDetails.agoraChannelName || selectedClassDetails.roomId || 'saremi_studio'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Status:</span>
                <SaremiBadge variant="amber">{selectedClassDetails.status || 'Scheduled'}</SaremiBadge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  const target = selectedClassDetails;
                  setSelectedClassDetails(null);
                  setActiveLiveSession(target);
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Video className="w-4 h-4" />
                Start / Join Agora Live Class
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const target = selectedClassDetails;
                    setSelectedClassDetails(null);
                    setSelectedClassForAction(target);
                  }}
                  className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Notes & Attendance
                </button>

                <button
                  onClick={() => {
                    const student = students.find(s => s.id === selectedClassDetails.studentId) || {
                      id: selectedClassDetails.studentId,
                      name: selectedClassDetails.studentName,
                      email: selectedClassDetails.studentEmail || '',
                      discipline: selectedClassDetails.courseTitle || 'Classical Music',
                      packageName: 'Active Term',
                      classesCount: 1,
                      completedCount: 0,
                      remainingCount: 1,
                      status: 'active'
                    };
                    setSelectedClassDetails(null);
                    setSelectedStudentForProgress(student);
                  }}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Student Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Student Progress & Profile Report */}
      {/* ------------------------------------------------------------- */}
      {selectedStudentForProgress && (
        <TeacherStudentProgressModal
          student={selectedStudentForProgress}
          classes={classes}
          assignments={assignments}
          onClose={() => setSelectedStudentForProgress(null)}
          onEditSession={(session) => {
            setSelectedStudentForProgress(null);
            setSelectedClassForAction(session);
          }}
          onAssignPractice={(targetStudent) => {
            setSelectedStudentForProgress(null);
            setAssignStudentTarget(targetStudent);
            setIsAssignModalOpen(true);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Assign Practice Material / Homework */}
      {/* ------------------------------------------------------------- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Assign Practice Task</h3>
                <p className="text-xs text-gray-500 mt-0.5">Assign riyaaz exercise or repertoire to assigned student</p>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Student</label>
                <select
                  value={assignStudentTarget?.id || ''}
                  onChange={(e) => {
                    const match = students.find(s => s.id === e.target.value);
                    setAssignStudentTarget(match || null);
                  }}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.discipline})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Practice Task Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Raag Yaman Sthai & Antara Riyaaz in Teentaal"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instructions & Practice Routine</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. 15 minutes slow tempo alap with Sa-Pa tanpura tuning at C#. Focus on komal Ni and tivra Ma accuracy."
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                <input 
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Assign to Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Review & Grade Submission */}
      {/* ------------------------------------------------------------- */}
      {reviewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Review & Grade Submission</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Student: {reviewingAssignment.studentName}</p>
              </div>
              <button 
                onClick={() => setReviewingAssignment(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs mb-4">
              <div className="font-bold text-gray-800 mb-1">{reviewingAssignment.title}</div>
              <p className="text-gray-600 text-[11px] mb-3">{reviewingAssignment.description}</p>

              {(reviewingAssignment.audioUrl || (reviewingAssignment as any).studentAudioUrl) && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-700 block mb-1">Student Audio Recording:</span>
                  <audio 
                    controls 
                    className="w-full h-8" 
                    src={reviewingAssignment.audioUrl || (reviewingAssignment as any).studentAudioUrl} 
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Guru Pedagogical Feedback & Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Provide constructive feedback on pitch accuracy, rhythm, tone, and areas to improve."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Performance Grade</label>
                <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                  {(['A+', 'A', 'B+', 'B', 'Needs Practice'] as const).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setFeedbackGrade(grade)}
                      className={`py-2 rounded-xl border transition-colors cursor-pointer text-center ${
                        feedbackGrade === grade 
                          ? 'bg-amber-600 text-white border-amber-600' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingAssignment(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Post-Class Evaluation & Attendance */}
      {/* ------------------------------------------------------------- */}
      {selectedClassForAction && (
        <PostClassModal 
          isOpen={!!selectedClassForAction}
          onClose={() => setSelectedClassForAction(null)}
          classSession={selectedClassForAction}
          onSubmit={handlePostClassSubmit}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Agora Live Acoustic Classroom Studio */}
      {/* ------------------------------------------------------------- */}
      {activeLiveSession && (
        <LiveClassroomModal
          session={activeLiveSession}
          currentUser={profile}
          role="teacher"
          onClose={() => setActiveLiveSession(null)}
          onClassCompleted={() => {
            setActiveLiveSession(null);
            // Refresh classes after session completed
            if (user?.uid) {
              dashboardService.getTeacherClasses(user.uid).then(setClasses).catch(() => {});
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Faculty 1:1 Class Scheduling */}
      {/* ------------------------------------------------------------- */}
      {isTeacherScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Schedule 1:1 Session</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Faculty Studio Timetable Booking</p>
              </div>
              <button 
                onClick={() => setIsTeacherScheduleOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherSessionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs mb-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{teacherSessionError}</span>
              </div>
            )}

            {teacherSessionConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mb-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Schedule Overlap:</strong>
                  <p className="text-[11px] mt-0.5">{teacherSessionConflict}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTeacherSessionError(null);
                if (!scheduleEnrollmentId) {
                  setTeacherSessionError('Please select a student enrollment.');
                  return;
                }
                if (teacherSessionConflict) {
                  setTeacherSessionError(teacherSessionConflict);
                  return;
                }

                setIsSubmittingTeacherSession(true);
                try {
                  const result = await createSession(
                    {
                      enrollmentId: scheduleEnrollmentId,
                      date: teacherSessionDate,
                      startTime: teacherSessionStartTime,
                      durationMinutes: teacherSessionDuration,
                      sessionType: '1:1',
                      createdBy: user?.uid || 'teacher',
                      creatorName: profile?.displayName || user?.displayName || 'Faculty Guru',
                      creatorRole: 'teacher',
                      notes: teacherSessionNotes
                    },
                    classes
                  );

                  if (!result.success) {
                    setTeacherSessionError(result.error || 'Failed to schedule session');
                  } else {
                    setIsTeacherScheduleOpen(false);
                    setScheduleStudentTarget(null);
                    setTeacherSessionNotes('');
                    setTeacherSessionConflict(null);
                  }
                } catch (err: any) {
                  setTeacherSessionError(err.message || 'Error scheduling session');
                } finally {
                  setIsSubmittingTeacherSession(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Student & Course Enrollment *</label>
                <select
                  value={scheduleEnrollmentId}
                  onChange={(e) => {
                    setScheduleEnrollmentId(e.target.value);
                    const matchedEnr = enrollments.find(item => item.id === e.target.value);
                    if (matchedEnr) {
                      const matchedStudent = students.find(s => s.id === matchedEnr.studentId);
                      if (matchedStudent) {
                        setScheduleStudentTarget(matchedStudent);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  required
                >
                  <option value="" disabled>Select student enrollment...</option>
                  {enrollments
                    .filter(e => !e.status || e.status === 'active')
                    .map(enr => (
                      <option key={enr.id} value={enr.id}>
                        {enr.studentName} — {enr.courseName || enr.discipline} ({enr.packageName || 'Active'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Date (IST) *</label>
                <input
                  type="date"
                  required
                  value={teacherSessionDate}
                  onChange={(e) => setTeacherSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {user?.uid && (
                <IntelligentSlotPicker
                  teacherId={user.uid}
                  teacherName={profile?.displayName || 'Faculty'}
                  date={teacherSessionDate}
                  durationMinutes={teacherSessionDuration}
                  selectedTime={teacherSessionStartTime}
                  onSelectTime={setTeacherSessionStartTime}
                  studentPreferences={(scheduleStudentTarget as any)?.preferences}
                  existingClasses={classes}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration</label>
                  <select
                    value={teacherSessionDuration}
                    onChange={(e) => setTeacherSessionDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={30}>30 Mins (Trial)</option>
                    <option value={45}>45 Mins (Standard 1:1)</option>
                    <option value={60}>60 Mins (Masterclass)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time (IST)</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                    {computeEndTime(teacherSessionStartTime, teacherSessionDuration)} IST
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Agenda / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Riyaz exercises, Raga Bhairav Bandish review"
                  value={teacherSessionNotes}
                  onChange={(e) => setTeacherSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer hover:bg-slate-50"
                  disabled={isSubmittingTeacherSession}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacherSession || !!teacherSessionConflict || !scheduleEnrollmentId}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTeacherSession ? 'Scheduling...' : 'Confirm Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Faculty Session Reschedule */}
      {/* ------------------------------------------------------------- */}
      {teacherRescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Reschedule 1:1 Class</h3>
                <p className="text-xs text-purple-700 font-medium mt-0.5">
                  Student: {teacherRescheduleTarget.studentName}
                </p>
              </div>
              <button 
                onClick={() => setTeacherRescheduleTarget(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherRescheduleConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mb-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Conflict:</strong>
                  <p className="text-[11px] mt-0.5">{teacherRescheduleConflict}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!teacherRescheduleTarget || !teacherRescheduleReason.trim()) return;
                if (teacherRescheduleConflict) {
                  alert(teacherRescheduleConflict);
                  return;
                }

                setIsSubmittingTeacherReschedule(true);
                try {
                  const result = await rescheduleSession(
                    {
                      sessionId: teacherRescheduleTarget.id,
                      newDate: teacherRescheduleDate,
                      newStartTime: teacherRescheduleTime,
                      newDurationMinutes: teacherRescheduleTarget.durationMinutes || 45,
                      reason: teacherRescheduleReason.trim(),
                      updatedBy: user?.uid || 'teacher',
                      updaterName: profile?.displayName || user?.displayName || 'Faculty Guru',
                      updaterRole: 'teacher'
                    },
                    classes
                  );

                  if (!result.success) {
                    alert(result.error || 'Failed to reschedule session');
                  } else {
                    setTeacherRescheduleTarget(null);
                    setTeacherRescheduleReason('');
                    setTeacherRescheduleConflict(null);
                  }
                } catch (err: any) {
                  alert(err.message || 'Error rescheduling session');
                } finally {
                  setIsSubmittingTeacherReschedule(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Date (IST) *</label>
                  <input
                    type="date"
                    required
                    value={teacherRescheduleDate}
                    onChange={(e) => setTeacherRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Start Time (IST) *</label>
                  <input
                    type="time"
                    required
                    value={teacherRescheduleTime}
                    onChange={(e) => setTeacherRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Rescheduling *</label>
                <textarea
                  required
                  placeholder="e.g. Schedule adjustment per student request"
                  value={teacherRescheduleReason}
                  onChange={(e) => setTeacherRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none h-20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTeacherRescheduleTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  disabled={isSubmittingTeacherReschedule}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacherReschedule || !!teacherRescheduleConflict || !teacherRescheduleReason.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTeacherReschedule ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Faculty Session Cancellation */}
      {/* ------------------------------------------------------------- */}
      {teacherCancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Cancel 1:1 Class</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  Student: {teacherCancelTarget.studentName}
                </p>
              </div>
              <button 
                onClick={() => setTeacherCancelTarget(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 bg-red-50 p-3 rounded-xl border border-red-200">
              The session will be marked as <strong>Cancelled</strong>. The record will remain archived for attendance audits and will not be deleted.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!teacherCancelTarget || !teacherCancelReason.trim()) return;

                setIsSubmittingTeacherCancel(true);
                try {
                  const result = await cancelSession({
                    sessionId: teacherCancelTarget.id,
                    reason: teacherCancelReason.trim(),
                    cancelledBy: user?.uid || 'teacher',
                    cancellerName: profile?.displayName || user?.displayName || 'Faculty Guru',
                    cancellerRole: 'teacher'
                  });

                  if (!result.success) {
                    alert(result.error || 'Failed to cancel session');
                  } else {
                    setTeacherCancelTarget(null);
                    setTeacherCancelReason('');
                  }
                } catch (err: any) {
                  alert(err.message || 'Error cancelling session');
                } finally {
                  setIsSubmittingTeacherCancel(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Cancellation *</label>
                <textarea
                  required
                  placeholder="e.g. Urgent scheduling conflict or emergency"
                  value={teacherCancelReason}
                  onChange={(e) => setTeacherCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none h-20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTeacherCancelTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  disabled={isSubmittingTeacherCancel}
                >
                  Keep Class
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacherCancel || !teacherCancelReason.trim()}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTeacherCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Session Details & Workspace Modal */}
      {selectedClassDetails && (
        <AcademicSessionModal
          session={selectedClassDetails}
          onClose={() => setSelectedClassDetails(null)}
        />
      )}
    </div>
  );
};
