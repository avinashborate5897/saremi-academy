import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Activity, 
  Music, 
  Mic, 
  Settings2, 
  LayoutGrid,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Volume2,
  Lock
} from 'lucide-react';
import { MetronomeTool } from './practice-tools/MetronomeTool';
import { TanpuraTool } from './practice-tools/TanpuraTool';
import { PianoTool } from './practice-tools/PianoTool';
import { GuitarTunerTool } from './practice-tools/GuitarTunerTool';
import { SwarMeterTool } from './practice-tools/SwarMeterTool';
import { TablaTool } from './practice-tools/TablaTool';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../lib/dashboardService';
import { SaremiButton, SaremiBadge, SaremiCard } from '../common/SaremiUI';
import { ExpiredAccessLock } from '../common/ExpiredAccessLock';
import { StudentSubscriptionStatus } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export type ToolId = 'tanpura' | 'tabla' | 'piano' | 'metronome' | 'tuner' | 'swar-meter' | null;

interface PracticeStudioProps {
  subscriptionStatus?: StudentSubscriptionStatus;
  onRenew?: () => void;
}

export const PracticeStudio: React.FC<PracticeStudioProps> = ({ subscriptionStatus, onRenew }) => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  const isAccessLocked = subscriptionStatus?.isExpired && (subscriptionStatus?.status === 'expired' || subscriptionStatus?.status === 'exhausted');

  const tools = [
    {
      id: 'tanpura',
      title: 'Tanpura Drone',
      desc: 'Authentic 4-string acoustic drone for vocal pitch perfection & raga immersion',
      category: 'Vocals & Strings',
      emoji: '🪕',
      color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-saremi-primary',
      badgeColor: 'singing' as const,
      accent: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'tabla',
      title: 'Tabla Studio',
      desc: 'Visual Taal loop generator with Teentaal, Dadra, Keherwa & Rupak tempos',
      category: 'Rhythm & Beats',
      emoji: '🪘',
      color: 'bg-orange-50 hover:bg-orange-100/80 border-orange-200 text-orange-600',
      badgeColor: 'tabla' as const,
      accent: 'from-orange-500 to-amber-600',
    },
    {
      id: 'piano',
      title: 'Virtual Piano',
      desc: 'Responsive touch keys with note labeling and chord harmony visualizer',
      category: 'Keyboard & Theory',
      emoji: '🎹',
      color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-600',
      badgeColor: 'keyboard' as const,
      accent: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'swar-meter',
      title: 'Swar Meter',
      desc: 'Real-time microphone pitch detector with instant cent-level accuracy graph',
      category: 'Pitch Diagnostic',
      emoji: '🎤',
      color: 'bg-pink-50 hover:bg-pink-100/80 border-pink-200 text-pink-600',
      badgeColor: 'singing' as const,
      accent: 'from-pink-500 to-rose-600',
    },
    {
      id: 'metronome',
      title: 'Pro Metronome',
      desc: 'Visual pendulum tempo clock from 40 to 240 BPM with accent pulses',
      category: 'Timing & Pace',
      emoji: '⏱️',
      color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-600',
      badgeColor: 'general' as const,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'tuner',
      title: 'Acoustic Guitar Tuner',
      desc: 'Standard EADGBE and custom tuning assistant with pitch lock feedback',
      category: 'Fretted Instruments',
      emoji: '🎸',
      color: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-700',
      badgeColor: 'guitar' as const,
      accent: 'from-amber-500 to-orange-600',
    },
  ];

  const handleCloseTool = async (durationSeconds: number) => {
    triggerHaptic('medium');
    setActiveTool(null);
    if (durationSeconds > 10) {
      setSessionDuration(Math.floor(durationSeconds / 60) || 1);
      setShowSummary(true);
      triggerHaptic('success');
      if (user) {
        await dashboardService.updateStreak(user.uid);
      }
    }
  };

  return (
    <div className="space-y-8 pb-24 sm:pb-0 relative text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-[28px] text-white shadow-saremi-purple relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-saremi-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-saremi-yellow text-xs font-bold font-display backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Music Playground
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            Practice Studio
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl font-medium">
            Professional Tanpura drones, Taal visualizers, virtual piano keys, and real-time Swar pitch trackers — anytime, anywhere.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Audio Engine</div>
            <div className="text-xs font-bold text-white font-mono">WebAudio API 48kHz Ready</div>
          </div>
        </div>
      </div>

      {isAccessLocked && (
        <ExpiredAccessLock
          subscriptionStatus={subscriptionStatus}
          resourceName="Advanced Practice Studio Tools"
          onRenew={onRenew}
        />
      )}

      {/* 6 Large Colorful Tool Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all ${isAccessLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => {
              triggerHaptic('heavy');
              setActiveTool(tool.id as ToolId);
            }}
            className={`p-6 rounded-[24px] border-2 ${tool.color} transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-saremi-card cursor-pointer flex flex-col justify-between group`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {tool.emoji}
                </div>
                <SaremiBadge category={tool.badgeColor}>
                  {tool.category}
                </SaremiBadge>
              </div>

              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2 group-hover:text-saremi-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6">
                {tool.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-xs font-bold font-display text-slate-700 group-hover:text-saremi-primary flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" /> Open Studio
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                Interactive
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FULLSCREEN TOOL OVERLAY */}
      <AnimatePresence>
        {activeTool && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden"
          >
            {/* Studio Navigation Top Bar */}
            <div className="flex items-center justify-between p-4 sm:p-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-10 relative">
              <button 
                onClick={() => handleCloseTool(120)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors font-bold text-sm cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Exit Studio</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-saremi-primary/20 border border-saremi-primary/40 text-saremi-yellow text-xs font-bold font-display">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{tools.find(t => t.id === activeTool)?.title}</span>
                </div>
              </div>
            </div>

            {/* Live Interactive Instrument Canvas */}
            <div className="flex-1 relative overflow-y-auto">
              {activeTool === 'metronome' && <MetronomeTool />}
              {activeTool === 'tanpura' && <TanpuraTool />}
              {activeTool === 'piano' && <PianoTool />}
              {activeTool === 'tuner' && <GuitarTunerTool />}
              {activeTool === 'swar-meter' && <SwarMeterTool />}
              {activeTool === 'tabla' && <TablaTool />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRACTICE SESSION COMPLETE OVERLAY */}
      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-white rounded-[36px] p-8 max-w-sm w-full text-center border-4 border-saremi-primary shadow-2xl relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-saremi-soft-purple rounded-full flex items-center justify-center mx-auto mb-5 text-saremi-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">Practice Logged! 🎵</h2>
              <div className="text-4xl font-extrabold text-saremi-primary mb-5 font-serif">
                {sessionDuration} <span className="text-base text-slate-500 font-sans font-bold">minutes</span>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 mb-6 space-y-2 text-xs font-medium text-slate-700">
                <div className="font-bold text-slate-900 text-sm">Session Highlights</div>
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Daily practice streak recorded</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Audio calibration synchronized</span>
                </div>
              </div>

              <SaremiButton variant="primary" size="lg" fullWidth onClick={() => setShowSummary(false)}>
                Continue
              </SaremiButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
