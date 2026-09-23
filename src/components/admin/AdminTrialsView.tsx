import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Download,
  AlertCircle,
  GraduationCap,
  Video,
  X,
  UserCheck
} from 'lucide-react';
import {
  subscribeToBookings,
  updateBookingStatus,
  saveUserProfile
} from '../../lib/firestoreService';
import {
  saveStudent,
  recordAuditLog,
  exportToCSV,
  subscribeToTeachers
} from '../../lib/adminFirestoreService';
import {
  subscribeToTrialBookings,
  assignTeacherAndScheduleTrial,
  completeTrialWithAssessment
} from '../../lib/courseCrmService';
import { Booking, TrialBookingRecord, TeacherProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';

export const AdminTrialsView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const { navigate } = useRouter();
  const [trials, setTrials] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<TeacherProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal States
  const [schedulingTrial, setSchedulingTrial] = useState<any | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('18:00');
  const [isScheduling, setIsScheduling] = useState(false);

  const [completingTrial, setCompletingTrial] = useState<any | null>(null);
  const [decision, setDecision] = useState<'PASSED' | 'NEEDS_PREPARATION'>('PASSED');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [recommendedLevel, setRecommendedLevel] = useState('Foundation');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Listen to trial_bookings (primary source of truth) and bookings (legacy)
    let trialRecords: any[] = [];
    let bookingRecords: any[] = [];

    const syncUnified = () => {
      const map = new Map<string, any>();
      // Legacy bookings first
      bookingRecords.forEach((b) => map.set(b.id, b));
      // Primary trial_bookings override
      trialRecords.forEach((t) => map.set(t.id, t));
      setTrials(Array.from(map.values()));
    };

    const unsubTrials = subscribeToTrialBookings((data) => {
      trialRecords = data;
      syncUnified();
    });

    const unsubBookings = subscribeToBookings((data) => {
      bookingRecords = data;
      syncUnified();
    });

    const unsubTeachers = subscribeToTeachers((teachers) => {
      setAvailableTeachers(teachers);
      if (teachers.length > 0) {
        setSelectedTeacherId((prev) => prev || teachers[0].id);
      }
    });

    return () => {
      unsubTrials();
      unsubBookings();
      unsubTeachers();
    };
  }, []);

  const filteredTrials = trials.filter((t) => {
    const name = t.studentName || t.customerName || '';
    const email = t.email || t.studentEmail || t.customerEmail || '';
    const course = t.courseName || t.courseTitle || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const rows = filteredTrials.map((t) => ({
      ID: t.id,
      StudentName: t.studentName || t.customerName,
      Email: t.email || t.studentEmail || t.customerEmail,
      Phone: t.phone || t.studentPhone || t.customerPhone || 'N/A',
      Discipline: t.courseName || t.courseTitle,
      Status: t.status,
      AssignedTeacher: t.teacherName || 'Unassigned',
      PreferredSlot: t.preferredSlot || t.preferredDate || t.time || 'N/A',
      Date: t.date || 'TBD',
      CreatedAt: t.createdAt
    }));
    exportToCSV('saremi_trials_pipeline', rows);
  };

  const handleStatusChange = async (trial: any, newStatus: any) => {
    await updateBookingStatus(trial.id, newStatus);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Trial Booking Status',
      'lead',
      trial.id,
      `Changed trial status of ${trial.studentName || trial.customerName} to "${newStatus}"`
    );
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingTrial) return;

    const teacher = availableTeachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) {
      alert('Please select a valid active faculty teacher from the list. If no faculty are registered, create a teacher in the Faculty tab first.');
      return;
    }
    setIsScheduling(true);

    try {
      await assignTeacherAndScheduleTrial({
        trialId: schedulingTrial.id,
        teacherId: teacher.id,
        teacherName: teacher.name,
        date: selectedDate,
        time: `${selectedTime} IST`
      });

      await recordAuditLog(
        {
          id: currentAdmin?.uid || 'admin',
          name: currentAdmin?.displayName || 'Admin',
          role: role || 'admin'
        },
        'Assigned Teacher & Scheduled Trial',
        'class',
        schedulingTrial.id,
        `Assigned Guru ${teacher.name} to ${schedulingTrial.studentName || schedulingTrial.customerName} for ${selectedDate} at ${selectedTime} IST`
      );

      setSchedulingTrial(null);
      alert(`✅ Trial confirmed and scheduled with Guru ${teacher.name}! The student and teacher dashboards are synchronized.`);
    } catch (err) {
      console.error('Error scheduling trial:', err);
      alert('Error updating schedule. Please retry.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrial) return;

    setIsCompleting(true);
    try {
      await completeTrialWithAssessment({
        trialId: completingTrial.id,
        teacherId: completingTrial.teacherId || 'admin',
        teacherName: completingTrial.teacherName || currentAdmin?.displayName || 'Senior Faculty',
        notes: notes || 'Student showed good pitch recognition and eager interest.',
        recommendation: recommendation || 'Recommended for Level 1 Foundation Term.',
        decision: decision,
        attendance: 'Present',
        recommendedLevel: recommendedLevel,
        recommendedPackageName: `${recommendedLevel} Term (24 Classes)`
      });

      await recordAuditLog(
        {
          id: currentAdmin?.uid || 'admin',
          name: currentAdmin?.displayName || 'Admin',
          role: role || 'admin'
        },
        'Completed Trial with Assessment',
        'class',
        completingTrial.id,
        `Completed trial for ${completingTrial.studentName || completingTrial.customerName}. Decision: ${decision}.`
      );

      setCompletingTrial(null);
      setNotes('');
      setRecommendation('');
      alert(`🎉 Trial marked as Completed! Decision: ${decision === 'PASSED' ? 'PASSED (Purchase Eligible)' : 'Needs Prep'}. Student dashboard updated automatically.`);
    } catch (err) {
      console.error('Error completing trial:', err);
      alert('Error saving assessment. Please retry.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleQuickMarkPassed = async (trial: any) => {
    try {
      await completeTrialWithAssessment({
        trialId: trial.id,
        teacherId: trial.teacherId || 'admin',
        teacherName: trial.teacherName || currentAdmin?.displayName || 'Faculty Guru',
        notes: trial.feedback || 'Diagnostic demonstration evaluated. Approved for course enrollment.',
        recommendation: trial.recommendation || 'Recommended for Foundation Certification Term.',
        decision: 'PASSED',
        attendance: 'Present',
        recommendedLevel: trial.recommendedLevel || 'Foundation',
        recommendedPackageName: 'Foundation Term (24 Classes)'
      });

      await recordAuditLog(
        {
          id: currentAdmin?.uid || 'admin',
          name: currentAdmin?.displayName || 'Admin',
          role: role || 'admin'
        },
        'Marked Demo Passed & Purchase Eligible',
        'class',
        trial.id,
        `Fast-tracked student ${trial.studentName || trial.customerName} to Purchase Eligible status.`
      );

      alert(`🎉 ${trial.studentName || trial.customerName} is now marked PASSED and Purchase Eligible!`);
    } catch (e) {
      console.error('Error marking trial passed:', e);
      alert('Could not update trial status. Please retry.');
    }
  };

  const handleConvertToEnrollment = async (trial: any) => {
    // Preserve existing student identity from trial or user
    const studentId = trial.studentId || trial.userId || `std_${Date.now()}`;
    const name = trial.studentName || trial.customerName || 'New Student';
    const email = trial.email || trial.studentEmail || trial.customerEmail;
    const phone = trial.phone || trial.studentPhone || trial.customerPhone || '';
    const courseTitle = trial.courseName || trial.courseTitle || 'Hindustani Classical Vocal';

    await saveStudent({
      id: studentId,
      name,
      email,
      phone,
      role: 'student',
      createdAt: new Date().toISOString(),
      enrolledCourses: [
        {
          courseId: trial.courseId || `course_${Date.now()}`,
          courseTitle,
          instrument: 'vocals',
          enrolledAt: new Date().toISOString(),
          level: trial.level || 'Foundation',
          sessionsCompleted: 1, // Trial counts as first diagnostic session
          totalSessions: 16,
          teacherName: trial.teacherName || 'Senior Guru',
          nextSessionDate: 'TBD',
          nextSessionTime: 'TBD',
          meetingUrl: trial.roomId || 'saremi-studio-live'
        }
      ]
    });

    await updateBookingStatus(trial.id, 'completed');

    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Converted Trial to Enrollment',
      'student',
      studentId,
      `Converted trial lead ${name} (${email}) into active enrolled student keeping identity (${studentId}).`
    );

    alert(`🎉 Successfully converted ${name} to an enrolled student (ID: ${studentId})!`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trials by name, email, discipline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Statuses ({trials.length})</option>
            <option value="pending">Pending Guru Assignment</option>
            <option value="slot_proposed">Slot Proposed (Awaiting Student)</option>
            <option value="reschedule_requested">Reschedule Requested</option>
            <option value="confirmed">Confirmed / Scheduled</option>
            <option value="completed">Completed / Assessed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Trials</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Student & Contact</th>
                <th className="py-3.5 px-4">Discipline</th>
                <th className="py-3.5 px-4">Assigned Guru & Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Trial Notes / Rec</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No trial booking requests match your filter.
                  </td>
                </tr>
              ) : (
                filteredTrials.map((trial) => {
                  const name = trial.studentName || trial.customerName || 'Anonymous';
                  const email = trial.email || trial.studentEmail || trial.customerEmail;
                  const phone = trial.phone || trial.studentPhone || trial.customerPhone;
                  const isLinkedUser = !!(trial.studentId || trial.userId);
                  const isReschedule = trial.rescheduleRequested || trial.status === 'reschedule_requested';

                  return (
                    <tr key={trial.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{name}</span>
                          {isLinkedUser && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Linked
                            </span>
                          )}
                          {isReschedule && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              Reschedule Req
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{email}</div>
                        {phone && <div className="text-[10px] text-slate-400">{phone}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">
                          {trial.courseName || trial.courseTitle}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {trial.level || trial.ageGroup || 'Diagnostic'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {trial.teacherName ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              {trial.teacherName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {trial.proposedDate || trial.date || 'TBD'} • {trial.proposedTime || trial.time || '18:00 IST'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Needs Guru Assignment
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={trial.status || 'pending'}
                          onChange={(e) => handleStatusChange(trial, e.target.value as any)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                            trial.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : trial.status === 'slot_proposed'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : trial.status === 'reschedule_requested'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : trial.status === 'completed'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : trial.status === 'cancelled'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="slot_proposed">Slot Proposed</option>
                          <option value="reschedule_requested">Reschedule Req</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {(trial.isPurchaseEligible || trial.trialPassed) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Purchase Eligible
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {trial.recommendation || trial.notes ? (
                          <div>
                            <div className="text-[11px] font-medium text-slate-800 truncate">
                              {trial.recommendation || trial.notes}
                            </div>
                            {trial.recommendedLevel && (
                              <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                Rec: {trial.recommendedLevel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Pending Trial</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Mark Passed & Eligible Button */}
                          {(!trial.isPurchaseEligible || !trial.trialPassed) && (
                            <button
                              onClick={() => handleQuickMarkPassed(trial)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 transition-colors cursor-pointer"
                              title="Mark Demo as Passed & Automatically Enable Course Purchase"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Mark Passed</span>
                            </button>
                          )}

                          {/* Assign / Schedule Button */}
                          <button
                            onClick={() => {
                              setSchedulingTrial(trial);
                              if (trial.teacherId) setSelectedTeacherId(trial.teacherId);
                              if (trial.date && trial.date !== 'Flexible') setSelectedDate(trial.date);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
                            title="Assign Teacher & Schedule Trial"
                          >
                            <Calendar className="w-3 h-3 text-slate-600" />
                            <span>{trial.teacherName ? 'Reschedule' : 'Assign Guru'}</span>
                          </button>

                          {/* Complete & Add Recommendation */}
                          {trial.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setCompletingTrial(trial);
                                setNotes(trial.notes || '');
                                setRecommendation(trial.recommendation || '');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 transition-colors"
                              title="Add Diagnostic Notes & Recommendation"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          {/* Convert to Student */}
                          <button
                            onClick={() => handleConvertToEnrollment(trial)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-bold shadow-2xs transition-colors"
                            title="Convert trial student into active enrolled student"
                          >
                            <GraduationCap className="w-3 h-3" />
                            <span>Enroll</span>
                          </button>
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

      {/* Modal: Assign Teacher & Schedule Trial */}
      {schedulingTrial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Assign Guru & Schedule Trial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: {schedulingTrial.studentName || schedulingTrial.customerName}
                </p>
              </div>
              <button
                onClick={() => setSchedulingTrial(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Select Guru */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Guru / Faculty</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  {availableTeachers.length === 0 ? (
                    <option value="" disabled>
                      No faculty members registered in Firestore yet
                    </option>
                  ) : (
                    availableTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} — {teacher.title || teacher.specialization || 'Guru'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Trial Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                />
              </div>

              {/* Time */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Time (IST)</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="10:00">10:00 AM IST</option>
                  <option value="11:30">11:30 AM IST</option>
                  <option value="15:00">03:00 PM IST</option>
                  <option value="16:30">04:30 PM IST</option>
                  <option value="18:00">06:00 PM IST</option>
                  <option value="19:30">07:30 PM IST</option>
                  <option value="20:30">08:30 PM IST</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                💡 This automatically creates a synchronized live classroom session in both the student&apos;s and teacher&apos;s portals.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSchedulingTrial(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs disabled:opacity-50"
                >
                  {isScheduling ? 'Scheduling...' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Trial & Add Recommendation */}
      {completingTrial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Complete Trial & Add Recommendation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: {completingTrial.studentName || completingTrial.customerName}
                </p>
              </div>
              <button
                onClick={() => setCompletingTrial(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Diagnostic Decision *</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold"
                >
                  <option value="PASSED">Passed — Student Automatically Becomes Purchase Eligible</option>
                  <option value="NEEDS_PREPARATION">Needs Preparation — Additional Readiness Review Required</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Selecting PASSED automatically marks the student purchase-eligible, updates their dashboard with the "Purchase Course" action card, and notifies them.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recommended Level</label>
                <select
                  value={recommendedLevel}
                  onChange={(e) => setRecommendedLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="Foundation">Foundation (Level 1: Svar & Laya)</option>
                  <option value="Intermediate">Intermediate (Level 2: Raga Elaborations)</option>
                  <option value="Advanced">Advanced (Level 3: Concert Repertoire)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Diagnostic Assessment Notes</label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on pitch accuracy, rhythm sense, breath control..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recommendation / Next Step</label>
                <textarea
                  required
                  rows={2}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="e.g. Recommended for 3-Month Foundation Certification..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTrial(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {isCompleting ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
