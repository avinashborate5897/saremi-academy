import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../../design-system';
import { Play, Square, Music, Activity, ArrowRight, Volume2, Sliders } from 'lucide-react';
import { useRouter } from '../../router/RouterContext';
import { useTanpura, useMetronome } from '../../hooks/useAudioTools';

export const PracticeStudioPreview: React.FC = () => {
  const { navigate } = useRouter();
  
  // Tanpura State
  const { tanpuraPlaying, setTanpuraPlaying, selectedRoot, setSelectedRoot, tanpuraVolume, setTanpuraVolume } = useTanpura();
  
  // Metronome State
  const { tala, setTala, bpm, setBpm, metronomePlaying, setMetronomePlaying, currentBeat, currentTalaConfig } = useMetronome();

  return (
    <section className="py-24 bg-saremi-soft-purple relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-40 rounded-full blur-3xl -mr-20 -mt-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[40px] p-6 sm:p-8 border-4 border-white shadow-[0_20px_50px_rgba(108,75,244,0.15)] flex flex-col gap-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-2xl font-bold text-gray-900">My Studio</h3>
                <div className="w-12 h-6 bg-saremi-green rounded-full flex items-center p-1">
                  <div className="w-4 h-4 bg-white rounded-full translate-x-6 shadow-sm" />
                </div>
              </div>
              
              {/* Tanpura Control */}
              <div className="p-4 rounded-[20px] border-2 border-purple-100 bg-purple-50/50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${tanpuraPlaying ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-100 text-purple-600'}`}>
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Tanpura Drone</h4>
                      <p className="text-[10px] text-gray-500 font-mono">PITCH: {selectedRoot}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTanpuraPlaying(!tanpuraPlaying)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      tanpuraPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                    }`}
                  >
                    {tanpuraPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {tanpuraPlaying ? 'Stop' : 'Play'}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                   <Volume2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                   <input
                     type="range"
                     min="0.1"
                     max="1"
                     step="0.05"
                     value={tanpuraVolume}
                     onChange={e => setTanpuraVolume(parseFloat(e.target.value))}
                     className="w-full accent-purple-600"
                   />
                </div>
              </div>

              {/* Metronome Control */}
              <div className="p-4 rounded-[20px] border-2 border-orange-100 bg-orange-50/50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${metronomePlaying ? 'bg-orange-500 text-white shadow-md animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Tabla Taal</h4>
                      <p className="text-[10px] text-gray-500 font-mono">{tala} • {bpm} BPM</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMetronomePlaying(!metronomePlaying)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      metronomePlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                    }`}
                  >
                    {metronomePlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {metronomePlaying ? 'Stop' : 'Play'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-1 mt-2">
                   {Array.from({ length: 8 }, (_, i) => i + 1).map(b => (
                     <div 
                       key={b} 
                       className={`h-2 flex-1 rounded-full transition-all ${
                         metronomePlaying && currentBeat === b 
                           ? 'bg-orange-500 scale-y-150' 
                           : b <= currentTalaConfig.beats 
                             ? 'bg-orange-200' 
                             : 'bg-gray-100'
                       }`}
                     />
                   ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2">
             <h2 className="font-serif text-4xl font-bold text-gray-900 mb-6">Saremi Practice Studio</h2>
             <p className="text-gray-600 font-medium text-lg mb-8 leading-relaxed">
               Don't practice alone. Our built-in studio provides high-fidelity Tanpura, Tabla loops, Metronome, and Pitch monitors directly in your browser. Keep your streak alive every day.
             </p>
             <Button 
               variant="primary" 
               size="lg" 
               rightIcon={<ArrowRight className="w-5 h-5"/>}
               onClick={() => navigate('/tools')}
             >
               Open Practice Studio
             </Button>
          </div>

        </div>
      </div>
    </section>
  );
};
