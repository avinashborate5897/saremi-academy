import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Activity } from 'lucide-react';

export const SwarMeterTool: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  
  // Simulated data
  const [note, setNote] = useState('Sa');
  const [freq, setFreq] = useState(261.6);
  const [accuracy, setAccuracy] = useState(98);
  const [history, setHistory] = useState<number[]>(Array(20).fill(50));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        // Simulate pitch tracking
        const newAcc = Math.max(0, Math.min(100, accuracy + (Math.random() * 20 - 10)));
        setAccuracy(newAcc);
        setHistory(prev => [...prev.slice(1), newAcc]);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isListening, accuracy]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-gray-900 text-white overflow-hidden">
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-center bg-gray-800/50 p-4 rounded-2xl backdrop-blur-md border border-gray-700/50">
        <div>
           <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Current Swar</div>
           <div className="text-3xl font-serif font-bold text-pink-500">{note}</div>
        </div>
        <div className="text-right">
           <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Frequency</div>
           <div className="text-2xl font-bold font-mono">{freq.toFixed(1)} <span className="text-sm text-gray-500">Hz</span></div>
        </div>
      </div>

      {/* Main Meter */}
      <div className="relative w-64 h-64 flex items-center justify-center my-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
          {/* Progress circle */}
          <motion.circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="url(#pinkGradient)" 
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="283"
            animate={{ strokeDashoffset: 283 - (283 * accuracy) / 100 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
          <defs>
            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className="text-5xl font-black text-white">{Math.round(accuracy)}<span className="text-2xl text-pink-500">%</span></span>
           <span className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Accuracy</span>
        </div>
      </div>

      {/* Real-time Graph */}
      <div className="w-full h-32 bg-gray-800/30 rounded-xl border border-gray-700/50 flex items-end p-2 gap-1 mb-8">
        {history.map((val, i) => (
          <motion.div 
            key={i}
            className="flex-1 bg-pink-500 rounded-t-sm opacity-80"
            animate={{ height: `${val}%` }}
            transition={{ type: 'tween', duration: 0.1 }}
          />
        ))}
      </div>

      <button 
        onClick={() => setIsListening(!isListening)}
        className={`w-full max-w-sm h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all ${
          isListening ? 'bg-red-500/20 text-red-500 border-2 border-red-500/50' : 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:bg-pink-500'
        }`}
      >
        {isListening ? (
          <><MicOff className="w-6 h-6" /> Stop Tracking</>
        ) : (
          <><Mic className="w-6 h-6" /> Start Tracking</>
        )}
      </button>

    </div>
  );
};
