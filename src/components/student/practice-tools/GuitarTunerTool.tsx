import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';

export const GuitarTunerTool: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  
  // Simulated tuner state for visual demonstration
  const [cents, setCents] = useState(0); 
  const [note, setNote] = useState('E');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        // Simulate random pitch fluctuations between -50 and 50 cents
        setCents(Math.floor(Math.random() * 100) - 50);
      }, 500);
    } else {
      setCents(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Determine color based on cents
  const getColor = () => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'text-green-500'; // Tuned
    if (absCents <= 20) return 'text-yellow-500'; // Close
    return 'text-red-500'; // Flat/Sharp
  };

  const getBgColor = () => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'bg-green-500'; 
    if (absCents <= 20) return 'bg-yellow-500'; 
    return 'bg-red-500'; 
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-black text-white">
      
      {/* Target Note */}
      <div className="text-center mb-12">
        <h2 className="text-gray-500 font-bold tracking-widest uppercase text-sm mb-2">Target Note</h2>
        <div className={`text-8xl font-black transition-colors duration-300 ${getColor()}`}>
          {note}
        </div>
      </div>

      {/* Meter */}
      <div className="relative w-full max-w-lg h-32 mb-16 flex items-end justify-center">
        {/* Tick marks */}
        <div className="absolute inset-x-0 bottom-0 h-4 border-b-2 border-gray-700 flex justify-between px-4">
          {[-50, -25, 0, 25, 50].map((tick) => (
            <div key={tick} className="flex flex-col items-center justify-end h-full">
              <div className={`w-0.5 ${tick === 0 ? 'h-4 bg-gray-500' : 'h-2 bg-gray-700'}`} />
              <span className="text-[10px] text-gray-500 font-bold mt-1 absolute -bottom-5">{tick}</span>
            </div>
          ))}
        </div>
        
        {/* Needle */}
        <motion.div 
          className="absolute bottom-0 w-1 h-32 origin-bottom z-10"
          animate={{ rotate: (cents / 50) * 45 }} // Scale -50..50 to -45deg..45deg
          transition={{ type: 'spring', stiffness: 50, damping: 10 }}
        >
          <div className={`w-full h-full ${getBgColor()} shadow-[0_0_15px_currentColor] rounded-t-full transition-colors duration-300`} />
          <div className="absolute -bottom-2 -left-1.5 w-4 h-4 rounded-full bg-white shadow-md" />
        </motion.div>
      </div>

      {/* Status */}
      <div className={`text-2xl font-bold mb-12 transition-colors duration-300 ${getColor()}`}>
        {Math.abs(cents) <= 5 ? 'Tuned!' : cents < 0 ? 'Too Flat' : 'Too Sharp'}
      </div>

      <button 
        onClick={() => setIsListening(!isListening)}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
          isListening ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'
        }`}
      >
        {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
      </button>

    </div>
  );
};
