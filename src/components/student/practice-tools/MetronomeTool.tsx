import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Plus, Minus } from 'lucide-react';

export const MetronomeTool: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const msPerBeat = 60000 / bpm;
      interval = setInterval(() => {
        setCurrentBeat((prev) => (prev % beatsPerMeasure) + 1);
        // Note: Real audio processing would be hooked up here using Web Audio API
        // This visual simulation demonstrates the UI request
      }, msPerBeat);
    } else {
      setCurrentBeat(1);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, beatsPerMeasure]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-900 to-gray-900">
      
      {/* Visual Metronome Pendulum */}
      <div className="relative w-full max-w-sm h-64 mb-12 flex justify-center items-end overflow-hidden">
        {/* Base */}
        <div className="absolute bottom-0 w-32 h-4 bg-gray-800 rounded-t-xl z-10" />
        
        {/* Pendulum */}
        <motion.div 
          className="w-2 h-48 bg-green-500 rounded-full origin-bottom relative z-0"
          animate={isPlaying ? { rotate: [20, -20, 20] } : { rotate: 0 }}
          transition={{ 
            duration: (60 / bpm) * 2, // 2 beats for full swing
            ease: "linear",
            repeat: Infinity 
          }}
        >
          {/* Weight */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-lg shadow-lg border-2 border-green-600" />
        </motion.div>
      </div>

      {/* Beat Indicators */}
      <div className="flex items-center gap-3 mb-12">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-6 h-6 rounded-full border-2 ${
              isPlaying && currentBeat === i + 1 
                ? (i === 0 ? 'bg-red-500 border-red-500' : 'bg-green-500 border-green-500')
                : 'bg-transparent border-gray-600'
            }`}
            animate={isPlaying && currentBeat === i + 1 ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-[32px] w-full max-w-sm border border-gray-700/50">
        <div className="flex flex-col items-center mb-8">
          <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Tempo</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setBpm(b => Math.max(40, b - 1))}
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 active:scale-95 transition-all"
            >
              <Minus className="w-6 h-6" />
            </button>
            <div className="text-center w-24">
              <div className="text-5xl font-black text-white tracking-tighter">{bpm}</div>
              <div className="text-green-500 font-bold text-sm mt-1">BPM</div>
            </div>
            <button 
              onClick={() => setBpm(b => Math.min(240, b + 1))}
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Time Sig</span>
            <select 
              value={beatsPerMeasure} 
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
              className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-green-500"
            >
              <option value={2}>2/4</option>
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={6}>6/8</option>
            </select>
          </div>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-20 h-20 rounded-[24px] flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
              isPlaying ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-green-500 text-white shadow-green-500/20'
            }`}
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};
