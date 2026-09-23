import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Disc3, Clock, Sparkles } from 'lucide-react';

interface SwaraNote {
  syllable: string;
  western: string;
  freq: number;
  significance: string;
}

const SWARAS: SwaraNote[] = [
  { syllable: 'Sa', western: 'C4', freq: 261.63, significance: 'Adhara Shadja (Root)' },
  { syllable: 'Re', western: 'D4', freq: 293.66, significance: 'Rishabh' },
  { syllable: 'Ga', western: 'E4', freq: 329.63, significance: 'Gandhar' },
  { syllable: 'Ma', western: 'F4', freq: 349.23, significance: 'Madhyam' },
  { syllable: 'Pa', western: 'G4', freq: 392.00, significance: 'Pancham (Fifth)' },
  { syllable: 'Dha', western: 'A4', freq: 440.00, significance: 'Dhaivat' },
  { syllable: 'Ni', western: 'B4', freq: 493.88, significance: 'Nishad' },
  { syllable: "Sa'", western: 'C5', freq: 523.25, significance: 'Taar Shadja (Octave)' },
];

export const SoundBar: React.FC = () => {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [dronePlaying, setDronePlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      try {
        
        if (window.AudioContext || (window as any).webkitAudioContext) {
          audioCtxRef.current = window.AudioContext ? new window.AudioContext() : new (window as any).webkitAudioContext();
        }
      } catch (err) {
        console.warn('AudioContext unavailable:', err);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const playNote = (note: SwaraNote) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    setActiveNote(note.syllable);

    // Warm harmonic synthesizer sound
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, ctx.currentTime);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(note.freq * 2, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    subOsc.start();
    osc.stop(ctx.currentTime + 1.25);
    subOsc.stop(ctx.currentTime + 1.25);

    setTimeout(() => {
      setActiveNote((curr) => (curr === note.syllable ? null : curr));
    }, 450);
  };

  const toggleDrone = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (dronePlaying) {
      droneNodesRef.current.forEach(({ osc, gain }) => {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.55);
      });
      droneNodesRef.current = [];
      setDronePlaying(false);
    } else {
      // Create Tanpura drone (Sa - Pa - Sa' overtones with subtle chorus)
      const freqs = [130.81, 196.0, 261.63]; // C3, G3, C4
      const newNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + idx * 200, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08 / (idx + 1), ctx.currentTime + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        newNodes.push({ osc, gain });
      });

      droneNodesRef.current = newNodes;
      setDronePlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div id="sound-bar" className="w-full bg-[#121829] border-y border-[#D49A3D]/25 py-4 px-4 sm:px-8 text-white relative overflow-hidden shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand sound label */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D49A3D]/15 border border-[#D49A3D]/40 flex items-center justify-center text-[#D49A3D]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#D49A3D]">
                The Solfège Octave
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                Sa • Re • Ga • Ma
              </span>
            </div>
            <p className="text-xs text-white/60">Tap any swara below to hear natural pitch resonance</p>
          </div>
        </div>

        {/* Solfège Swara Keys */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          {SWARAS.map((note) => {
            const isActive = activeNote === note.syllable;
            return (
              <button
                key={note.syllable}
                id={`swara-btn-${note.syllable.toLowerCase()}`}
                onClick={() => playNote(note)}
                title={`${note.syllable} (${note.western}) - ${note.significance}`}
                className={`group flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-[#D49A3D] text-[#121829] border-[#D49A3D] shadow-lg shadow-[#D49A3D]/40 -translate-y-1'
                    : 'bg-[#1D2640]/90 text-white/90 border-white/10 hover:border-[#D49A3D]/60 hover:bg-[#1D2640]'
                }`}
              >
                <span className="font-serif font-bold text-sm leading-tight">{note.syllable}</span>
                <span className={`text-[10px] font-mono leading-none ${isActive ? 'text-[#121829]/80' : 'text-white/40'}`}>
                  {note.western}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drone & Metronome Toggles */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-tanpura-drone-btn"
            onClick={toggleDrone}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              dronePlaying
                ? 'bg-[#D49A3D] text-[#121829] border-[#D49A3D] shadow-md shadow-[#D49A3D]/30 animate-pulse'
                : 'bg-white/5 text-white/80 border-white/15 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            {dronePlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Disc3 className="w-3.5 h-3.5" />}
            <span>{dronePlaying ? 'Tanpura Drone Playing' : 'Start Tanpura Drone'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
