import { useState, useEffect, useRef } from 'react';
import { playTablaSound, playTanpuraPluck } from '../lib/audioSynthesis';

export const useTanpura = () => {
  const [tanpuraPlaying, setTanpuraPlaying] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState<'C' | 'C#' | 'D' | 'D#'>('C#');
  const [tuningType, setTuningType] = useState<'Pa-Sa' | 'Ma-Sa'>('Pa-Sa');
  const [tanpuraVolume, setTanpuraVolume] = useState<number>(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tanpuraLoopTimeout = useRef<number | null>(null);

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

  const rootFreqs: Record<string, number> = {
    'C': 130.81,
    'C#': 138.59,
    'D': 146.83,
    'D#': 155.56
  };

  useEffect(() => {
    if (!tanpuraPlaying) {
      if (tanpuraLoopTimeout.current) clearTimeout(tanpuraLoopTimeout.current);
      return;
    }

    const baseSa = rootFreqs[selectedRoot] || 138.59;
    const firstString = tuningType === 'Pa-Sa' ? baseSa * 1.5 : baseSa * (4 / 3);
    const middleSa = baseSa * 2;
    const kharajSa = baseSa;

    const strings = [firstString, middleSa, middleSa, kharajSa];
    let stringIdx = 0;

    const strum = () => {
      if (!tanpuraPlaying) return;
      const ctx = getAudioContext();
      if (ctx) {
        playTanpuraPluck(ctx, strings[stringIdx], tanpuraVolume);
      }
      stringIdx = (stringIdx + 1) % 4;
      tanpuraLoopTimeout.current = window.setTimeout(strum, 1100);
    };

    strum();

    return () => {
      if (tanpuraLoopTimeout.current) clearTimeout(tanpuraLoopTimeout.current);
    };
  }, [tanpuraPlaying, selectedRoot, tuningType, tanpuraVolume]);

  return {
    tanpuraPlaying, setTanpuraPlaying,
    selectedRoot, setSelectedRoot,
    tuningType, setTuningType,
    tanpuraVolume, setTanpuraVolume
  };
};

export const useMetronome = () => {
  const [tala, setTala] = useState<'Teentaal' | 'Keherwa' | 'Dadra' | 'Rupak'>('Teentaal');
  const [bpm, setBpm] = useState<number>(80);
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(1);

  const talaConfigs = {
    Teentaal: { beats: 16, som: 1, khali: [9], taali: [1, 5, 13], name: 'Teentaal (16 Matras)' },
    Keherwa: { beats: 8, som: 1, khali: [5], taali: [1], name: 'Keherwa (8 Matras)' },
    Dadra: { beats: 6, som: 1, khali: [4], taali: [1], name: 'Dadra (6 Matras)' },
    Rupak: { beats: 7, som: 1, khali: [1], taali: [4, 6], name: 'Rupak (7 Matras)' }
  };

  const currentTalaConfig = talaConfigs[tala];
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metroIntervalRef = useRef<number | null>(null);

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

  const playClick = (isSom: boolean, isKhali: boolean) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    let soundType: 'dha' | 'dhin' | 'tin' | 'na' = 'na';
    if (isSom) soundType = 'dha';
    else if (isKhali) soundType = 'tin';
    else soundType = 'dhin';
    
    playTablaSound(ctx, soundType, 300);
  };

  useEffect(() => {
    if (!metronomePlaying) {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    metroIntervalRef.current = window.setInterval(() => {
      setCurrentBeat((prev) => {
        const next = prev >= currentTalaConfig.beats ? 1 : prev + 1;
        const isSom = next === currentTalaConfig.som;
        const isKhali = currentTalaConfig.khali.includes(next);
        playClick(isSom, isKhali);
        return next;
      });
    }, intervalMs);

    return () => {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, [metronomePlaying, bpm, tala, currentTalaConfig]);

  return {
    tala, setTala,
    bpm, setBpm,
    metronomePlaying, setMetronomePlaying,
    currentBeat, setCurrentBeat, currentTalaConfig
  };
};
