import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  CalendarCheck,
  CalendarX,
  RotateCcw,
  Search,
  BookOpen,
  Repeat,
  CalendarOff
} from 'lucide-react';
import {
  subscribeToLiveClasses,
  saveLiveClass,
  subscribeToTeachers,
  subscribeToStudents,
  recordAuditLog,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { subscribeToAllEnrollments } from '../../lib/courseCrmService';
import {
  createSession,
  createRecurringSessionSeries,
  rescheduleSession,
  cancelSession,
  computeEndTime,
  detectSessionConflict,
  formatSessionDateIST,
  formatSessionTimeIST,
  validateEnrollmentForSession,
  subscribeToTeacherWeeklyAvailability,
  subscribeToAllTeacherBlockedTimes,
  subscribeToAcademyBlockedDates
} from '../../lib/sessionService';
import { 
  ClassSession, 
  TeacherProfile, 
  UserProfile, 
  EnrollmentRecord,
  WeeklyAvailabilitySlot,
  TeacherBlockedTime,
  AcademyBlockedDate
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AcademyBlockedDatesManager } from './AcademyBlockedDatesManager';
import { IntelligentSlotPicker } from '../common/IntelligentSlotPicker';
import { RecurringSeriesSection } from '../common/RecurringSeriesSection';

export const AdminClassesView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  // Top level views: Timetable vs Academy Closures
  const [mainTab, setMainTab] = useState<'sessions' | 'holidays'>('sessions');

  // Filter & Search states
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Session Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [sessionStartTime, setSessionStartTime] = useState<string>('16:00');
  const [sessionDuration, setSessionDuration] = useState<number>(45);
  const [sessionType, setSessionType] = useState<'1:1' | 'trial' | 'group'>('1:1');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [createConflict, setCreateConflict] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Recurring Series State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<'weekly' | 'bi-weekly'>('weekly');
  const [recurringOccurrences, setRecurringOccurrences] = useState(4);
  const [recurringIsValid, setRecurringIsValid] = useState(true);
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailabilitySlot[]>([]);
  const [teacherBlockedTimes, setTeacherBlockedTimes] = useState<TeacherBlockedTime[]>([]);
  const [academyBlockedDates, setAcademyBlockedDates] = useState<AcademyBlockedDate[]>([]);

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<ClassSession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>('10:00');
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(45);
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleConflict, setRescheduleConflict] = useState<string | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<ClassSession | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    const unsubClasses = subscribeToLiveClasses(setClasses);
    const unsubTeachers = subscribeToTeachers(setTeachers);
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubEnrollments = subscribeToAllEnrollments((records) => {
      setEnrollments(records);
    });
    const unsubBlocked = subscribeToAllTeacherBlockedTimes(setTeacherBlockedTimes);
    const unsubAcademy = subscribeToAcademyBlockedDates(setAcademyBlockedDates);

    return () => {
      unsubClasses();
      unsubTeachers();
      unsubStudents();
      unsubEnrollments();
      unsubBlocked();
      unsubAcademy();
    };
  }, []);

  // Filter active enrollments for session creation
  const activeEnrollments = enrollments.filter(
    (e) => !e.status || e.status === 'active'
  );

  const selectedEnrollment = enrollments.find((e) => e.id === selectedEnrollmentId);
  const selectedStudentProfile = students.find((s) => s.id === selectedEnrollment?.studentId);

  useEffect(() => {
    if (!selectedEnrollment?.teacherId) {
      setWeeklyAvailability([]);
      return;
    }
    const unsub = subscribeToTeacherWeeklyAvailability(selectedEnrollment.teacherId, (slots) => {
      setWeeklyAvailability(slots);
    });
    return () => unsub();
  }, [selectedEnrollment?.teacherId]);

  // Calculated End Times
  const calculatedEndTime = computeEndTime(sessionStartTime, sessionDuration);
  const calculatedRescheduleEndTime = computeEndTime(rescheduleStartTime, rescheduleDuration);

  // Run Conflict check when create fields change
  useEffect(() => {
    if (!selectedEnrollment || !selectedEnrollment.teacherId || !sessionDate || !sessionStartTime) {
      setCreateConflict(null);
      return;
    }

    const scheduledAt = `${sessionDate}T${sessionStartTime}:00+05:30`;
    const check = detectSessionConflict(
      {
        teacherId: selectedEnrollment.teacherId,
        studentId: selectedEnrollment.studentId,
        scheduledAt,
        durationMinutes: sessionDuration
      },
      classes
    );

    if (check.hasConflict) {
      setCreateConflict(check.reason || 'Schedule conflict detected.');
    } else {
      setCreateConflict(null);
    }
  }, [selectedEnrollmentId, sessionDate, sessionStartTime, sessionDuration, classes]);

  // Run Conflict check when reschedule fields change
  useEffect(() => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleStartTime) {
      setRescheduleConflict(null);
      return;
    }

    const scheduledAt = `${rescheduleDate}T${rescheduleStartTime}:00+05:30`;
    const check = detectSessionConflict(
      {
        teacherId: rescheduleTarget.teacherId,
        studentId: rescheduleTarget.studentId,
        scheduledAt,
        durationMinutes: rescheduleDuration,
        excludeSessionId: rescheduleTarget.id
      },
      classes
    );

    if (check.hasConflict) {
      setRescheduleConflict(check.reason || 'Schedule conflict detected.');
    } else {
      setRescheduleConflict(null);
    }
  }, [rescheduleTarget, rescheduleDate, rescheduleStartTime, rescheduleDuration, classes]);

  // Filtering classes list
  const filteredClasses = classes.filter((c) => {
    // Teacher filter
    if (filterTeacher !== 'all' && c.teacherId !== filterTeacher) {
      return false;
    }

    // View mode filter
    const status = c.status || 'scheduled';
    if (viewMode === 'today') {
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const clsDate = c.date || (c.scheduledAt ? c.scheduledAt.split('T')[0] : '');
      if (clsDate !== todayIST) return false;
    } else if (viewMode === 'upcoming') {
      if (status !== 'scheduled' && status !== 'live' && status !== 'started') return false;
    } else if (viewMode === 'completed') {
      if (status !== 'completed') return false;
    } else if (viewMode === 'cancelled') {
      if (status !== 'cancelled') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (c.studentName || '').toLowerCase();
      const tName = (c.teacherName || '').toLowerCase();
      const course = (c.courseTitle || '').toLowerCase();
      const room = (c.meetingUrl || c.roomId || '').toLowerCase();
      if (!sName.includes(q) && !tName.includes(q) && !course.includes(q) && !room.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Handle Export to CSV
  const handleExport = () => {
    const rows = filteredClasses.map((c) => ({
      'Session ID': c.id,
      'Enrollment ID': c.enrollmentId || 'N/A',
      'Course': c.courseTitle,
      'Program': c.program || 'N/A',
      'Student': c.studentName,
      'Student ID': c.studentId,
      'Faculty': c.teacherName,
      'Date': formatSessionDateIST(c),
      'Time (IST)': formatSessionTimeIST(c),
      'Duration (Mins)': c.durationMinutes,
      'Status': c.status,
      'Room/Channel': c.meetingUrl || c.roomId || 'N/A',
      'Cancellation Reason': c.cancellationReason || '',
      'Reschedule Reason': c.rescheduleReason || ''
    }));
    exportToCSV('saremi_academy_timetable', rows);
  };

  // Handle Session Creation
  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!selectedEnrollmentId) {
      setCreateError('Please select an active enrollment to schedule a session.');
      return;
    }

    if (!sessionDate || !sessionStartTime) {
      setCreateError('Please select both a valid date and start time.');
      return;
    }

    if (createConflict && !isRecurring) {
      setCreateError(createConflict);
      return;
    }

    if (isRecurring) {
      if (!recurringIsValid) {
        setCreateError(recurringError || 'Cannot schedule recurring series: one or more occurrences have conflicts.');
        return;
      }

      setIsSubmittingCreate(true);
      try {
        const seriesResult = await createRecurringSessionSeries(
          {
            enrollmentId: selectedEnrollmentId,
            startDate: sessionDate,
            startTime: sessionStartTime,
            durationMinutes: sessionDuration,
            totalSessions: recurringOccurrences,
            frequencyWeeks: recurringFreq === 'bi-weekly' ? 2 : 1,
            createdBy: currentAdmin?.uid || 'admin',
            creatorName: currentAdmin?.displayName || 'Admin',
            creatorRole: 'admin',
            notes: sessionNotes
          },
          classes,
          weeklyAvailability,
          teacherBlockedTimes,
          academyBlockedDates
        );

        if (!seriesResult.success) {
          setCreateError(seriesResult.error || 'Failed to create recurring series.');
        } else {
          setShowCreateModal(false);
          setSelectedEnrollmentId('');
          setSessionNotes('');
          setCreateConflict(null);
          setIsRecurring(false);
        }
      } catch (err: any) {
        setCreateError(err.message || 'Unexpected error creating recurring series.');
      } finally {
        setIsSubmittingCreate(false);
      }
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const result = await createSession(
        {
          enrollmentId: selectedEnrollmentId,
          date: sessionDate,
          startTime: sessionStartTime,
          durationMinutes: sessionDuration,
          sessionType: sessionType,
          createdBy: currentAdmin?.uid || 'admin',
          creatorName: currentAdmin?.displayName || 'Admin',
          creatorRole: 'admin',
          notes: sessionNotes
        },
        classes
      );

      if (!result.success) {
        setCreateError(result.error || 'Failed to create session.');
      } else {
        setShowCreateModal(false);
        setSelectedEnrollmentId('');
        setSessionNotes('');
        setCreateConflict(null);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Unexpected error creating session.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    if (!rescheduleDate || !rescheduleStartTime) {
      alert('Please provide a new date and time.');
      return;
    }

    if (!rescheduleReason.trim()) {
      alert('Please provide a reason for rescheduling this session.');
      return;
    }

    if (rescheduleConflict) {
      alert(rescheduleConflict);
      return;
    }

    setIsSubmittingReschedule(true);
    try {
      const result = await rescheduleSession(
        {
          sessionId: rescheduleTarget.id,
          newDate: rescheduleDate,
          newStartTime: rescheduleStartTime,
          newDurationMinutes: rescheduleDuration,
          reason: rescheduleReason.trim(),
          updatedBy: currentAdmin?.uid || 'admin',
          updaterName: currentAdmin?.displayName || 'Admin',
          updaterRole: 'admin'
        },
        classes
      );

      if (!result.success) {
        alert(result.error || 'Failed to reschedule session.');
      } else {
        setRescheduleTarget(null);
        setRescheduleReason('');
        setRescheduleConflict(null);
      }
    } catch (err: any) {
      alert(err.message || 'Unexpected error rescheduling session.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    if (!cancelReason.trim()) {
      alert('Please specify the reason for cancelling this session.');
      return;
    }

    setIsSubmittingCancel(true);
    try {
      const result = await cancelSession({
        sessionId: cancelTarget.id,
        reason: cancelReason.trim(),
        cancelledBy: currentAdmin?.uid || 'admin',
        cancellerName: currentAdmin?.displayName || 'Admin',
        cancellerRole: 'admin'
      });

      if (!result.success) {
        alert(result.error || 'Failed to cancel session.');
      } else {
        setCancelTarget(null);
        setCancelReason('');
      }
    } catch (err: any) {
      alert(err.message || 'Unexpected error cancelling session.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Quick Status Toggle for Completion
  const handleQuickStatusChange = async (cls: ClassSession, newStatus: ClassSession['status']) => {
    const updated = { ...cls, status: newStatus };
    await saveLiveClass(updated);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Session Status',
      'class',
      cls.id,
      `Changed session status of "${cls.courseTitle}" (${cls.studentName}) to ${newStatus}`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Academy Timetable vs Holidays Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setMainTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mainTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-amber-500" />
          <span>Academy Timetable & Sessions</span>
          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            mainTab === 'sessions' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mainTab === 'holidays'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarOff className="w-4 h-4 text-rose-500" />
          <span>Academy Holiday & Closure Calendar</span>
        </button>
      </div>

      {mainTab === 'holidays' ? (
        <AcademyBlockedDatesManager
          actor={{
            id: currentAdmin?.uid || 'admin',
            name: currentAdmin?.displayName || currentAdmin?.email || 'Academy Administrator',
            role: 'admin'
          }}
        />
      ) : (
        <>
          {/* Top Controls & Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sessions ({classes.length})
            </button>
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setViewMode('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Teacher Filter */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Faculty Gurus</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, guru, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none w-48 sm:w-60"
            />
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
              setCreateConflict(null);
              if (activeEnrollments.length > 0 && !selectedEnrollmentId) {
                setSelectedEnrollmentId(activeEnrollments[0].id);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Discipline & Program</th>
                <th className="py-3.5 px-4">Date & Time (IST)</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Assigned Guru</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Classroom Room</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No sessions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your filters or schedule a new 1:1 session from an active enrollment.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const isCancelled = cls.status === 'cancelled';
                  const isCompleted = cls.status === 'completed';
                  const isLive = cls.status === 'live' || cls.status === 'started';
                  const isRescheduled = cls.status === 'rescheduled';

                  return (
                    <tr 
                      key={cls.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* Discipline & Program */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cls.courseTitle}</div>
                        {cls.program && (
                          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                            {cls.program}
                          </div>
                        )}
                        {cls.enrollmentId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Enr: {cls.enrollmentId}
                          </div>
                        )}
                        {cls.seriesId && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-1">
                            <Repeat className="w-3 h-3 text-amber-600" />
                            <span>Series ({((cls.occurrenceIndex ?? 0) + 1)}/{cls.totalOccurrences || '?'})</span>
                          </div>
                        )}
                      </td>

                      {/* Date & Time in IST */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{formatSessionDateIST(cls)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatSessionTimeIST(cls)}</span>
                          <span className="text-slate-400">({cls.durationMinutes}m)</span>
                        </div>
                        {cls.rescheduleReason && (
                          <div className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 border border-purple-100 max-w-xs truncate">
                            Rescheduled: {cls.rescheduleReason}
                          </div>
                        )}
                        {cls.cancellationReason && (
                          <div className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded mt-1 border border-red-100 max-w-xs truncate">
                            Reason: {cls.cancellationReason}
                          </div>
                        )}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cls.studentName}</div>
                        {cls.studentEmail && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {cls.studentEmail}
                          </div>
                        )}
                      </td>

                      {/* Teacher */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>{cls.teacherName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Assigned Mentor</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                            🔴 Live Class
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                          </span>
                        ) : isRescheduled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                            <RotateCcw className="w-3 h-3" />
                            Rescheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                        )}
                      </td>

                      {/* Classroom / Agora Link */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          <Video className="w-3 h-3 text-slate-400" />
                          <span>{cls.meetingUrl || cls.roomId || `room_${cls.id}`}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCancelled && !isCompleted && (
                            <>
                              <button
                                onClick={() => {
                                  setRescheduleTarget(cls);
                                  setRescheduleDate(cls.date || cls.scheduledAt?.split('T')[0] || '');
                                  setRescheduleStartTime(cls.startTime || '10:00');
                                  setRescheduleDuration(cls.durationMinutes || 45);
                                  setRescheduleReason('');
                                  setRescheduleConflict(null);
                                }}
                                title="Reschedule Session"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-bold text-slate-700 cursor-pointer"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => {
                                  setCancelTarget(cls);
                                  setCancelReason('');
                                }}
                                title="Cancel Session"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-700 text-[11px] font-bold text-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange(cls, 'completed')}
                                title="Mark session as completed"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer"
                              >
                                Done
                              </button>
                            </>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-slate-400 italic">Archived</span>
                          )}
                          {isCancelled && (
                            <span className="text-[11px] text-red-500 italic">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* ==================================================================== */}
      {/* 1. ADMIN CREATE SESSION MODAL (ENROLLMENT DRIVEN)                      */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Schedule Academy Session</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select an active enrollment to schedule a 1:1 session</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Error Alert */}
            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Unable to Schedule:</strong>
                  <p className="text-[11px] mt-0.5">{createError}</p>
                </div>
              </div>
            )}

            {/* Schedule Conflict Warning */}
            {createConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Schedule Overlap Detected:</strong>
                  <p className="text-[11px] mt-0.5">{createConflict}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4 text-xs">
              {/* Enrollment Selector (Primary Source of Truth) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Active Enrollment *
                </label>
                <select
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                  required
                >
                  <option value="" disabled>Select Student's Active Enrollment...</option>
                  {activeEnrollments.map((enr) => (
                    <option key={enr.id} value={enr.id}>
                      {enr.studentName} — {enr.courseName} ({enr.packageName}) [Guru: {enr.teacherName || 'Not Assigned'}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Academic relationships (Student ↔ Teacher ↔ Course) are locked to the enrollment.
                </p>
              </div>

              {/* Auto-identified Enrollment Details Card */}
              {selectedEnrollment && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Identified Academic Relationship
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Student:</span>
                      <strong className="text-slate-900">{selectedEnrollment.studentName}</strong>
                      <span className="text-[10px] text-slate-400 block">{selectedEnrollment.studentEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Assigned Guru:</span>
                      <strong className={selectedEnrollment.teacherName ? 'text-slate-900' : 'text-red-600 font-bold'}>
                        {selectedEnrollment.teacherName || '⚠️ No Teacher Assigned'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Course:</span>
                      <strong className="text-slate-900">{selectedEnrollment.courseName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Program:</span>
                      <strong className="text-indigo-700">{selectedEnrollment.packageName}</strong>
                    </div>
                  </div>

                  {!selectedEnrollment.teacherId && (
                    <div className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                      ⚠️ This enrollment does not have an assigned teacher. Please assign a teacher in Enrollment Management first.
                    </div>
                  )}
                </div>
              )}

              {/* Date Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Date (IST) *
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              {/* Intelligent Slot Suggestions */}
              {selectedEnrollment?.teacherId && (
                <IntelligentSlotPicker
                  teacherId={selectedEnrollment.teacherId}
                  teacherName={selectedEnrollment.teacherName}
                  date={sessionDate}
                  durationMinutes={sessionDuration}
                  selectedTime={sessionStartTime}
                  onSelectTime={setSessionStartTime}
                  studentPreferences={(selectedStudentProfile as any)?.preferences}
                  existingClasses={classes}
                />
              )}

              {/* Duration & Calculated End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={30}>30 Mins (Trial Assessment)</option>
                    <option value={45}>45 Mins (Standard 1:1)</option>
                    <option value={60}>60 Mins (Extended Masterclass)</option>
                    <option value={90}>90 Mins (Advanced Workshop)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time (IST)</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                    {calculatedEndTime} IST
                  </div>
                </div>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1:1', 'trial', 'group'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSessionType(t)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-colors ${
                        sessionType === t
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t === '1:1' ? '1:1 Mentorship' : t === 'trial' ? 'Diagnostic Trial' : 'Group Session'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring Series Section */}
              {selectedEnrollment?.teacherId && (
                <RecurringSeriesSection
                  isRecurring={isRecurring}
                  onToggleRecurring={setIsRecurring}
                  frequency={recurringFreq}
                  onChangeFrequency={setRecurringFreq}
                  totalOccurrences={recurringOccurrences}
                  onChangeTotalOccurrences={setRecurringOccurrences}
                  maxAllowedOccurrences={
                    selectedEnrollment?.classesTotal && selectedEnrollment?.classesAttended !== undefined
                      ? Math.max(2, selectedEnrollment.classesTotal - selectedEnrollment.classesAttended)
                      : 12
                  }
                  startDate={sessionDate}
                  startTime={sessionStartTime}
                  durationMinutes={sessionDuration}
                  teacherId={selectedEnrollment.teacherId}
                  studentId={selectedEnrollment.studentId}
                  existingClasses={classes}
                  weeklyAvailability={weeklyAvailability}
                  teacherBlockedTimes={teacherBlockedTimes}
                  academyBlockedDates={academyBlockedDates}
                  onValidationChange={(isValid, summary) => {
                    setRecurringIsValid(isValid);
                    setRecurringError(summary || null);
                  }}
                />
              )}

              {/* Optional Session Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pedagogical Agenda / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Raag Yaman bandish preparation, Teentaal exercises"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer hover:bg-slate-50"
                  disabled={isSubmittingCreate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || !!createConflict || !selectedEnrollment?.teacherId}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingCreate ? 'Scheduling...' : 'Confirm & Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. RESCHEDULE SESSION MODAL                                           */}
      {/* ==================================================================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Reschedule Session</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rescheduleTarget.courseTitle} ({rescheduleTarget.studentName})
                </p>
              </div>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Current Schedule Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                Current Time
              </span>
              <p className="font-semibold text-slate-800">
                {formatSessionDateIST(rescheduleTarget)} at {formatSessionTimeIST(rescheduleTarget)}
              </p>
              <p className="text-slate-500 text-[11px]">Faculty: {rescheduleTarget.teacherName}</p>
            </div>

            {/* Conflict Warning */}
            {rescheduleConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Conflict:</strong>
                  <p className="text-[11px] mt-0.5">{rescheduleConflict}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Date (IST) *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Start Time *</label>
                  <input
                    type="time"
                    required
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration</label>
                  <select
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={30}>30 Mins</option>
                    <option value={45}>45 Mins</option>
                    <option value={60}>60 Mins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New End Time</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                    {calculatedRescheduleEndTime} IST
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Rescheduling *</label>
                <textarea
                  required
                  placeholder="e.g. Student requested shift due to academic exams, Guru adjusted slot"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none h-20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  disabled={isSubmittingReschedule}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule || !!rescheduleConflict || !rescheduleReason.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. CANCEL SESSION MODAL                                               */}
      {/* ==================================================================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-red-600" />
                <h3 className="font-serif text-lg font-bold text-slate-900">Cancel Session</h3>
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1 text-red-900">
              <strong className="block font-bold">Caution:</strong>
              <p className="text-[11px]">
                This session will be marked as <strong>Cancelled</strong>. The historical record will be preserved for audits and will not be deleted.
              </p>
              <div className="pt-2 text-slate-700 text-[11px] font-medium border-t border-red-100 mt-2">
                Course: <strong>{cancelTarget.courseTitle}</strong> • Student: <strong>{cancelTarget.studentName}</strong>
              </div>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  required
                  placeholder="e.g. Student illness, Guru emergency, Weather outage"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none h-20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  disabled={isSubmittingCancel}
                >
                  Keep Session
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel || !cancelReason.trim()}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
