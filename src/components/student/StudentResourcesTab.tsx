import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Music, 
  Play, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  Award, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
  Info,
  X
} from 'lucide-react';
import { UserProfile, StudentSubscriptionStatus, Assignment } from '../../types';
import { useRouter } from '../../router/RouterContext';
import { ExpiredAccessLock } from '../common/ExpiredAccessLock';
import { subscribeToStudentHomework, updateHomeworkStatus } from '../../lib/academicPostClassService';

interface StudentResourcesTabProps {
  profile: UserProfile | null;
  subscriptionStatus?: StudentSubscriptionStatus;
  onRenew?: () => void;
}

export const StudentResourcesTab: React.FC<StudentResourcesTabProps> = ({ profile, subscriptionStatus, onRenew }) => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pdf' | 'audio' | 'assignments'>('all');
  const [submittedAssignmentId, setSubmittedAssignmentId] = useState<string | null>(null);
  const [realAssignments, setRealAssignments] = useState<Assignment[]>([]);
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const hasEverHadPaidEnrollment = Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.length > 0;
  const isAccessLocked = subscriptionStatus?.isExpired && hasEverHadPaidEnrollment;

  useEffect(() => {
    if (!profile?.id) return;
    const enrolledCourse = Array.isArray(profile?.enrolledCourses) ? profile?.enrolledCourses[0] : undefined;
    const unsub = subscribeToStudentHomework(profile.id, enrolledCourse?.enrollmentId, (hw) => {
      setRealAssignments(hw);
    });
    return () => unsub();
  }, [profile?.id]);

  const handleUpdateStatus = async (asgId: string, newStatus: 'in_progress' | 'submitted') => {
    setIsUpdatingStatus(asgId);
    try {
      await updateHomeworkStatus(asgId, newStatus, submissionNotes[asgId]);
      setSubmittedAssignmentId(asgId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const pdfResources = [
    {
      id: 'pdf_01',
      title: 'Raag Yaman Complete Notation & Bandish Sheet',
      category: 'Bandish Notation',
      size: '2.4 MB',
      updatedAt: 'Sep 12, 2026',
      description: 'Full Bhatkhande notation for "Eri Aali Piya Bina" including Sthayi, Antara, and 8-matra bol taans.'
    },
    {
      id: 'pdf_02',
      title: 'Kharaj Sadhana & Morning Vocal Warm-ups Guide',
      category: 'Voice Culture',
      size: '1.8 MB',
      updatedAt: 'Sep 08, 2026',
      description: 'Diaphragmatic breathing drills and Mandra Saptak note charts for vocal range expansion.'
    },
    {
      id: 'pdf_03',
      title: 'Teentaal (16 Matras) & Keherwa (8 Matras) Theka Chart',
      category: 'Rhythm / Taal',
      size: '1.1 MB',
      updatedAt: 'Sep 04, 2026',
      description: 'Hand clapping gestures (Tali/Khali), vibhaag divisions, and Dugun/Chaugun recitation guide.'
    },
    {
      id: 'pdf_04',
      title: 'Gandharva Mahavidyalaya Prarambhik Syllabus Handbook',
      category: 'Certification',
      size: '3.6 MB',
      updatedAt: 'Aug 28, 2026',
      description: 'Official exam guidelines, theoretical definitions (Vadi, Samvadi, Pakad), and oral viva questions.'
    }
  ];

  const teacherAudioNotes = [
    {
      id: 'aud_01',
      title: 'Guru Feedback: Mandra Dhaivat & Rishabh Intonation',
      mentor: 'Vidushi Sunanda Sharma',
      duration: '1:45 min',
      date: 'Sep 14, 2026',
      note: 'Listen to the subtle meend transition from Komal Dha to Pa.'
    },
    {
      id: 'aud_02',
      title: 'Reference Vocal Track: Raag Yaman Bandish in Teentaal',
      mentor: 'Vidushi Sunanda Sharma',
      duration: '4:20 min',
      date: 'Sep 11, 2026',
      note: 'Reference vocal recording with Tanpura and Tabla accompaniment at 80 BPM.'
    }
  ];

  const assignments = [
    {
      id: 'asg_01',
      title: 'Record 2-Minute Aalap in Raag Yaman with Tanpura',
      due: 'Sep 22, 2026',
      status: 'pending',
      instructions: 'Start in Mandra Saptak (Ni), move gradually up to Ga and Pa without rushing. Hold each note for at least 8 counts.'
    },
    {
      id: 'asg_02',
      title: 'Recite Teentaal Theka with Hand Claps (Dugun Speed)',
      due: 'Sep 15, 2026',
      status: 'submitted',
      grade: 'Grade A',
      feedback: 'Splendid tempo stability! Your Sam emphasis on "Dha" was crisp and accurate.'
    }
  ];

  const [resourceNotice, setResourceNotice] = useState<string | null>(null);

  const handleDownload = (item: { title: string; fileUrl?: string }) => {
    if (item.fileUrl && (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://') || item.fileUrl.startsWith('/'))) {
      const link = document.createElement('a');
      link.href = item.fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = item.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setResourceNotice(`"${item.title}": Material is being prepared by your mentor for your current learning module.`);
      setTimeout(() => setResourceNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Notice Banner */}
      {resourceNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{resourceNotice}</span>
          </div>
          <button onClick={() => setResourceNotice(null)} className="p-1 text-amber-700 hover:text-amber-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
            <Music className="w-3.5 h-3.5 text-amber-700" />
            Conservatory Learning Library
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Practice & Resources</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            PDF notation guides, Tanpura tracks, mentor voice memos, and weekly riyaz tasks.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/practice')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Volume2 className="w-4 h-4" />
          <span>Launch Tanpura Studio</span>
        </button>
      </div>

      {isAccessLocked && (
        <ExpiredAccessLock
          subscriptionStatus={subscriptionStatus}
          resourceName="Learning Materials & Practice Tools"
          onRenew={onRenew}
        />
      )}

      {/* Quick Launch Practice Studio Bar */}
      <div className={`bg-gradient-to-r from-amber-900 via-gray-900 to-black text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg transition-all ${isAccessLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base text-white">Daily Riyaz Engine</h4>
            <p className="text-xs text-gray-300">Acoustic Tanpura in 12 Tonic Keys • 4 Classical Taals • Pitch Tuner</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/practice')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
        >
          Open Studio
        </button>
      </div>

      {/* 1. PDF NOTATION & SYLLABUS GUIDES */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            PDF Library & Notations
          </h3>
          <span className="text-xs font-mono font-bold text-gray-400">{pdfResources.length} Documents</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pdfResources.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                    {doc.category}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 font-bold">{doc.size}</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 leading-snug">{doc.title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{doc.description}</p>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Updated {doc.updatedAt}</span>
                <button
                  onClick={() => handleDownload(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. TEACHER-UPLOADED AUDIO RESOURCES */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            Guru Voice Notes & Reference Recordings
          </h3>
          <span className="text-xs font-mono font-bold text-gray-400">{teacherAudioNotes.length} Recordings</span>
        </div>

        <div className="space-y-3">
          {teacherAudioNotes.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                  <p className="text-xs text-indigo-900/70 mt-0.5">
                    By <strong>{item.mentor}</strong> • {item.date}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 italic">"{item.note}"</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  {item.duration}
                </span>
                <button
                  onClick={() => handleDownload(item)}
                  className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                  title="Download Recording"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ASSIGNMENTS & VIDEO HOMEWORK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-600" />
            Weekly Homework & Submissions
          </h3>
          <span className="text-xs font-mono font-bold text-gray-400">Feedback within 24h</span>
        </div>

        <div className="space-y-4">
          {realAssignments.length > 0 ? (
            realAssignments.map((asg) => {
              const st = (asg.status || 'pending').toLowerCase();
              const isComp = st === 'completed' || st === 'submitted' || st === 'reviewed';
              const isInProg = st === 'in_progress';

              return (
                <div
                  key={asg.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isComp
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : isInProg
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-base text-gray-900">{asg.title}</h4>
                      {asg.courseTitle && (
                        <p className="text-[11px] text-gray-500 font-medium">{asg.courseTitle}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                      isComp
                        ? 'bg-emerald-100 text-emerald-800'
                        : isInProg
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {asg.status || 'Assigned'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {asg.description || asg.instructions}
                  </p>

                  {asg.grade && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                          {asg.grade}
                        </span>
                        <strong className="text-gray-900">Guru Feedback:</strong>
                      </div>
                      <p className="text-gray-700 italic">"{asg.feedback}"</p>
                    </div>
                  )}

                  {/* Interactive Status & Notes */}
                  <div className="pt-3 border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(asg.id, 'in_progress')}
                        disabled={isUpdatingStatus === asg.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          isInProg
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        In Progress
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(asg.id, 'submitted')}
                        disabled={isUpdatingStatus === asg.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isComp
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed Riyaz</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-gray-400 font-medium">
                      {asg.dueDate ? `Due: ${asg.dueDate}` : 'Daily Classical Discipline'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            assignments.map((asg) => (
              <div
                key={asg.id}
                className={`p-5 rounded-2xl border transition-all ${
                  asg.status === 'submitted'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-base text-gray-900">{asg.title}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                    asg.status === 'submitted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {asg.status === 'submitted' ? 'Reviewed by Guru' : `Due by ${asg.due}`}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  {asg.instructions}
                </p>

                {asg.status === 'submitted' ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                        {asg.grade}
                      </span>
                      <strong className="text-gray-900">Guru Evaluation:</strong>
                    </div>
                    <p className="text-gray-700 italic">"{asg.feedback}"</p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">Attach MP3 / MP4 video recording</span>
                    {submittedAssignmentId === asg.id ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Uploaded for Guru Review
                      </span>
                    ) : (
                      <button
                        onClick={() => setSubmittedAssignmentId(asg.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Recording</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
