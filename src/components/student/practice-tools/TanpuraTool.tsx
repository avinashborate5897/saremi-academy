import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Square } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';

export const TanpuraTool: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [pitch, setPitch] = useState('C#');
  const [strings, setStrings] = useState(['Sa', 'Pa', 'Ma', 'Ni']);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-900 to-black text-white">
      
      {/* Pitch Selector */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 p-2 rounded-full backdrop-blur-md">
        <select 
          value={pitch}
          onChange={(e) => {
            triggerHaptic('selection');
            setPitch(e.target.value);
          }}
          className="bg-transparent text-white font-bold text-lg px-4 py-2 focus:outline-none appearance-none text-center"
        >
          {['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'].map(p => (
            <option key={p} value={p} className="text-black">{p}</option>
          ))}
        </select>
      </div>

      {/* Visualizer */}
      <div className="relative w-full max-w-sm h-64 flex items-center justify-center mb-12">
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
             {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-48 h-48 rounded-full border border-purple-500/30"
                  animate={{
                    scale: [1, 2, 2.5],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "linear"
                  }}
                />
             ))}
          </div>
        )}
        
        {/* Core */}
        <motion.div 
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_40px_rgba(168,85,247,0.5)] z-10 flex items-center justify-center relative overflow-hidden"
          animate={isPlaying ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
           {isPlaying && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
           <div className="text-3xl font-serif font-black drop-shadow-md">ॐ</div>
        </motion.div>
      </div>

      {/* Strings Tuning */}
      <div className="w-full max-w-sm grid grid-cols-4 gap-2 mb-12">
        {strings.map((str, i) => (
          <div key={i} className="flex flex-col items-center">
             <div className="h-24 w-1 bg-gray-800 rounded-full relative overflow-hidden mb-3">
                <motion.div 
                  className="absolute inset-0 bg-purple-500"
                  animate={isPlaying ? { x: [-1, 1, -1] } : { x: 0 }}
                  transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.05 }}
                />
             </div>
             <span className="text-xs font-bold text-gray-400">{str}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => {
          triggerHaptic('heavy');
          setIsPlaying(!isPlaying);
        }}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 z-20 ${
          isPlaying ? 'bg-white text-purple-900 shadow-white/20' : 'bg-purple-600 text-white shadow-purple-600/30'
        }`}
      >
        {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
      </button>

    </div>
  );
};
