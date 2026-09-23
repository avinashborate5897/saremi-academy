import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ClipboardList, 
  Mic, 
  Plus, 
  Edit3, 
  Check, 
  Music,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ClassSession, Assignment, UserProfile } from '../../types';
import { 
  subscribeToStudentSyllabusSummary, 
  SyllabusProgressSummary 
} from '../../lib/academicPostClassService';

interface AssignedStudent {
  id: string;
  name: string;
  discipline: string;
  packageName: string;
  classesCount: number;
  completedCount: number;
  remainingCount: number;
  status: string;
}

interface TeacherStudentProgressModalProps {
  student: AssignedStudent;
  classes: ClassSession[];
  assignments: Assignment[];
  onClose: () => void;
  onEditSession: (session: ClassSession) => void;
  onAssignPractice: (student: AssignedStudent) => void;
}

export const TeacherStudentProgressModal: React.FC<TeacherStudentProgressModalProps> = ({
  student,
  classes,
  assignments,
  onClose,
  onEditSession,
  onAssignPractice
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'syllabus' | 'sessions' | 'homework'>('overview');
  const [syllabusSummary, setSyllabusSummary] = useState<SyllabusProgressSummary | null>(null);

  // Student specific sessions
  const studentSessions = classes.filter(
    (c) => c.studentId === student.id && (c.status === 'completed' || c.attendanceRecorded)
  );

  const studentAssignments = assignments.filter((a) => a.studentId === student.id);

  // Calculate attendance metrics
  const totalCompleted = studentSessions.length;
  const presentCount = studentSessions.filter((s) => s.attendanceStatus === 'Present' || !s.attendanceStatus).length;
  const lateCount = studentSessions.filter((s) => s.attendanceStatus === 'Late').length;
  const absentCount = studentSessions.filter((s) => s.attendanceStatus === 'Absent').length;
  const attendanceRate = totalCompleted > 0 ? Math.round(((presentCount + lateCount) / totalCompleted) * 100) : 100;

  // Real-time syllabus subscription
  useEffect(() => {
    if (!student?.id) return;
    const unsub = subscribeToStudentSyllabusSummary(
      student.id,
      student.discipline || 'Hindustani Classical Vocal',
      undefined,
      (summary) => {
        setSyllabusSummary(summary);
      }
    );
    return () => unsub();
  }, [student?.id, student?.discipline]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6 text-left">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 font-serif font-bold text-2xl flex items-center justify-center shadow-xs">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold text-gray-900">{student.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  {student.status || 'Active Roster'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {student.discipline} • {student.packageName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
              Completed Classes
            </span>
            <div className="text-2xl font-serif font-bold text-amber-950 mt-1">
              {totalCompleted}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">
              of {student.classesCount || 12} enrolled
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              Attendance Rate
            </span>
            <div className="text-2xl font-serif font-bold text-emerald-950 mt-1">
              {attendanceRate}%
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              {presentCount} Present • {lateCount} Late
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
              Syllabus Validated
            </span>
            <div className="text-2xl font-serif font-bold text-purple-950 mt-1">
              {syllabusSummary?.percentageCompleted ?? 0}%
            </div>
            <span className="text-[10px] text-purple-700 font-medium">
              {syllabusSummary?.completedTopicsCount ?? 0} of {syllabusSummary?.totalTopics ?? 0} topics
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">
              Remaining Classes
            </span>
            <div className="text-2xl font-serif font-bold text-indigo-950 mt-1">
              {student.remainingCount}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium">
              Term Package Balance
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-4 text-xs font-bold text-gray-500">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'overview' ? 'border-amber-600 text-amber-900 font-bold' : 'border-transparent'
            }`}
          >
            Academic Overview
          </button>
          <button
            onClick={() => setActiveSubTab('syllabus')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'syllabus' ? 'border-amber-600 text-amber-900 font-bold' : 'border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Syllabus Breakdown ({syllabusSummary?.completedTopicsCount ?? 0}/{syllabusSummary?.totalTopics ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'sessions' ? 'border-amber-600 text-amber-900 font-bold' : 'border-transparent'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
            <span>Past Sessions ({studentSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('homework')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'homework' ? 'border-amber-600 text-amber-900 font-bold' : 'border-transparent'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-amber-600" />
            <span>Riyaz Tasks ({studentAssignments.length})</span>
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeSubTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick syllabus snapshot */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Syllabus Progression Snapshot
                </span>
                <button
                  onClick={() => setActiveSubTab('syllabus')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-0.5"
                >
                  View Full Syllabus <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                  style={{ width: `${syllabusSummary?.percentageCompleted ?? 0}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                <span>{syllabusSummary?.completedTopicsCount ?? 0} Topics Mastered</span>
                <span>{syllabusSummary?.inProgressTopicsCount ?? 0} In Progress</span>
                <span>{syllabusSummary?.remainingTopicsCount ?? 0} Remaining</span>
              </div>
            </div>

            {/* Recent Completed Sessions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-xs">Recent Lesson Records</h4>
                <button
                  onClick={() => setActiveSubTab('sessions')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-0.5"
                >
                  View All ({studentSessions.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {studentSessions.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-400 italic">
                  No completed sessions recorded yet. Conduct a live class to finalize lesson notes.
                </div>
              ) : (
                studentSessions.slice(0, 3).map((session, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{session.whatWasTaught || session.topic || session.courseTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          session.attendanceStatus === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {session.attendanceStatus || 'Present'}
                        </span>
                        <span className="text-[10px] text-gray-400">{session.date}</span>
                        <button
                          onClick={() => onEditSession(session)}
                          className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-800 font-bold border border-gray-200 text-[10px] cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {session.lessonNotes && (
                      <p className="text-gray-600 text-[11px]"><span className="font-semibold text-gray-700">Notes:</span> {session.lessonNotes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Full Syllabus Breakdown */}
        {activeSubTab === 'syllabus' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                Course: {syllabusSummary?.courseTitle || student.discipline}
              </span>
              <span className="text-gray-500 font-medium">
                {syllabusSummary?.completedTopicsCount ?? 0} of {syllabusSummary?.totalTopics ?? 0} topics completed
              </span>
            </div>

            {syllabusSummary?.pillars.map((pillar, pIdx) => (
              <div key={pIdx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
                <span className="font-bold text-gray-900 text-xs block">
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
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          isComp
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : isInProg
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                            : isRev
                            ? 'bg-purple-50/60 border-purple-200 text-purple-950'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isComp ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : isInProg ? (
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
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
                            : 'bg-gray-100 text-gray-500'
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
        )}

        {/* TAB 3: Past Sessions List */}
        {activeSubTab === 'sessions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">
                Completed Session Ledger ({studentSessions.length})
              </span>
              <span className="text-gray-400">Click "Edit" to adjust notes or attendance</span>
            </div>

            {studentSessions.length === 0 ? (
              <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 italic">
                No past sessions recorded yet for this student.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {studentSessions.map((session, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          session.attendanceStatus === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : session.attendanceStatus === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {session.attendanceStatus || 'Present'}
                        </span>
                        <span className="font-bold text-gray-900">
                          {session.whatWasTaught || session.topic || session.courseTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{session.date}</span>
                        <button
                          onClick={() => onEditSession(session)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-900 font-bold border border-gray-200 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    {session.lessonNotes && (
                      <p className="text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100 leading-relaxed text-[11px]">
                        <strong className="text-gray-900 block mb-0.5">Guru Observations:</strong>
                        {session.lessonNotes}
                      </p>
                    )}

                    {session.homeworkAssigned && (
                      <div className="text-[10px] font-medium text-amber-900 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded-lg">
                        Riyaz Assigned: <strong>{session.homeworkAssigned}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Homework */}
        {activeSubTab === 'homework' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">
                Assigned Riyaz & Homework ({studentAssignments.length})
              </span>
              <button
                onClick={() => onAssignPractice(student)}
                className="px-3 py-1 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Assign Task
              </button>
            </div>

            {studentAssignments.length === 0 ? (
              <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 italic">
                No practice tasks assigned yet for this student.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {studentAssignments.map((a, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-200 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{a.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        a.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px]">{a.description}</p>
                    {a.grade && (
                      <p className="text-emerald-700 font-bold text-[10px]">Grade: {a.grade}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => onAssignPractice(student)}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Practice Material
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
