import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Activity } from 'lucide-react';

export const TablaTool: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [currentBeat, setCurrentBeat] = useState(1);

  // Teental: 16 beats
  // Vibhag: 4-4-4-4
  // Taali: 1, 5, 13 (Sam is 1)
  // Khali: 9
  const teental = [
    { beat: 1, type: 'sam', bol: 'Dha' },
    { beat: 2, type: 'normal', bol: 'Dhin' },
    { beat: 3, type: 'normal', bol: 'Dhin' },
    { beat: 4, type: 'normal', bol: 'Dha' },
    { beat: 5, type: 'taali', bol: 'Dha' },
    { beat: 6, type: 'normal', bol: 'Dhin' },
    { beat: 7, type: 'normal', bol: 'Dhin' },
    { beat: 8, type: 'normal', bol: 'Dha' },
    { beat: 9, type: 'khali', bol: 'Dha' },
    { beat: 10, type: 'normal', bol: 'Tin' },
    { beat: 11, type: 'normal', bol: 'Tin' },
    { beat: 12, type: 'normal', bol: 'Ta' },
    { beat: 13, type: 'taali', bol: 'Ta' },
    { beat: 14, type: 'normal', bol: 'Dhin' },
    { beat: 15, type: 'normal', bol: 'Dhin' },
    { beat: 16, type: 'normal', bol: 'Dha' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const msPerBeat = 60000 / bpm;
      interval = setInterval(() => {
        setCurrentBeat((prev) => (prev % 16) + 1);
      }, msPerBeat);
    } else {
      setCurrentBeat(1);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  return (
    <div className="absolute inset-0 flex flex-col p-6 bg-orange-950 text-white overflow-y-auto overflow-x-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-orange-900/50 p-4 rounded-2xl border border-orange-800/50">
        <div>
           <h2 className="text-xl font-bold text-orange-400">Teental</h2>
           <p className="text-orange-300/60 text-sm font-medium">16 Beats • 4 Vibhags</p>
        </div>
        <div className="text-right">
           <div className="text-3xl font-black text-white">{bpm}</div>
           <p className="text-orange-300/60 text-xs font-bold uppercase tracking-wider">BPM</p>
        </div>
      </div>

      {/* Taal Visualizer (Circular or Linear, let's do a wrapped grid) */}
      <div className="flex-1 flex items-center justify-center mb-8">
         <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-md mx-auto">
            {teental.map((t) => {
              const isActive = isPlaying && currentBeat === t.beat;
              const isSam = t.type === 'sam';
              const isKhali = t.type === 'khali';
              const isTaali = t.type === 'taali';

              let borderColor = 'border-orange-800';
              if (isSam) borderColor = 'border-red-500';
              else if (isKhali) borderColor = 'border-gray-500 border-dashed';
              else if (isTaali) borderColor = 'border-orange-500';

              return (
                <div key={t.beat} className="flex flex-col items-center gap-2">
                  <motion.div 
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center relative ${borderColor} ${isActive ? 'bg-orange-600 border-orange-400' : 'bg-orange-900/40'}`}
                    animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                     <span className={`font-bold ${isActive ? 'text-white text-lg' : 'text-orange-300'}`}>{t.beat}</span>
                     {/* Marker icons */}
                     {isSam && <span className="absolute -top-1 -right-1 text-xs bg-red-500 w-4 h-4 rounded-full flex items-center justify-center font-black">X</span>}
                     {isKhali && <span className="absolute -top-1 -right-1 text-xs bg-gray-500 w-4 h-4 rounded-full flex items-center justify-center font-black">O</span>}
                     {isTaali && <span className="absolute -top-1 -right-1 text-xs bg-orange-500 w-4 h-4 rounded-full flex items-center justify-center font-black text-[10px]">2</span>}
                  </motion.div>
                  <span className={`text-xs font-bold uppercase ${isActive ? 'text-orange-300' : 'text-orange-700'}`}>{t.bol}</span>
                </div>
              );
            })}
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 bg-orange-900/30 p-6 rounded-[32px] border border-orange-800/30">
        <button 
          onClick={() => setBpm(b => Math.max(40, b - 5))}
          className="w-12 h-12 rounded-full bg-orange-800/50 flex items-center justify-center hover:bg-orange-700 active:scale-95"
        >
          -5
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
            isPlaying ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-orange-500 text-white shadow-orange-500/20'
          }`}
        >
          {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
        </button>

        <button 
          onClick={() => setBpm(b => Math.min(240, b + 5))}
          className="w-12 h-12 rounded-full bg-orange-800/50 flex items-center justify-center hover:bg-orange-700 active:scale-95"
        >
          +5
        </button>
      </div>

    </div>
  );
};
