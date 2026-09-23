import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  UserX, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  Edit3, 
  ShieldCheck, 
  Layers, 
  Music, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Save,
  X,
  History,
  Check
} from 'lucide-react';
import { ClassSession, EnrollmentRecord, UserProfile, Assignment } from '../../types';
import { 
  subscribeToStudentCompletedSessions, 
  subscribeToStudentSyllabusSummary, 
  subscribeToStudentHomework,
  updateCompletedSessionAttendance,
  SyllabusProgressSummary 
} from '../../lib/academicPostClassService';

interface AdminStudentAcademicTabProps {
  student: any;
  enrollments: EnrollmentRecord[];
  adminUser: UserProfile | null;
}

export const AdminStudentAcademicTab: React.FC<AdminStudentAcademicTabProps> = ({
  student,
  enrollments,
  adminUser
}) => {
  // Selected course filter (default to first active enrollment or undefined for all)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | undefined>(
    enrollments.length > 0 ? enrollments[0].id : undefined
  );

  const [completedSessions, setCompletedSessions] = useState<ClassSession[]>([]);
  const [syllabusSummary, setSyllabusSummary] = useState<SyllabusProgressSummary | null>(null);
  const [homeworkList, setHomeworkList] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Correction Modal State
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [editStatus, setEditStatus] = useState<'Present' | 'Late' | 'Absent' | 'Excused'>('Present');
  const [editWhatTaught, setEditWhatTaught] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [isSavingCorrection, setIsSavingCorrection] = useState<boolean>(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active enrollment details
  const activeEnrollment = enrollments.find((e) => e.id === selectedEnrollmentId) || enrollments[0];
  const courseIdOrTitle = activeEnrollment?.courseName || activeEnrollment?.courseTitle || activeEnrollment?.courseId || 'Hindustani Classical Vocal';

  // Subscriptions
  useEffect(() => {
    if (!student?.id) return;
    setIsLoading(true);

    const unsubSessions = subscribeToStudentCompletedSessions(
      student.id,
      selectedEnrollmentId,
      (sessions) => {
        setCompletedSessions(sessions);
        setIsLoading(false);
      }
    );

    const unsubSyllabus = subscribeToStudentSyllabusSummary(
      student.id,
      courseIdOrTitle,
      selectedEnrollmentId,
      (summary) => {
        setSyllabusSummary(summary);
      }
    );

    const unsubHomework = subscribeToStudentHomework(
      student.id,
      selectedEnrollmentId,
      (hw) => {
        setHomeworkList(hw);
      }
    );

    return () => {
      unsubSessions();
      unsubSyllabus();
      unsubHomework();
    };
  }, [student?.id, selectedEnrollmentId, courseIdOrTitle]);

  // Attendance statistics
  const totalCompleted = completedSessions.length;
  const presentCount = completedSessions.filter((s) => s.attendanceStatus === 'Present' || !s.attendanceStatus).length;
  const lateCount = completedSessions.filter((s) => s.attendanceStatus === 'Late').length;
  const absentCount = completedSessions.filter((s) => s.attendanceStatus === 'Absent').length;
  const attendanceRate = totalCompleted > 0 ? Math.round(((presentCount + lateCount) / totalCompleted) * 100) : 100;

  // Open correction modal
  const handleOpenEdit = (session: ClassSession) => {
    setEditingSession(session);
    setEditStatus((session.attendanceStatus as any) || 'Present');
    setEditWhatTaught(session.whatWasTaught || session.topic || '');
    setEditNotes(session.lessonNotes || session.teacherNotes || '');
    setEditReason('');
    setCorrectionFeedback(null);
  };

  // Submit correction
  const handleSaveCorrection = async () => {
    if (!editingSession) return;
    if (!editReason.trim()) {
      setCorrectionFeedback({ type: 'error', message: 'Administrative justification reason is required for the audit log.' });
      return;
    }

    setIsSavingCorrection(true);
    setCorrectionFeedback(null);

    try {
      await updateCompletedSessionAttendance({
        sessionId: editingSession.id,
        actor: {
          id: adminUser?.id || 'admin_user',
          name: adminUser?.name || 'Academic Administrator',
          email: adminUser?.email || 'admin@saremi.academy',
          role: 'admin'
        },
        status: editStatus,
        whatWasTaught: editWhatTaught,
        lessonNotes: editNotes,
        reason: editReason.trim()
      });

      setCorrectionFeedback({ type: 'success', message: 'Academic record and audit trail updated successfully.' });
      setTimeout(() => {
        setEditingSession(null);
      }, 1000);
    } catch (err: any) {
      setCorrectionFeedback({ type: 'error', message: err.message || 'Failed to update academic record.' });
    } finally {
      setIsSavingCorrection(false);
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Top Banner & Course Selector */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h4 className="font-bold text-slate-900 text-sm">Academic 360 & Institutional Ledger</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time verification of completed lessons, attendance fidelity, syllabus completion, and homework.
          </p>
        </div>

        {enrollments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Filter Course:</span>
            <select
              value={selectedEnrollmentId || ''}
              onChange={(e) => setSelectedEnrollmentId(e.target.value || undefined)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs cursor-pointer shadow-2xs"
            >
              {enrollments.map((enr) => (
                <option key={enr.id} value={enr.id}>
                  {enr.courseName || enr.courseTitle} ({enr.teacherName || 'Guru'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Completed Lessons
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {totalCompleted}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            of {activeEnrollment?.classesTotal || activeEnrollment?.totalSessions || 12} enrolled
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Attendance Rate
          </span>
          <div className={`text-xl font-bold mt-1 ${attendanceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {attendanceRate}%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {presentCount} Present • {lateCount} Late • {absentCount} Absent
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Syllabus Covered
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {syllabusSummary?.percentageCompleted ?? 0}%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {syllabusSummary?.completedTopicsCount ?? 0} of {syllabusSummary?.totalTopics ?? 0} topics
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Riyaz Tasks Assigned
          </span>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            {homeworkList.length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {homeworkList.filter((h) => h.status === 'completed' || h.status === 'reviewed').length} completed / reviewed
          </span>
        </div>
      </div>

      {/* Syllabus Progression Section */}
      {syllabusSummary && syllabusSummary.pillars.length > 0 && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Syllabus & Curriculum Progression: {syllabusSummary.courseTitle}</span>
            </h5>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {syllabusSummary.completedTopicsCount} / {syllabusSummary.totalTopics} Topics Completed
            </span>
          </div>

          <div className="space-y-3">
            {syllabusSummary.pillars.map((pillar, pIdx) => (
              <div key={pIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  {pillar.pillarTitle}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pillar.topics.map((t, tIdx) => {
                    const isComp = t.status === 'completed';
                    const isInProg = t.status === 'in_progress';
                    const isRev = t.status === 'revision' || t.status === 'practice_required';

                    return (
                      <div
                        key={tIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          isComp
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : isInProg
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                            : isRev
                            ? 'bg-purple-50/60 border-purple-200 text-purple-950'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isComp ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          )}
                          <span className="truncate font-medium">{t.topic}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          isComp
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : isInProg
                            ? 'bg-amber-200/80 text-amber-900'
                            : isRev
                            ? 'bg-purple-200/80 text-purple-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <span>Completed Session Records ({completedSessions.length})</span>
          </h5>
          <span className="text-[11px] text-slate-400">
            Click "Edit Record" to adjust attendance or lesson notes
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
            <span className="text-slate-500 font-medium">Loading session history...</span>
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No Finalized Sessions Yet</p>
            <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
              Completed sessions will appear here automatically once the faculty mentor wraps up a live acoustic class and marks attendance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((session) => {
              const attStatus = session.attendanceStatus || 'Present';
              const sessionDate = session.date || (session.scheduledAt ? session.scheduledAt.split('T')[0] : 'Historical');
              const whatWasTaught = session.whatWasTaught || session.topic || '';
              const lessonNotes = session.lessonNotes || session.teacherNotes || '';
              const homework = session.homeworkAssigned || '';
              const syllabusTopics = session.syllabusTopics || [];

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-left hover:border-slate-300 transition-colors"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        attStatus === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : attStatus === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {attStatus}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        Session #{session.sessionNumber || 1}: {session.courseTitle || session.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sessionDate}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Guru: {session.teacherName || 'Faculty Mentor'}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(session)}
                        className="ml-2 px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" />
                        <span>Edit Record</span>
                      </button>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* What Was Taught */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider flex items-center gap-1">
                        <Music className="w-3 h-3 text-amber-600" />
                        What Was Taught
                      </span>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {whatWasTaught || 'General vocal exercises and raga development.'}
                      </p>

                      {session.topicsCovered && session.topicsCovered.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {session.topicsCovered.map((tag, tagIdx) => (
                            <span key={tagIdx} className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700 font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lesson Notes */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600" />
                        Mentor Notes & Observations
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {lessonNotes || 'No specific notes recorded by guru.'}
                      </p>
                    </div>
                  </div>

                  {/* Syllabus topics & Homework details */}
                  {(syllabusTopics.length > 0 || homework) && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {syllabusTopics.length > 0 && (
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                            Syllabus:
                          </span>
                          {syllabusTopics.map((st, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              {st.topic} ({st.status})
                            </span>
                          ))}
                        </div>
                      )}

                      {homework && (
                        <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
                          <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Riyaz: <strong>{homework}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Administrative Correction */}
      {editingSession && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-1">
                  <ShieldCheck className="w-3 h-3 text-rose-700" />
                  Admin Institutional Correction
                </div>
                <h3 className="font-serif text-lg font-bold text-gray-900">
                  Edit Session Record #{editingSession.sessionNumber || 1}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {editingSession.studentName} • {editingSession.courseTitle || editingSession.topic} • {editingSession.date}
                </p>
              </div>

              <button
                onClick={() => setEditingSession(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {correctionFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                correctionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {correctionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{correctionFeedback.message}</span>
              </div>
            )}

            {/* Attendance Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Corrected Attendance Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Present', 'Late', 'Absent', 'Excused'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEditStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editStatus === st
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* What Was Taught */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                What Was Taught
              </label>
              <textarea
                rows={2}
                value={editWhatTaught}
                onChange={(e) => setEditWhatTaught(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Guru / Administrative Notes
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Mandatory Reason */}
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
              <label className="text-xs font-bold text-amber-950 block">
                Reason for Correction (Recorded in Audit Trail) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Student attended on alternate device; Guru submitted correction request."
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={isSavingCorrection}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingCorrection ? 'Saving...' : 'Save & Log Audit Trail'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
