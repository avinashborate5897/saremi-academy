import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  UserX,
  BookOpen,
  Music,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Award,
  Mic,
  MessageSquare,
  Lock,
  Download,
  Upload,
  Send,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { ClassSession, UserProfile, AcademicHomework, PracticeSubmission, TeacherPrivateNote } from '../../types';
import { formatSessionDateIST, formatSessionTimeIST } from '../../lib/sessionService';
import { useAuth } from '../../context/AuthContext';
import { AudioRecorderPlayer } from '../common/AudioRecorderPlayer';
import { ClassControlledChat } from '../classroom/ClassControlledChat';
import {
  getHomeworkForSession,
  subscribeToPracticeSubmissionsForHomework,
  submitPractice,
  reviewPracticeSubmission,
  getTeacherPrivateNotes,
  saveTeacherPrivateNote
} from '../../lib/academicWorkspaceService';
import { triggerHaptic } from '../../utils/haptics';

interface AcademicSessionModalProps {
  session: ClassSession | null;
  onClose: () => void;
  initialTab?: 'overview' | 'homework' | 'practice' | 'chat' | 'private_notes';
}

export const AcademicSessionModal: React.FC<AcademicSessionModalProps> = ({ session, onClose, initialTab = 'overview' }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'homework' | 'practice' | 'chat' | 'private_notes'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [homework, setHomework] = useState<AcademicHomework | null>(null);
  const [submissions, setSubmissions] = useState<PracticeSubmission[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  // Student practice submission state
  const [practiceAudioUrl, setPracticeAudioUrl] = useState<string | null>(null);
  const [practiceDuration, setPracticeDuration] = useState(0);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [isSubmittingPractice, setIsSubmittingPractice] = useState(false);
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  // Teacher Review state (if teacher/admin viewing student submission)
  const [selectedSubForReview, setSelectedSubForReview] = useState<PracticeSubmission | null>(null);
  const [teacherReviewGrade, setTeacherReviewGrade] = useState<'A+' | 'A' | 'B+' | 'B' | 'Needs Practice'>('A');
  const [teacherReviewNotes, setTeacherReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Teacher Private Note state
  const [privateNotes, setPrivateNotes] = useState<TeacherPrivateNote[]>([]);
  const [privateContent, setPrivateContent] = useState('');
  const [weakAreas, setWeakAreas] = useState('');
  const [nextLessonPlan, setNextLessonPlan] = useState('');
  const [isSavingPrivateNote, setIsSavingPrivateNote] = useState(false);
  const [privateNoteSuccess, setPrivateNoteSuccess] = useState(false);

  const currentUserId = user?.uid || profile?.id || '';
  const isTeacher = profile?.role === 'teacher' || currentUserId === session?.teacherId;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isFacultyOrAdmin = isTeacher || isAdmin;

  useEffect(() => {
    if (!session?.id) return;

    let unsubSubs: (() => void) | null = null;

    const loadData = async () => {
      setLoadingWorkspace(true);
      try {
        const hw = await getHomeworkForSession(session.id);
        setHomework(hw);

        if (hw?.id) {
          unsubSubs = subscribeToPracticeSubmissionsForHomework(hw.id, (subs) => {
            setSubmissions(subs);
          });
        }

        if (isFacultyOrAdmin && session.studentId) {
          const notes = await getTeacherPrivateNotes(session.teacherId, session.studentId);
          setPrivateNotes(notes);
          const currentNote = notes.find((n) => n.sessionId === session.id);
          if (currentNote) {
            setPrivateContent(currentNote.content || '');
            setWeakAreas(currentNote.weakAreas || '');
            setNextLessonPlan(currentNote.nextLessonPlan || '');
          }
        }
      } catch (err) {
        console.warn('Error loading academic workspace data:', err);
      } finally {
        setLoadingWorkspace(false);
      }
    };

    loadData();

    return () => {
      if (unsubSubs) unsubSubs();
    };
  }, [session?.id, isFacultyOrAdmin]);

  if (!session) return null;

  const classDate = formatSessionDateIST(session);
  const classTime = formatSessionTimeIST(session);
  const courseTitle = session.courseTitle || session.topic || 'Classical Mentorship Session';
  const teacherName = session.teacherName || 'Faculty Guru';
  const studentName = session.studentName || 'Student';
  const attendanceStatus = session.attendanceStatus || (session.status === 'completed' ? 'Present' : 'Scheduled');

  // Topics covered / syllabus
  const whatWasTaught = session.whatWasTaught || session.topic || '';
  const topicsCovered = session.topicsCovered || [];
  const syllabusTopics = session.syllabusTopics || [];
  const lessonNotes = session.lessonNotes || session.teacherNotes || '';
  const initialHomeworkTitle = session.homeworkAssigned || homework?.title || '';

  const handleStudentSubmitPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homework?.id && !initialHomeworkTitle) return;
    if (!practiceAudioUrl && !practiceNotes.trim()) {
      alert('Please record an audio practice demo or write your riyaz practice notes.');
      return;
    }

    setIsSubmittingPractice(true);
    triggerHaptic('medium');
    try {
      await submitPractice({
        homeworkId: homework?.id || `hw_${session.id}`,
        sessionId: session.id,
        enrollmentId: session.enrollmentId,
        studentId: session.studentId || currentUserId,
        studentName: session.studentName || profile?.name || 'Student',
        teacherId: session.teacherId,
        teacherName: session.teacherName || 'Faculty Guru',
        audioUrl: practiceAudioUrl || undefined,
        durationSeconds: practiceDuration || undefined,
        notes: practiceNotes.trim() || undefined
      });

      triggerHaptic('success');
      setPracticeSuccess(true);
      setPracticeNotes('');
      setPracticeAudioUrl(null);
      setTimeout(() => setPracticeSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to submit practice:', err);
      alert(err.message || 'Error submitting practice.');
      triggerHaptic('warning');
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const handleSaveTeacherReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForReview || !homework?.id) return;

    setIsSubmittingReview(true);
    triggerHaptic('medium');
    try {
      await reviewPracticeSubmission({
        submissionId: selectedSubForReview.id,
        homeworkId: homework.id,
        feedbackText: teacherReviewNotes,
        grade: teacherReviewGrade,
        status: 'REVIEWED',
        reviewerName: profile?.name || 'Faculty Guru'
      });

      triggerHaptic('success');
      setSelectedSubForReview(null);
      setTeacherReviewNotes('');
    } catch (err: any) {
      console.error('Failed to save teacher review:', err);
      alert(err.message || 'Error saving review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSavePrivateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateContent.trim()) return;

    setIsSavingPrivateNote(true);
    triggerHaptic('medium');
    try {
      const saved = await saveTeacherPrivateNote({
        teacherId: session.teacherId,
        teacherName: session.teacherName,
        studentId: session.studentId,
        studentName: session.studentName,
        sessionId: session.id,
        courseTitle: session.courseTitle,
        weakAreas,
        practiceObservations: privateContent,
        nextLessonPlan,
        content: privateContent
      });

      triggerHaptic('success');
      setPrivateNoteSuccess(true);
      setPrivateNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
      setTimeout(() => setPrivateNoteSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save private note:', err);
      alert(err.message || 'Error saving private note.');
    } finally {
      setIsSavingPrivateNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 text-left">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 flex flex-col max-h-[92vh] border border-gray-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/80 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Verified Academic Ledger
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                Session #{session.sessionNumber || 1}
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
              {courseTitle}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {classDate} at {classTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Guru: <strong className="text-gray-900">{teacherName}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Student: <strong className="text-gray-900">{studentName}</strong>
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-white border-b border-gray-200 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('overview');
            }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum & Overview
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('homework');
            }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'homework'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Assigned Riyaz & Audio Demo
            {(homework?.audioUrl || initialHomeworkTitle) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('practice');
            }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'practice'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Practice Studio & Reviews
            {submissions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-mono">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('chat');
            }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Class Messages
          </button>

          {isFacultyOrAdmin && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('private_notes');
              }}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'private_notes'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              Guru Private Notes
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Attendance Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      attendanceStatus === 'Present'
                        ? 'bg-emerald-100 text-emerald-700'
                        : attendanceStatus === 'Late'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {attendanceStatus === 'Present' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : attendanceStatus === 'Late' ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <UserX className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Attendance Verification
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {attendanceStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Duration:{' '}
                    <strong>{session.actualDurationMinutes || session.durationMinutes || 45} mins</strong>
                  </span>
                </div>
              </div>

              {/* What Was Taught */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-600" />
                  What Was Taught & Concepts Covered
                </h4>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2.5">
                  {whatWasTaught ? (
                    <p className="text-xs text-gray-800 leading-relaxed font-medium">
                      {whatWasTaught}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No specific overview recorded for this session.</p>
                  )}

                  {topicsCovered.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {topicsCovered.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Syllabus Topics */}
              {syllabusTopics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    Curriculum Progression
                  </h4>
                  <div className="space-y-2">
                    {syllabusTopics.map((st, sIdx) => {
                      const isComp = st.status === 'completed';
                      const isInProg = st.status === 'in_progress';
                      return (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {st.topic}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              isComp
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInProg
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isComp ? 'Completed' : isInProg ? 'In Progress' : 'Practice Required'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guru Pedagogical Notes */}
              {lessonNotes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Guru's Feedback & Session Notes
                  </h4>
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {lessonNotes}
                  </div>
                </div>
              )}

              {/* Technical Breakdown */}
              {(session.techniquesTaught || session.mistakesNoticed || session.nextLessonFocus) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {session.techniquesTaught && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Techniques Taught:</span>
                      <p className="text-slate-600 leading-relaxed">{session.techniquesTaught}</p>
                    </div>
                  )}
                  {session.mistakesNoticed && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Key Corrections & Focus:</span>
                      <p className="text-slate-600 leading-relaxed">{session.mistakesNoticed}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGNED HOMEWORK & AUDIO DEMONSTRATION */}
          {activeTab === 'homework' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50/30 border border-amber-200/80 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md inline-block mb-1.5">
                      Riyaz Assignment
                    </span>
                    <h4 className="text-base font-bold text-gray-900">
                      {homework?.title || initialHomeworkTitle || 'Assigned Musical Riyaz'}
                    </h4>
                    {homework?.dueDate && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Target Completion: <strong>{new Date(homework.dueDate).toLocaleDateString()}</strong>
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      homework?.status === 'reviewed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : homework?.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {homework?.status || 'Assigned'}
                  </span>
                </div>

                {homework?.instructions && (
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-gray-800 leading-relaxed font-medium">
                    <p className="whitespace-pre-wrap">{homework.instructions}</p>
                  </div>
                )}

                {/* Teacher Audio Demonstration */}
                {homework?.audioUrl ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-700" />
                      Guru Audio Demonstration & Tanpura Tuning Reference
                    </span>
                    <AudioRecorderPlayer
                      label={homework.audioTitle || 'Faculty Audio Master Demo'}
                      initialAudioUrl={homework.audioUrl}
                      onAudioReady={() => {}}
                      readOnly={true}
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                    No teacher audio demonstration was attached to this lesson.
                  </div>
                )}

                {/* Attached Resources */}
                {homework?.resources && homework.resources.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Notation Sheets & Study Materials
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {homework.resources.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-amber-400 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-semibold text-gray-800 truncate group-hover:text-amber-800">
                              {res.title}
                            </span>
                          </div>
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-700 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRACTICE STUDIO & STUDENT SUBMISSION */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              {/* Student Upload/Record Practice Section */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-600" />
                    Record Your Riyaz Practice
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Record your practice directly using your microphone or upload an audio file for your Guru to review.
                  </p>
                </div>

                {practiceSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Practice recording submitted successfully! Your Guru will provide feedback soon.</span>
                  </div>
                )}

                <form onSubmit={handleStudentSubmitPractice} className="space-y-4">
                  <AudioRecorderPlayer
                    label="Student Practice Recording (Voice / Instrument)"
                    initialAudioUrl={practiceAudioUrl || undefined}
                    onAudioReady={(url, secs) => {
                      setPracticeAudioUrl(url);
                      setPracticeDuration(secs);
                    }}
                    onClear={() => {
                      setPracticeAudioUrl(null);
                      setPracticeDuration(0);
                    }}
                  />

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Student Practice Notes & Tempo / Raag Observations
                    </label>
                    <textarea
                      rows={2}
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="e.g. Practiced sargam speed at 80 BPM. Struggled slightly with the komal Ga transition."
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingPractice || (!practiceAudioUrl && !practiceNotes.trim())}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmittingPractice ? 'Submitting...' : 'Submit Practice to Guru'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Submissions History & Guru Reviews */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  Practice History & Guru Reviews ({submissions.length})
                </h4>

                {submissions.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center text-gray-400 text-xs">
                    No practice recordings submitted yet. Record and submit above!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {sub.studentName}'s Recording
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(sub.submittedAt).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {sub.teacherGrade && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                Grade: {sub.teacherGrade}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                sub.status === 'REVIEWED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        </div>

                        {sub.audioUrl && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <audio controls src={sub.audioUrl} className="w-full h-8" />
                          </div>
                        )}

                        {sub.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl italic">
                            "{sub.notes}"
                          </p>
                        )}

                        {/* Teacher's Feedback */}
                        {sub.teacherFeedbackText && (
                          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-900 block">
                              Guru Pedagogical Evaluation:
                            </span>
                            <p className="text-xs text-gray-800 font-medium leading-relaxed">
                              {sub.teacherFeedbackText}
                            </p>
                          </div>
                        )}

                        {/* Faculty Action: Review submission if teacher/admin */}
                        {isFacultyOrAdmin && !sub.teacherFeedbackText && (
                          <button
                            type="button"
                            onClick={() => setSelectedSubForReview(sub)}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer transition-colors"
                          >
                            Grade & Review Submission
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Modal for Faculty */}
              {selectedSubForReview && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Grade Student Submission
                    </h5>
                    <button
                      onClick={() => setSelectedSubForReview(null)}
                      className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSaveTeacherReview} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Performance Grade
                      </label>
                      <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                        {(['A+', 'A', 'B+', 'B', 'Needs Practice'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setTeacherReviewGrade(g)}
                            className={`py-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                              teacherReviewGrade === g
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Pedagogical Critique & Riyaz Advice
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={teacherReviewNotes}
                        onChange={(e) => setTeacherReviewNotes(e.target.value)}
                        placeholder="Detail pitch accuracy, sur / taal alignment, and recommended daily practice routine."
                        className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubForReview(null)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !teacherReviewNotes.trim()}
                        className="px-4 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Saving...' : 'Submit Evaluation'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLASS-SPECIFIC CONTROLLED CHAT */}
          {activeTab === 'chat' && (
            <ClassControlledChat
              sessionId={session.id}
              enrollmentId={session.enrollmentId}
              currentUser={profile}
              teacherId={session.teacherId}
              teacherName={teacherName}
              studentId={session.studentId}
              studentName={studentName}
              courseTitle={courseTitle}
            />
          )}

          {/* TAB 5: FACULTY PRIVATE NOTES (STRICTLY HIDDEN FROM STUDENT) */}
          {activeTab === 'private_notes' && isFacultyOrAdmin && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Confidential Pedagogical Ledger</strong>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    These notes are strictly private to Conservatory Faculty and Administration. They are never shown to the student.
                  </p>
                </div>
              </div>

              {privateNoteSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Private notes updated successfully.</span>
                </div>
              )}

              <form onSubmit={handleSavePrivateNote} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Weaknesses & Technical Observations
                  </label>
                  <textarea
                    rows={2}
                    value={weakAreas}
                    onChange={(e) => setWeakAreas(e.target.value)}
                    placeholder="e.g. Vocal strain on upper octave Pa. Hand posture needs relaxation."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Detailed Pedagogical Observations & Lesson Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={privateContent}
                    onChange={(e) => setPrivateContent(e.target.value)}
                    placeholder="Private notes on musical retention, ear training progress, and engagement..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Next Lesson Focus & Plan
                  </label>
                  <input
                    type="text"
                    value={nextLessonPlan}
                    onChange={(e) => setNextLessonPlan(e.target.value)}
                    placeholder="e.g. Introduce Drut Teentaal bandish in Raag Bhairav."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPrivateNote || !privateContent.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isSavingPrivateNote ? 'Saving...' : 'Save Private Note'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            Permanent record in Saremi Conservatory Academic Ledger.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </motion.div>
    </div>
  );
};
