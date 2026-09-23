import React, { useState } from 'react';
import { motion } from 'motion/react';

export const PianoTool: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<number[]>([]);

  // Simple 1 octave + C mapping
  const keys = [
    { note: 'C4', type: 'white', id: 0, hasBlackNext: true },
    { note: 'C#4', type: 'black', id: 1 },
    { note: 'D4', type: 'white', id: 2, hasBlackNext: true },
    { note: 'D#4', type: 'black', id: 3 },
    { note: 'E4', type: 'white', id: 4, hasBlackNext: false },
    { note: 'F4', type: 'white', id: 5, hasBlackNext: true },
    { note: 'F#4', type: 'black', id: 6 },
    { note: 'G4', type: 'white', id: 7, hasBlackNext: true },
    { note: 'G#4', type: 'black', id: 8 },
    { note: 'A4', type: 'white', id: 9, hasBlackNext: true },
    { note: 'A#4', type: 'black', id: 10 },
    { note: 'B4', type: 'white', id: 11, hasBlackNext: false },
    { note: 'C5', type: 'white', id: 12, hasBlackNext: false },
  ];

  const handlePointerDown = (id: number) => setActiveKeys(prev => [...prev, id]);
  const handlePointerUp = (id: number) => setActiveKeys(prev => prev.filter(k => k !== id));

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-900 overflow-hidden select-none">
      
      {/* Decorative top */}
      <div className="h-32 bg-gradient-to-b from-blue-900 to-gray-900 flex items-center justify-center p-6">
         <div className="text-white text-center">
            <h3 className="font-serif text-2xl font-bold">Grand Piano</h3>
            <p className="text-blue-300 font-medium text-sm">Interactive Studio Keyboard</p>
         </div>
      </div>

      <div className="flex-1 flex items-end justify-center pb-8 px-4 overflow-x-auto">
        <div className="relative flex h-64 sm:h-96 bg-gray-800 p-2 rounded-xl shadow-2xl border-t border-gray-700">
          
          {keys.filter(k => k.type === 'white').map((whiteKey, i) => {
            const isWhiteActive = activeKeys.includes(whiteKey.id);
            // find if there is a black key next
            const blackKey = keys.find(k => k.id === whiteKey.id + 1 && k.type === 'black');
            const isBlackActive = blackKey ? activeKeys.includes(blackKey.id) : false;

            return (
              <div key={whiteKey.id} className="relative h-full flex">
                {/* White Key */}
                <div 
                  onPointerDown={(e) => { e.preventDefault(); handlePointerDown(whiteKey.id); }}
                  onPointerUp={(e) => { e.preventDefault(); handlePointerUp(whiteKey.id); }}
                  onPointerLeave={(e) => { e.preventDefault(); handlePointerUp(whiteKey.id); }}
                  className={`w-16 sm:w-20 h-full border border-gray-300 rounded-b-lg shadow-sm flex flex-col justify-end pb-4 items-center cursor-pointer transition-all ${
                    isWhiteActive ? 'bg-blue-50 border-blue-400 translate-y-1' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                   <span className={`text-xs font-bold ${isWhiteActive ? 'text-blue-500' : 'text-gray-300'}`}>{whiteKey.note}</span>
                   {isWhiteActive && (
                      <div className="absolute bottom-2 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                   )}
                </div>

                {/* Black Key Overlay */}
                {blackKey && (
                  <div 
                    onPointerDown={(e) => { e.preventDefault(); handlePointerDown(blackKey.id); e.stopPropagation(); }}
                    onPointerUp={(e) => { e.preventDefault(); handlePointerUp(blackKey.id); e.stopPropagation(); }}
                    onPointerLeave={(e) => { e.preventDefault(); handlePointerUp(blackKey.id); e.stopPropagation(); }}
                    className={`absolute top-0 -right-5 sm:-right-6 w-10 sm:w-12 h-2/3 rounded-b-lg shadow-xl flex flex-col justify-end pb-4 items-center cursor-pointer transition-all z-10 ${
                      isBlackActive ? 'bg-gray-700' : 'bg-gray-900 hover:bg-black'
                    }`}
                  >
                    {isBlackActive && (
                      <div className="w-4 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
