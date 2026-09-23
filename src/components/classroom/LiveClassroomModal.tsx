import { startLiveClass } from "../../lib/academyWorkflowService";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTablaSound, playTanpuraPluck } from '../../lib/audioSynthesis';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Music,
  Clock,
  Sparkles,
  BookOpen,
  MessageSquare,
  Share2,
  Maximize2,
  Settings,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Send,
  Sliders,
  ChevronDown,
  X,
  Minimize2
} from 'lucide-react';
import { ClassSession, UserProfile, Role } from '../../types';
import { VideoClassroom } from './VideoClassroom';
import { VirtualBackgroundControls } from './VirtualBackgroundControls';
import { recordLiveClassAttendance } from '../../lib/academyWorkflowService';
import { completeTrialWithAssessment } from '../../lib/courseCrmService';

interface LiveClassroomModalProps {
  session: ClassSession;
  currentUser?: UserProfile | null;
  role?: Role;
  subscriptionStatus?: any;
  onClose: () => void;
  onClassCompleted?: () => void;
  onRenew?: () => void;
}

// 12 Semitones for Tanpura Sa
const PITCH_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FREQ_MAP: Record<string, number> = {
  'C': 130.81, 'C#': 138.59, 'D': 146.83, 'D#': 155.56,
  'E': 164.81, 'F': 174.61, 'F#': 185.00, 'G': 196.00,
  'G#': 207.65, 'A': 220.00, 'A#': 233.08, 'B': 246.94
};

const TAAL_OPTIONS = [
  { name: 'Teentaal', beats: 16, vibhag: [4, 4, 4, 4], tali: [1, 5, 13], khali: [9] },
  { name: 'Keherwa', beats: 8, vibhag: [4, 4], tali: [1], khali: [5] },
  { name: 'Dadra', beats: 6, vibhag: [3, 3], tali: [1], khali: [4] },
  { name: 'Rupak', beats: 7, vibhag: [3, 2, 2], tali: [4, 6], khali: [1] },
  { name: 'Jhaptal', beats: 10, vibhag: [2, 3, 2, 3], tali: [1, 3, 8], khali: [6] },
  { name: '4/4 Common', beats: 4, vibhag: [4], tali: [1], khali: [] }
];

export const LiveClassroomModal: React.FC<LiveClassroomModalProps> = ({
  session,
  currentUser,
  role = 'student',
  subscriptionStatus,
  onClose,
  onClassCompleted,
  onRenew
}) => {
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin' || role === 'instructor';
  const isTrial = Boolean(session.isTrial || session.trialId || session.id?.startsWith('cls_trial'));

  // AV State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'chat' | 'notes' | 'attendance'>('tools');
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const handleTabClick = (tab: 'tools' | 'chat' | 'notes' | 'attendance') => {
    if (activeTab === tab && isMobilePanelOpen) {
      setIsMobilePanelOpen(false);
    } else {
      setActiveTab(tab);
      setIsMobilePanelOpen(true);
    }
  };

  // Tanpura State & Audio Synthesis
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState('C#');
  const [tanpuraString, setTanpuraString] = useState<'Pa' | 'Ma' | 'Ni'>('Pa');
  const [tanpuraVolume, setTanpuraVolume] = useState(0.7);

  // Metronome State
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [selectedTaal, setSelectedTaal] = useState(TAAL_OPTIONS[0]);
  const [currentBeat, setCurrentBeat] = useState(1);

  // Notes & Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: session.teacherName || 'Guru',
      text: 'Namaste! Welcome to today’s session. Let’s begin with Kharaj Riyaaz and Sa-Pa tuning.',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [lessonNotes, setLessonNotes] = useState(
    session.lessonNotes || 'Raag Yaman - Aroha, Avroha & Chhota Khayal Bandish: "Eri Aali Piya Bina"'
  );
  const [homeworkInput, setHomeworkInput] = useState(session.homeworkAssigned || '');
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const classStartTimeRef = useRef<number>(Date.now());
  const studentAttendanceDurationRef = useRef<number>(0);
  const studentLastJoinedAtRef = useRef<number | null>(null);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tanpuraIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndClassConfirm, setShowEndClassConfirm] = useState(false);

  // Auto-mark class as live in Firestore when teacher enters studio
  useEffect(() => {
    if (isTeacherOrAdmin && session?.id && session.status !== 'live') {
      startLiveClass(session.id).catch((err) => {
        console.warn('Notice setting class status to live:', err);
      });
    }
  }, [isTeacherOrAdmin, session?.id, session?.status]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  const handleStudentJoined = () => {
    if (!studentLastJoinedAtRef.current) {
      studentLastJoinedAtRef.current = Date.now();
    }
  };

  const handleStudentLeft = () => {
    if (studentLastJoinedAtRef.current) {
      const durationMs = Date.now() - studentLastJoinedAtRef.current;
      studentAttendanceDurationRef.current += durationMs;
      studentLastJoinedAtRef.current = null;
    }
  };

  // -------------------------------------------------------------
  // Web Audio Tanpura Synthesis
  // -------------------------------------------------------------
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      try {
        
        if (window.AudioContext || (window as any).webkitAudioContext) {
          audioCtxRef.current = window.AudioContext ? new window.AudioContext() : new (window as any).webkitAudioContext();
        }
      } catch (err) {
        console.warn('AudioContext is not supported or allowed:', err);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  

  const startTanpuraLoop = () => {
    const root = FREQ_MAP[selectedPitch] || 138.59;
    let firstStringFreq = root * 1.5; // Pa = 3/2
    if (tanpuraString === 'Ma') firstStringFreq = root * (4 / 3);
    if (tanpuraString === 'Ni') firstStringFreq = root * (15 / 8) * 0.5;

    const pluckSequence = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      playTanpuraPluck(ctx, firstStringFreq, tanpuraVolume);
      setTimeout(() => playTanpuraPluck(ctx, root * 2, tanpuraVolume), 700);
      setTimeout(() => playTanpuraPluck(ctx, root * 2, tanpuraVolume), 1400);
      setTimeout(() => playTanpuraPluck(ctx, root, tanpuraVolume), 2100);
    };

    pluckSequence();
    tanpuraIntervalRef.current = setInterval(pluckSequence, 2800);
    setIsTanpuraPlaying(true);
  };

  const stopTanpura = () => {
    if (tanpuraIntervalRef.current) {
      clearInterval(tanpuraIntervalRef.current);
      tanpuraIntervalRef.current = null;
    }
    setIsTanpuraPlaying(false);
  };

  useEffect(() => {
    if (isTanpuraPlaying) {
      stopTanpura();
      startTanpuraLoop();
    }
  }, [selectedPitch, tanpuraString, tanpuraVolume]);

  useEffect(() => {
    return () => {
      stopTanpura();
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // Metronome Click Synthesis
  // -------------------------------------------------------------
  const playClick = (isSam: boolean, isKhali: boolean = false) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    let soundType: 'dha' | 'dhin' | 'tin' | 'na' = 'na';
    if (isSam) soundType = 'dha';
    else if (isKhali) soundType = 'tin';
    else soundType = 'dhin';
    
    playTablaSound(ctx, soundType, 300);
  };

  useEffect(() => {
    if (!isMetronomePlaying) {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    metroIntervalRef.current = window.setInterval(() => {
      setCurrentBeat((prev) => {
        const next = prev >= selectedTaal.beats ? 1 : prev + 1;
        const isSom = next === 1;
        const isKhali = (selectedTaal as any).khali ? (selectedTaal as any).khali.includes(next) : false;
        playClick(isSom, isKhali);
        return next;
      });
    }, intervalMs);

    return () => {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, [isMetronomePlaying, bpm, selectedTaal]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: currentUser?.name || (isTeacherOrAdmin ? 'Guru' : 'Student'),
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  const handleSaveAttendanceAndComplete = async () => {
    setIsSavingAttendance(true);
    try {
      let finalStudentDurationMs = studentAttendanceDurationRef.current;
      if (studentLastJoinedAtRef.current) {
        finalStudentDurationMs += (Date.now() - studentLastJoinedAtRef.current);
      }
      
      await recordLiveClassAttendance({
        classId: session.id,
        studentId: session.studentId,
        studentName: session.studentName,
        teacherId: session.teacherId,
        teacherName: session.teacherName,
        courseTitle: session.courseTitle,
        enrollmentId: session.enrollmentId,
        program: session.program,
        status: attendanceStatus,
        lessonNotes,
        homeworkAssigned: homeworkInput,
        sessionNumber: session.sessionNumber,
        actualStartTime: new Date(classStartTimeRef.current).toISOString(),
        actualEndTime: new Date().toISOString(),
        actualDurationMinutes: Math.round((Date.now() - classStartTimeRef.current) / 60000),
        studentAttendanceDurationMinutes: Math.round(finalStudentDurationMs / 60000)
      });

      // If this was a diagnostic trial session, sync trial completion in CRM
      if (isTrial) {
        const trialId = session.trialId || session.id.replace('cls_trial_', '');
        try {
          await completeTrialWithAssessment({
            trialId,
            teacherId: session.teacherId,
            teacherName: session.teacherName,
            notes: lessonNotes || '1:1 Diagnostic trial completed in Agora live acoustic studio.',
            recommendation: homeworkInput || 'Recommended enrollment in Foundation Course.',
            recommendedLevel: 'Foundation',
            recommendedPackageName: '3-Month Term (24 Classes)',
            attendance: attendanceStatus === 'present' ? 'Present' : 'Absent',
            scores: {
              pitchAccuracy: 8,
              rhythmSense: 8,
              earGrasping: 9,
              vocalFlexibility: 8,
              overallScore: 8.2
            }
          });
        } catch (crmErr) {
          console.warn('Could not sync trial completion to CRM:', crmErr);
        }
      }

      setAttendanceSaved(true);
      if (onClassCompleted) onClassCompleted();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error recording attendance:', err);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const renderCompanionContent = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TAB 1: TANPURA & TAAL COMPANION */}
      {activeTab === 'tools' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Tanpura Section */}
          <div className="bg-[#1A2333] rounded-2xl p-4 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-white">Digital Tanpura Drone</h3>
              </div>
              <button
                onClick={isTanpuraPlaying ? stopTanpura : startTanpuraLoop}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTanpuraPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-amber-500 hover:bg-amber-400 text-gray-950 font-black shadow-md shadow-amber-500/20'
                }`}
              >
                {isTanpuraPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isTanpuraPlaying ? 'Stop Drone' : 'Start Drone'}</span>
              </button>
            </div>

            {/* Pitch Grid */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Tonic Root Pitch (Sa)
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {PITCH_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPitch(p)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPitch === p
                        ? 'bg-amber-500 text-gray-950 font-black shadow-md'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* String Tuning */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                1st String Tuning
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pa', 'Ma', 'Ni'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTanpuraString(t)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tanpuraString === t
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {t} String
                  </button>
                ))}
              </div>
            </div>

            {/* Volume slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  Tanpura Volume
                </span>
                <span className="font-mono">{Math.round(tanpuraVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={tanpuraVolume}
                onChange={(e) => setTanpuraVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Metronome & Taal Section */}
          <div className="bg-[#1A2333] rounded-2xl p-4 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-serif font-bold text-sm text-white">Taal & Laya Metronome</h3>
              </div>
              <button
                onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isMetronomePlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black shadow-md shadow-emerald-500/20'
                }`}
              >
                {isMetronomePlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isMetronomePlaying ? 'Stop Beat' : 'Start Beat'}</span>
              </button>
            </div>

            {/* Taal Selection */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Indian Classical Taal
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {TAAL_OPTIONS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTaal(t);
                      setCurrentBeat(1);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold truncate transition-all cursor-pointer ${
                      selectedTaal.name === t.name
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Beat Counter */}
            <div className="bg-[#121824] rounded-xl p-3 border border-gray-800 text-center">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                Current Beat / Matra ({selectedTaal.name})
              </div>
              <div className="font-serif text-3xl font-black text-emerald-400 tracking-wider">
                Matra {currentBeat}{' '}
                <span className="text-xs font-sans text-gray-400 font-normal">
                  / {selectedTaal.beats}
                </span>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: selectedTaal.beats }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentBeat === idx + 1
                        ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-400/50'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tempo Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Tempo: {bpm} BPM</span>
                <span>
                  {bpm < 60 ? 'Vilambit (Slow)' : bpm < 140 ? 'Madhya (Medium)' : 'Drut (Fast)'}
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="220"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LESSON NOTES & SARGAM NOTATION */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div>
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Lesson Notes & Swara Notation
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Synchronized notations and lyrics for this class session.
            </p>
          </div>

          <textarea
            value={lessonNotes}
            onChange={(e) => setLessonNotes(e.target.value)}
            disabled={!isTeacherOrAdmin}
            rows={10}
            placeholder="Type Raag bandish lyrics, swara progressions (S R G M P D N S'), or practice cues..."
            className="w-full bg-[#1A2333] border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
          />

          <div className="bg-[#1A2333] p-3 rounded-xl border border-gray-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Quick Swara Palette
            </span>
            <div className="flex flex-wrap gap-1">
              {['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', "S'"].map((swara) => (
                <button
                  key={swara}
                  onClick={() => setLessonNotes((prev) => prev + ' ' + swara)}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-mono text-gray-200 rounded font-bold cursor-pointer"
                >
                  {swara}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHAT */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, idx) => (
              <div key={idx} className="bg-[#1A2333] p-3 rounded-xl border border-gray-800 text-xs">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="font-bold text-amber-300">{m.sender}</span>
                  <span className="text-[10px] font-mono">{m.time}</span>
                </div>
                <p className="text-gray-200 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message or chord..."
              className="flex-1 bg-[#1A2333] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="p-2 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-xl font-bold transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: TEACHER ATTENDANCE & HOMEWORK FORM */}
      {activeTab === 'attendance' && isTeacherOrAdmin && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Attendance & Riyaz Assignment
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Record student presence and assign homework before ending session.
            </p>
          </div>

          {/* Status Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Student Attendance Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Present', 'Late', 'Absent'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAttendanceStatus(st)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    attendanceStatus === st
                      ? st === 'Present'
                        ? 'bg-emerald-600 text-white'
                        : st === 'Late'
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Riyaz Homework */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Assigned Riyaz / Homework
            </label>
            <textarea
              value={homeworkInput}
              onChange={(e) => setHomeworkInput(e.target.value)}
              rows={4}
              placeholder="e.g. Practice Raag Yaman Vilambit Khayal with Teentaal metronome at 75 BPM for 25 mins daily."
              className="w-full bg-[#1A2333] border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAttendanceAndComplete}
            disabled={isSavingAttendance || attendanceSaved}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavingAttendance ? (
              <span>Saving to Record...</span>
            ) : attendanceSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Attendance Logged & Class Complete!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Attendance & Complete Class</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17] flex flex-col overflow-hidden text-white font-sans">
      {/* Top Bar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#131A26] border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-serif font-bold text-sm sm:text-lg text-white tracking-wide truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
                {session.courseTitle}
              </h2>
              {isTrial ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Trial
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">
              <span className="text-amber-300 font-semibold">{session.teacherName}</span> • <span className="text-gray-200">{session.studentName}</span>
            </p>
          </div>
        </div>

        {/* Agora Technical Badge, Timer & Leave Button */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 text-xs font-mono text-gray-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>HD Studio Audio</span>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={() => setShowEndClassConfirm(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              title="Finalize attendance and end class"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-950" />
              <span className="hidden xs:inline">End Class</span>
              <span className="xs:hidden">End</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg hover:shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Leave Studio</span>
            <span className="xs:hidden">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Video Canvas / Stage (Agora Ready Container) */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          <div className="flex-1 bg-[#090D14] relative flex flex-col p-2 sm:p-4 overflow-hidden w-full min-h-0">
          {/* Mobile Floating Mini Pill - Unobtrusive audio status badge over video */}
          {!isMobilePanelOpen && (isTanpuraPlaying || isMetronomePlaying) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden absolute top-3 right-3 z-30 max-w-[90%] bg-[#131A26]/90 backdrop-blur-md border border-amber-500/40 rounded-full pl-3 pr-1.5 py-1 shadow-2xl flex items-center gap-2"
            >
              <div className="flex items-center gap-1.5 text-xs">
                {isTanpuraPlaying && (
                  <span className="flex items-center gap-1 text-amber-300 font-bold whitespace-nowrap text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Tanpura {selectedPitch} ({tanpuraString})
                  </span>
                )}
                {isTanpuraPlaying && isMetronomePlaying && <span className="text-gray-500">•</span>}
                {isMetronomePlaying && (
                  <span className="flex items-center gap-1 text-emerald-300 font-bold whitespace-nowrap text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {selectedTaal.name} M{currentBeat}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setActiveTab('tools');
                  setIsMobilePanelOpen(true);
                }}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Adjust Pitch or Tempo"
              >
                <Sliders className="w-3 h-3" />
                <span>Adjust</span>
              </button>

              <button
                onClick={() => {
                  stopTanpura();
                  setIsMetronomePlaying(false);
                }}
                className="w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Stop sound"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
              </button>
            </motion.div>
          )}

          <VideoClassroom
            classId={session.id}
            agoraChannelName={session.agoraChannelName}
            studentName={session.studentName}
            teacherName={session.teacherName}
            isTeacherOrAdmin={isTeacherOrAdmin}
            currentUserUid={currentUser?.uid}
            currentUserRole={role}
            currentUserEmail={currentUser?.email}
            isTrial={isTrial}
            trialId={session.trialId}
            packageData={subscriptionStatus?.packageDetails}
            isMicOn={isMicOn}
            isVideoOn={isVideoOn}
            onStudentJoined={handleStudentJoined}
            onStudentLeft={handleStudentLeft}
          />

          {/* Bottom Live Studio Control Bar */}
          <div className="h-auto sm:h-16 mt-2 sm:mt-4 px-2 sm:px-6 py-2 bg-[#131A26] rounded-2xl border border-gray-800 flex items-center justify-between gap-2 overflow-x-auto">
            {/* AV Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white'
                }`}
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isVideoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white'
                }`}
                title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isScreenSharing ? 'bg-amber-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
                title="Share Screen"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Teacher Branded Virtual Studio Background Controls */}
              {isTeacherOrAdmin && (
                <VirtualBackgroundControls isTeacherOrAdmin={isTeacherOrAdmin} variant="toolbar" />
              )}
            </div>

            {/* In-Studio Tool Tabs */}
            <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 flex-shrink-0">
              <button
                onClick={() => handleTabClick('tools')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'tools' && isMobilePanelOpen
                    ? 'bg-amber-500 text-gray-950 shadow'
                    : isTanpuraPlaying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5 inline" />
                <span className="hidden sm:inline">Tanpura & Taal</span>
                <span className="sm:hidden">Tanpura</span>
                {isTanpuraPlaying && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
              </button>

              <button
                onClick={() => handleTabClick('notes')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'notes' && isMobilePanelOpen
                    ? 'bg-amber-500 text-gray-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 inline" />
                <span className="hidden sm:inline">Notation</span>
                <span className="sm:hidden">Notes</span>
              </button>

              <button
                onClick={() => handleTabClick('chat')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'chat' && isMobilePanelOpen
                    ? 'bg-amber-500 text-gray-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 inline" />
                <span>Chat</span>
                {chatMessages.length > 0 && <span className="text-[10px] px-1 rounded bg-black/40 text-gray-300">({chatMessages.length})</span>}
              </button>

              {isTeacherOrAdmin && (
                <button
                  onClick={() => handleTabClick('attendance')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'attendance' && isMobilePanelOpen
                      ? 'bg-amber-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  <span className="hidden sm:inline">Attendance</span>
                  <span className="sm:hidden">Attd</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Companion Panel (Desktop only) */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-[#131A26] border-l border-gray-800 overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-gray-800/80 flex items-center justify-between bg-[#101722]">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              {activeTab === 'tools' && <><Music className="w-3.5 h-3.5 text-amber-400" /> Tanpura & Taal Companion</>}
              {activeTab === 'notes' && <><BookOpen className="w-3.5 h-3.5 text-amber-400" /> Lesson Notation</>}
              {activeTab === 'chat' && <><MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Studio Chat</>}
              {activeTab === 'attendance' && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Attendance & Homework</>}
            </span>
            {isTanpuraPlaying && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Drone Active
              </span>
            )}
          </div>
          {renderCompanionContent()}
        </aside>

        </div>
        {/* Mobile Companion Split Panel (Inline) */}
        <AnimatePresence>
          {isMobilePanelOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '45vh' }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="lg:hidden w-full bg-[#131A26] border-t border-gray-700/80 shadow-2xl flex flex-col overflow-hidden flex-shrink-0"
              >
                {/* Drag handle & header */}
                <div className="pt-2 px-4 pb-3 border-b border-gray-800 bg-[#162030] flex flex-col gap-1.5 flex-shrink-0">
                  <div className="w-12 h-1.5 rounded-full bg-gray-600 mx-auto mb-1" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeTab === 'tools' && <Music className="w-4 h-4 text-amber-400" />}
                      {activeTab === 'notes' && <BookOpen className="w-4 h-4 text-amber-400" />}
                      {activeTab === 'chat' && <MessageSquare className="w-4 h-4 text-amber-400" />}
                      {activeTab === 'attendance' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      <span className="font-serif font-bold text-sm text-white">
                        {activeTab === 'tools' ? 'Tanpura Drone & Taal' : activeTab === 'notes' ? 'Lesson Notation' : activeTab === 'chat' ? 'Studio Chat' : 'Attendance & Homework'}
                      </span>
                      {isTanpuraPlaying && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" />
                      )}
                    </div>

                    {/* Minimize to Video Button */}
                    <button
                      onClick={() => setIsMobilePanelOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>Minimize</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {activeTab === 'tools'
                      ? 'Tanpura & Taal continue playing in the background while you sing.'
                      : 'Tap Minimize to return to full video view.'}
                  </p>
                </div>

                {/* Sheet Body */}
                <div className="flex-1 overflow-y-auto">
                  {renderCompanionContent()}
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Teacher End Class & Attendance Finalization Dialog */}
      {showEndClassConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131A26] border border-gray-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">End Class Session</h3>
                  <p className="text-xs text-gray-400">Save student attendance and complete session</p>
                </div>
              </div>
              <button
                onClick={() => setShowEndClassConfirm(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0D121C] rounded-xl p-3 border border-gray-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Course:</span>
                <span className="font-bold text-white">{session.courseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Student:</span>
                <span className="font-bold text-amber-300">{session.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Session Duration:</span>
                <span className="font-mono text-emerald-400">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Attendance Status Selector */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Attendance Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Present', 'Late', 'Absent'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAttendanceStatus(st)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attendanceStatus === st
                        ? st === 'Present'
                          ? 'bg-emerald-600 text-white'
                          : st === 'Late'
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Notes */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Class Summary & Notes
              </label>
              <textarea
                value={lessonNotes}
                onChange={(e) => setLessonNotes(e.target.value)}
                rows={3}
                placeholder="Raag Yaman bandish, Swara precision, Palta riyaz covered..."
                className="w-full bg-[#1A2333] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Homework / Riyaz */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Homework / Riyaz Assigned
              </label>
              <textarea
                value={homeworkInput}
                onChange={(e) => setHomeworkInput(e.target.value)}
                rows={2}
                placeholder="Practice Vilambit Khayal with Teentaal 75 BPM daily for 20 mins."
                className="w-full bg-[#1A2333] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowEndClassConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white font-bold text-xs cursor-pointer"
                disabled={isSavingAttendance}
              >
                Back to Studio
              </button>
              <button
                type="button"
                onClick={handleSaveAttendanceAndComplete}
                disabled={isSavingAttendance || attendanceSaved}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingAttendance ? (
                  <span>Saving & Ending...</span>
                ) : attendanceSaved ? (
                  <span>Class Completed!</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & End Class</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
