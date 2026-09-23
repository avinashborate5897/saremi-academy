import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, RotateCcw, Sliders, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';
import { useTanpura, useMetronome } from '../../hooks/useAudioTools';

export const ToolsView: React.FC = () => {
  const { 
    tanpuraPlaying, setTanpuraPlaying, 
    selectedRoot, setSelectedRoot, 
    tuningType, setTuningType, 
    tanpuraVolume, setTanpuraVolume 
  } = useTanpura();

  const { 
    tala, setTala, 
    bpm, setBpm, 
    metronomePlaying, setMetronomePlaying, 
    currentBeat, setCurrentBeat, currentTalaConfig 
  } = useMetronome();

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let t: any;
    if (timerActive) {
      t = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [timerActive]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      <SEOHead
        title="Riyaaz Practice Studio & Acoustic Tanpura"
        description="Free virtual practice tools for Indian classical & Western music: Multi-pitch Tanpura drone, Indian Tala metronome (Teentaal, Keherwa, Rupak), and practice timer."
        canonicalPath="/tools"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">Acoustic Practice Studio</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Virtual Riyaaz Tools for Everyday Mastery
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Crafted for vocalists, instrumentalists, and percussionists. Practice daily with our harmonic Tanpura drone, Tala rhythmic metronome, and focus timer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TANPURA DRONE CARD */}
        <Card variant="default" padding="lg" className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-[#8C6428] uppercase font-bold tracking-wider">
                Acoustic Drone
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#121829]">Harmonic Tanpura</h2>
            </div>
            <button
              onClick={() => setTanpuraPlaying(!tanpuraPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                tanpuraPlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#121829] text-[#E5AF55] hover:bg-[#1B243B]'
              }`}
            >
              {tanpuraPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{tanpuraPlaying ? 'Stop Drone' : 'Start Tanpura'}</span>
            </button>
          </div>

          {/* Root Note Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-800 block">Root Tonic (Adhara Sa):</span>
            <div className="grid grid-cols-4 gap-2">
              {(['C', 'C#', 'D', 'D#'] as const).map(note => (
                <button
                  key={note}
                  onClick={() => setSelectedRoot(note)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    selectedRoot === note
                      ? 'border-[#D49A3D] bg-[#FAF8F5] text-[#8C6428] ring-1 ring-[#D49A3D]'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* String Tuning Mode */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-800 block">First String Tuning:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTuningType('Pa-Sa')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  tuningType === 'Pa-Sa'
                    ? 'border-[#D49A3D] bg-[#FAF8F5] text-[#8C6428]'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <strong>Pa - Sa</strong> (Default for most Ragas)
              </button>
              <button
                onClick={() => setTuningType('Ma-Sa')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  tuningType === 'Ma-Sa'
                    ? 'border-[#D49A3D] bg-[#FAF8F5] text-[#8C6428]'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <strong>Ma - Sa</strong> (For Marwa, Malkauns)
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Volume2 className="w-4 h-4 text-gray-400" />
                Drone Volume
              </span>
              <span className="font-mono">{Math.round(tanpuraVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={tanpuraVolume}
              onChange={e => setTanpuraVolume(parseFloat(e.target.value))}
              className="w-full accent-[#8C6428]"
            />
          </div>
        </Card>

        {/* TALA METRONOME CARD */}
        <Card variant="default" padding="lg" className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-[#8C6428] uppercase font-bold tracking-wider">
                Rhythm Science
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#121829]">Indian Tala Metronome</h2>
            </div>
            <button
              onClick={() => {
                setMetronomePlaying(!metronomePlaying);
                if (!metronomePlaying) setCurrentBeat(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                metronomePlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#121829] text-[#E5AF55] hover:bg-[#1B243B]'
              }`}
            >
              {metronomePlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{metronomePlaying ? 'Stop Beat' : 'Start Tala'}</span>
            </button>
          </div>

          {/* Tala Select */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Teentaal', 'Keherwa', 'Dadra', 'Rupak'] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTala(t);
                  setCurrentBeat(1);
                }}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  tala === t
                    ? 'border-[#D49A3D] bg-[#FAF8F5] text-[#8C6428]'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Dynamic Beats Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-gray-500 block">
              {currentTalaConfig.name} • Active Beat: <strong>{currentBeat}</strong>
            </span>
            <div className="grid grid-cols-8 sm:grid-cols-8 gap-2">
              {Array.from({ length: currentTalaConfig.beats }, (_, i) => i + 1).map(b => {
                const isActive = metronomePlaying && currentBeat === b;
                const isSom = b === currentTalaConfig.som;
                const isKhali = currentTalaConfig.khali.includes(b);

                return (
                  <div
                    key={b}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center font-mono text-xs transition-all border ${
                      isActive
                        ? 'bg-[#8C6428] text-white scale-110 font-bold border-[#8C6428] shadow-md'
                        : isSom
                        ? 'bg-[#FBF5EB] border-[#D49A3D] text-[#8C6428] font-bold'
                        : isKhali
                        ? 'bg-gray-100 text-gray-500 border-dashed border-gray-300'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{b}</span>
                    <span className="text-[8px] leading-none">
                      {isSom ? 'Som' : isKhali ? '0' : 'x'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BPM Slider */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Sliders className="w-4 h-4 text-gray-400" />
                Tempo (Laya)
              </span>
              <span className="font-mono font-bold text-gray-900">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              step="2"
              value={bpm}
              onChange={e => setBpm(parseInt(e.target.value, 10))}
              className="w-full accent-[#8C6428]"
            />
          </div>
        </Card>
      </div>

      {/* RIYAAZ TIMER STRIP */}
      <Card variant="default" padding="lg" className="bg-[#121829] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#D49A3D]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#D49A3D] tracking-wider font-bold">
              Practice Session Tracker
            </span>
            <h3 className="font-serif text-xl font-bold">Focus Stopwatch</h3>
            <p className="text-xs text-gray-400">Aim for at least 30 minutes of unbroken swara meditation daily.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-3xl sm:text-4xl font-bold text-[#E5AF55]">
            {formatTimer(timerSeconds)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="brass"
              size="sm"
              onClick={() => setTimerActive(!timerActive)}
            >
              {timerActive ? 'Pause' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(0);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
