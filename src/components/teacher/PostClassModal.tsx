import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  UserX, 
  FileText, 
  Save, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Check, 
  Plus, 
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck,
  Music,
  Lock,
  Mic
} from 'lucide-react';
import { ClassSession, UserProfile } from '../../types';
import { 
  getCourseSyllabus, 
  finalizeSessionAcademicWorkflow, 
  updateCompletedSessionAttendance,
  FinalizeSessionResult 
} from '../../lib/academicPostClassService';
import { AudioRecorderPlayer } from '../common/AudioRecorderPlayer';
import { createOrUpdateHomework, saveTeacherPrivateNote } from '../../lib/academicWorkspaceService';

interface PostClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classSession: ClassSession;
  currentUser?: UserProfile | null;
  onFinalized?: (result: FinalizeSessionResult) => void;
  onSubmit?: (data: any) => Promise<void>;
}

export const PostClassModal: React.FC<PostClassModalProps> = ({ 
  isOpen, 
  onClose, 
  classSession, 
  currentUser,
  onFinalized,
  onSubmit 
}) => {
  const isTrial = !!(classSession.isTrial || classSession.trialId || classSession.id?.startsWith('cls_trial'));
  const isAlreadyCompleted = classSession.status === 'completed' || !!classSession.finalizedAt;

  // Active sub-tab for organized workflow
  const [activeTab, setActiveTab] = useState<'attendance' | 'whatTaught' | 'syllabus' | 'notes' | 'homework' | 'private_notes'>('attendance');

  // Attendance State
  const [attendance, setAttendance] = useState<'Present' | 'Absent' | 'Late' | 'Excused'>(
    classSession.attendanceStatus || 'Present'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(classSession.actualDurationMinutes || classSession.durationMinutes || 45);

  // Homework Audio Demonstration State
  const [homeworkAudioUrl, setHomeworkAudioUrl] = useState<string | null>(null);
  const [homeworkAudioDuration, setHomeworkAudioDuration] = useState<number>(0);

  // Teacher Confidential Private Notes State (never shown to student)
  const [privateNoteContent, setPrivateNoteContent] = useState<string>('');
  const [privateWeakAreas, setPrivateWeakAreas] = useState<string>('');
  const [privateNextPlan, setPrivateNextPlan] = useState<string>('');

  // What was taught (with smart auto-draft)
  const defaultDraftTopic = classSession.whatWasTaught || classSession.topic || `${classSession.courseTitle || 'Classical Music'} - Live Mentorship Module`;
  const [whatWasTaught, setWhatWasTaught] = useState<string>(defaultDraftTopic);
  const [selectedQuickTags, setSelectedQuickTags] = useState<string[]>(
    classSession.topicsCovered && classSession.topicsCovered.length > 0
      ? classSession.topicsCovered
      : ['Breathing & Diaphragm Support', 'Tanpura Acoustic Alignment']
  );

  // Syllabus topics & progress
  const [syllabusSelections, setSyllabusSelections] = useState<Array<{
    topic: string;
    status: 'completed' | 'in_progress' | 'revision' | 'practice_required';
    notes?: string;
  }>>(
    classSession.syllabusTopics || []
  );

  // Detailed notes (with smart auto-draft)
  const defaultDraftNotes = classSession.lessonNotes || classSession.teacherNotes || 
    `Session covered ${defaultDraftTopic}. Good tonal precision and engagement. Focus during practice on steady breath support and clean transitions across swaras.`;
  const [lessonNotes, setLessonNotes] = useState<string>(defaultDraftNotes);
  const [techniquesTaught, setTechniquesTaught] = useState<string>(
    classSession.techniquesTaught || 'Intonation alignment, microtonal inflection, rhythm stability'
  );
  const [mistakesNoticed, setMistakesNoticed] = useState<string>(
    classSession.mistakesNoticed || 'Minor pitch drift during rapid phrase descent'
  );
  const [nextLessonFocus, setNextLessonFocus] = useState<string>(
    classSession.nextLessonFocus || 'Bandish elaboration and improvisation dynamics'
  );

  // Homework (with smart auto-draft)
  const defaultDraftHomework = classSession.homeworkAssigned
    ? (classSession.homeworkAssigned.split(':')[1] || classSession.homeworkAssigned)
    : `Daily 20-minute Riyaaz: 1) 5 min sustained swaras with Tanpura, 2) 10 min speed drills on today's lesson, 3) 5 min recorded run-through.`;
  const [hasHomework, setHasHomework] = useState<boolean>(true);
  const [homeworkTitle, setHomeworkTitle] = useState<string>(
    classSession.homeworkAssigned ? classSession.homeworkAssigned.split(':')[0] : 'Daily Practice & Swara Riyaaz'
  );
  const [homeworkInstructions, setHomeworkInstructions] = useState<string>(defaultDraftHomework);
  const [homeworkDueDate, setHomeworkDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Trial specific (legacy compatibility)
  const [recommendation, setRecommendation] = useState('Recommended for Level 1 Foundation Term.');
  const [recommendedLevel, setRecommendedLevel] = useState('Foundation');
  const [recommendedPackage, setRecommendedPackage] = useState('3-Month Foundation Term (24 Classes)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load course syllabus pillars
  const coursePillars = getCourseSyllabus(classSession.courseTitle || classSession.courseId || classSession.topic);

  // Popular quick tags for music sessions
  const quickMusicTags = [
    'Alankaar Drills 1-5',
    'Kharaj Riyaaz (Lower Octave)',
    'Breathing & Diaphragm Support',
    'Tanpura Acoustic Alignment',
    'Teentaal Clapping & Laya',
    'Bandish in Raag Yaman',
    'Raag Bhupali Aroha/Avroha',
    'Palta Speed Drills',
    'Microtonal Meend Slides',
    'Sight Reading & Posture'
  ];

  const handleToggleTag = (tag: string) => {
    if (selectedQuickTags.includes(tag)) {
      setSelectedQuickTags(selectedQuickTags.filter((t) => t !== tag));
    } else {
      setSelectedQuickTags([...selectedQuickTags, tag]);
      // Also append to whatWasTaught if empty or minimal
      if (!whatWasTaught.includes(tag)) {
        setWhatWasTaught((prev) => (prev ? `${prev}, ${tag}` : tag));
      }
    }
  };

  const handleToggleSyllabusTopic = (topicName: string, defaultStatus: 'completed' | 'in_progress' | 'revision' | 'practice_required' = 'completed') => {
    const existingIndex = syllabusSelections.findIndex((s) => s.topic === topicName);
    if (existingIndex >= 0) {
      // Remove
      setSyllabusSelections(syllabusSelections.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add
      setSyllabusSelections([
        ...syllabusSelections,
        { topic: topicName, status: defaultStatus }
      ]);
    }
  };

  const handleUpdateTopicStatus = (topicName: string, newStatus: 'completed' | 'in_progress' | 'revision' | 'practice_required') => {
    setSyllabusSelections(
      syllabusSelections.map((s) => s.topic === topicName ? { ...s, status: newStatus } : s)
    );
  };

  if (!isOpen) return null;

  const handleFinalizeSubmit = async () => {
    if (!attendance) {
      setSubmitError('Please specify the student attendance status.');
      return;
    }
    if (!whatWasTaught.trim() && selectedQuickTags.length === 0) {
      setSubmitError('Please summarize what was taught during this session.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const actorId = currentUser?.id || classSession.teacherId || 'faculty_user';
      const actorName = currentUser?.name || classSession.teacherName || 'Faculty Mentor';
      const actorEmail = currentUser?.email || 'mentor@saremi.academy';
      const actorRole: 'teacher' | 'admin' = (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') ? 'admin' : 'teacher';

      // If session is already completed, allow controlled update
      if (isAlreadyCompleted) {
        await updateCompletedSessionAttendance({
          sessionId: classSession.id,
          actor: { id: actorId, name: actorName, email: actorEmail, role: actorRole },
          status: attendance,
          lessonNotes,
          whatWasTaught: whatWasTaught || selectedQuickTags.join(', '),
          reason: 'Teacher updated post-class academic record.'
        });
        setSubmitSuccess('Historical academic record updated successfully.');
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      // Finalize atomic workflow
      const result = await finalizeSessionAcademicWorkflow({
        sessionId: classSession.id,
        session: classSession,
        actor: {
          id: actorId,
          name: actorName,
          email: actorEmail,
          role: actorRole
        },
        attendance: {
          status: attendance,
          durationMinutes: durationMinutes || 45,
          studentAttendedMinutes: durationMinutes || 45
        },
        academic: {
          whatWasTaught: whatWasTaught || selectedQuickTags.join(', '),
          topicsCovered: selectedQuickTags.length > 0 ? selectedQuickTags : [whatWasTaught],
          syllabusTopics: syllabusSelections
        },
        notes: {
          lessonNotes: lessonNotes || whatWasTaught,
          techniquesTaught,
          mistakesNoticed,
          nextLessonFocus,
          teacherFeedback: lessonNotes
        },
        homework: hasHomework ? {
          assigned: true,
          title: homeworkTitle.trim() || 'Riyaz Assignment',
          instructions: homeworkInstructions.trim() || 'Practice swara exercises daily for 20 minutes.',
          dueDate: homeworkDueDate
        } : undefined
      });

      // Save structured homework document with audio demonstration
      if (hasHomework) {
        try {
          await createOrUpdateHomework({
            sessionId: classSession.id,
            enrollmentId: classSession.enrollmentId,
            courseId: classSession.courseId || 'classical-music',
            courseTitle: classSession.courseTitle || classSession.topic || 'Classical Music Mentorship',
            studentId: classSession.studentId,
            studentName: classSession.studentName || 'Student',
            teacherId: classSession.teacherId,
            teacherName: classSession.teacherName || 'Faculty Guru',
            title: homeworkTitle.trim() || 'Riyaz Assignment',
            instructions: homeworkInstructions.trim() || 'Daily acoustic practice routine.',
            dueDate: homeworkDueDate,
            audioUrl: homeworkAudioUrl || undefined,
            audioTitle: 'Guru Audio Demonstration & Tanpura Tuning Reference',
            audioDurationSeconds: homeworkAudioDuration || undefined
          });
        } catch (hwErr) {
          console.warn('[PostClassModal] Could not save structured homework:', hwErr);
        }
      }

      // Save confidential teacher private note if provided
      if (privateNoteContent.trim()) {
        try {
          await saveTeacherPrivateNote({
            teacherId: classSession.teacherId,
            teacherName: classSession.teacherName,
            studentId: classSession.studentId,
            studentName: classSession.studentName,
            sessionId: classSession.id,
            courseTitle: classSession.courseTitle,
            weakAreas: privateWeakAreas,
            practiceObservations: privateNoteContent,
            nextLessonPlan: privateNextPlan,
            content: privateNoteContent
          });
        } catch (noteErr) {
          console.warn('[PostClassModal] Could not save private note:', noteErr);
        }
      }

      // Call optional legacy callback if provided
      if (onSubmit) {
        try {
          await onSubmit({
            attendance,
            notes: lessonNotes,
            whatWasTaught,
            homework: hasHomework ? `${homeworkTitle}: ${homeworkInstructions}` : '',
            recommendation,
            recommendedLevel,
            recommendedPackage,
            isTrial
          });
        } catch (e) {
          console.warn('Legacy onSubmit callback notice:', e);
        }
      }

      if (onFinalized) {
        onFinalized(result);
      }

      setSubmitSuccess('Session and academic records finalized permanently.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to finalize post-class session:', err);
      setSubmitError(err.message || 'Failed to finalize session records. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/80 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                Post-Class Academic Wrap-Up
              </span>
              {isAlreadyCompleted && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Completed Session (Edit Mode)
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
              {classSession.studentName || 'Student'} • {classSession.courseTitle || classSession.topic || 'Mentorship Class'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              <span>Date: {classSession.date || classSession.scheduledAt}</span>
              <span>•</span>
              <span>Scheduled Guru: {classSession.teacherName || 'Faculty Mentor'}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Smart Approval Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-emerald-500/10 border-b border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500 text-white text-xs font-bold">⚡</span>
            <div className="text-xs">
              <span className="font-bold text-gray-900">Auto-Drafted Academic Package: </span>
              <span className="text-gray-600">Attendance ({attendance}), topic, lesson notes & Riyaaz practice ready.</span>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalizeSubmit}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Finalizing...' : '1-Click Fast Approve'}</span>
          </button>
        </div>

        {/* Workflow Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6 overflow-x-auto gap-2 sm:gap-4 shrink-0 text-xs font-bold text-gray-500">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance' ? 'border-amber-600 text-gray-900' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Attendance ({attendance})</span>
          </button>

          <button
            onClick={() => setActiveTab('whatTaught')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'whatTaught' ? 'border-amber-600 text-gray-900' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-600" />
            <span>2. What Was Taught</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'syllabus' ? 'border-amber-600 text-gray-900' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Syllabus Topics ({syllabusSelections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'notes' ? 'border-amber-600 text-gray-900' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>4. Guru Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('homework')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'homework' ? 'border-amber-600 text-gray-900' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>5. Riyaz & Audio Demo {hasHomework ? '✓' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('private_notes')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'private_notes' ? 'border-purple-600 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>6. Guru Private Notes</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}
          {submitSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-600" />
                  Student Attendance Status <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Records student presence without creating duplicate rows in the institutional ledger.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAttendance('Present')}
                  className={`py-3.5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    attendance === 'Present' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Present</span>
                  <span className="text-[10px] font-normal text-gray-500">Attended live lesson</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('Late')}
                  className={`py-3.5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    attendance === 'Late' 
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-300' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Late</span>
                  <span className="text-[10px] font-normal text-gray-500">Joined after 10+ mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('Absent')}
                  className={`py-3.5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    attendance === 'Absent' 
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-300' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <UserX className="w-5 h-5 text-rose-600" />
                  <span>Absent</span>
                  <span className="text-[10px] font-normal text-gray-500">No-show / Missed</span>
                </button>
              </div>

              {/* Class duration input */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Actual Class Duration</span>
                  <span className="text-[11px] text-slate-500">Minutes taught during this 1:1 interaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                    className="w-20 px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold text-center bg-white"
                  />
                  <span className="text-xs font-medium text-slate-600">mins</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHAT WAS TAUGHT */}
          {activeTab === 'whatTaught' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-600" />
                  What Was Taught During This Lesson <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select core musical elements covered, or provide an exact breakdown of ragas, compositions, and swara exercises.
                </p>
              </div>

              {/* Quick Tags Palette */}
              <div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  Quick Pedagogical Tags (Click to toggle)
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickMusicTags.map((tag) => {
                    const isSelected = selectedQuickTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white font-bold shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-900 border border-gray-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Detailed Input */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-700 block">Lesson Content Summary</span>
                <textarea
                  rows={3}
                  value={whatWasTaught}
                  onChange={(e) => setWhatWasTaught(e.target.value)}
                  placeholder="e.g. Worked on Alankaar 3 and 4 in Vilambit laya. Started Raag Yaman bandish 'Eri Aali Piya Bin' sthaayi section with meend from Ni to Dha."
                  className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SYLLABUS TOPICS */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  Course Syllabus & Topic Progression
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Associate this session with official curriculum topics to update the student's historical learning path.
                </p>
              </div>

              {coursePillars.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                  No predefined curriculum pillars found for this course. You can record topics directly in 'What Was Taught'.
                </div>
              ) : (
                <div className="space-y-4">
                  {coursePillars.map((p, pIdx) => (
                    <div key={pIdx} className="p-4 rounded-2xl border border-gray-200 bg-slate-50/50 space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {p.title}
                      </h4>

                      <div className="space-y-2">
                        {p.topics.map((t, tIdx) => {
                          const selected = syllabusSelections.find((s) => s.topic === t);
                          return (
                            <div 
                              key={tIdx} 
                              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                selected 
                                  ? 'bg-white border-amber-300 shadow-xs' 
                                  : 'bg-white/80 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selected)}
                                  onChange={() => handleToggleSyllabusTopic(t)}
                                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span className={`text-xs ${selected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                  {t}
                                </span>
                              </div>

                              {selected && (
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                  <span className="text-[10px] text-gray-400 font-medium">Status:</span>
                                  <select
                                    value={selected.status}
                                    onChange={(e) => handleUpdateTopicStatus(t, e.target.value as any)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200 bg-amber-50/60 text-amber-900 cursor-pointer"
                                  >
                                    <option value="completed">Completed</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="revision">Revision</option>
                                    <option value="practice_required">Practice Required</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LECTURE NOTES & FEEDBACK */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Guru's Detailed Pedagogical Notes
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  These notes will be permanently accessible in the student's Sanctuary and class history log.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-700 block">General Lesson Feedback & Observations</span>
                <textarea
                  rows={3}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder="e.g. Excellent breath management today. Swara stability in Mandra Saptak has improved markedly over previous session."
                  className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-700 block">Techniques & Mechanics Taught</span>
                  <textarea
                    rows={2}
                    value={techniquesTaught}
                    onChange={(e) => setTechniquesTaught(e.target.value)}
                    placeholder="e.g. Lower jaw release, acoustic tanpura alignment at 432Hz."
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-700 block">Mistakes Noticed / Correction Areas</span>
                  <textarea
                    rows={2}
                    value={mistakesNoticed}
                    onChange={(e) => setMistakesNoticed(e.target.value)}
                    placeholder="e.g. Tendency to sharp the Komal Gandhar in ascending aroha."
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-700 block">Next Lesson Focus</span>
                <input
                  type="text"
                  value={nextLessonFocus}
                  onChange={(e) => setNextLessonFocus(e.target.value)}
                  placeholder="e.g. Antara section of Raag Yaman bandish and bol-aalap"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: HOMEWORK / RIYAZ */}
          {activeTab === 'homework' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Assign Riyaz / Practice Assignment</h4>
                    <p className="text-[11px] text-gray-500">Student will track this task in their Practice Studio.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHomework}
                    onChange={(e) => setHasHomework(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {hasHomework && (
                <div className="space-y-4 p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Assignment Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={homeworkTitle}
                      onChange={(e) => setHomeworkTitle(e.target.value)}
                      placeholder="e.g. Daily Kharaj Riyaaz & Alankaar 3-5 in 3 Layas"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Specific Instructions & Audio Target
                    </label>
                    <textarea
                      rows={3}
                      value={homeworkInstructions}
                      onChange={(e) => setHomeworkInstructions(e.target.value)}
                      placeholder="e.g. Practice each alankaar for 10 minutes at 60 BPM with acoustic tanpura. Focus on swara Sa-Re-Ga transitions without vocal strain."
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  {/* Teacher Audio Demonstration */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <AudioRecorderPlayer
                      label="Teacher Audio Demonstration (Microphone or File Upload)"
                      initialAudioUrl={homeworkAudioUrl || undefined}
                      onAudioReady={(url, secs) => {
                        setHomeworkAudioUrl(url);
                        setHomeworkAudioDuration(secs);
                      }}
                      onClear={() => {
                        setHomeworkAudioUrl(null);
                        setHomeworkAudioDuration(0);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Due Date:</span>
                    </div>
                    <input
                      type="date"
                      value={homeworkDueDate}
                      onChange={(e) => setHomeworkDueDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GURU PRIVATE NOTES (CONFIDENTIAL) */}
          {activeTab === 'private_notes' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Confidential Faculty Ledger</strong>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    These notes are strictly stored in the faculty ledger and will NEVER be visible to the student. Use this space for student weaknesses, technique assessments, and next class planning.
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl border border-purple-100 bg-white shadow-2xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Student Weaknesses & Vocal / Instrumental Bottlenecks
                  </label>
                  <textarea
                    rows={2}
                    value={privateWeakAreas}
                    onChange={(e) => setPrivateWeakAreas(e.target.value)}
                    placeholder="e.g. Upper octave breath pressure dropping. Tendency to rush the teentaal sam."
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Private Pedagogical Notes & Student Trajectory
                  </label>
                  <textarea
                    rows={3}
                    value={privateNoteContent}
                    onChange={(e) => setPrivateNoteContent(e.target.value)}
                    placeholder="e.g. Student is very receptive to visual scale analogies. Ready for raag improvisation next month if riyaz frequency maintains."
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Next Lesson Focus & Preparation
                  </label>
                  <input
                    type="text"
                    value={privateNextPlan}
                    onChange={(e) => setPrivateNextPlan(e.target.value)}
                    placeholder="e.g. Test memory on Drut Bandish Antara and introduce taans."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Attendance: <strong>{attendance}</strong></span>
            <span>•</span>
            <span>Topics: <strong>{syllabusSelections.length} marked</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFinalizeSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Persisting Records...' 
                  : isAlreadyCompleted 
                  ? 'Update Academic Record' 
                  : 'Finalize & Record Session'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
