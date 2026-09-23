import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { Play, Sparkles, Star, Mic, Music, PlayCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['All', 'Vocal', 'Instrumental', 'Kids', 'Adult', 'Classical', 'Contemporary'];

// Demo Data
const DEMO_PERFORMANCES = [
  { id: 'p1', title: 'Raag Yaman Khayal', student: 'Aisha V.', category: 'Vocal', type: 'Classical', views: '2.4k', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', badge: 'Showcase Performer' },
  { id: 'p2', title: 'Mozart Sonata in C', student: 'Leo M.', category: 'Instrumental', type: 'Classical', views: '1.8k', image: 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=600&q=80', badge: 'First Performance' },
  { id: 'p3', title: 'Disney Medley', student: 'Sita (Age 8)', category: 'Kids', type: 'Contemporary', views: '4.1k', image: 'https://images.unsplash.com/photo-1502773860571-211a597d6e4b?auto=format&fit=crop&w=600&q=80', badge: 'Rising Star' },
  { id: 'p4', title: 'Ghazal Evening', student: 'Rahul K.', category: 'Adult', type: 'Vocal', views: '3.2k', image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=600&q=80', badge: 'Showcase Performer' },
];

export const PerformancesView: React.FC = () => {
  const { navigate } = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = DEMO_PERFORMANCES.filter(p => activeCategory === 'All' || p.category === activeCategory || p.type === activeCategory);

  return (
    <div className="bg-gray-950 min-h-screen pb-20 text-white selection:bg-pink-500 selection:text-white">
      <SEOHead
        title="Student Performances & Showcases"
        description="Experience the musical journey of Saremi Academy students through live performances, digital recitals, and prestigious showcases."
        canonicalPath="/performances"
      />
      
      {/* Hero */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-gray-950 to-gray-950 pointer-events-none" />
        
        {/* Spotlight Effect */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-fuchsia-600/30 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge variant="pink" className="bg-pink-500/10 text-pink-400 border-pink-500/20">The Main Stage</Badge>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white leading-tight">
            Student Performances <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">& Showcases</span>
          </h1>
          <p className="text-lg text-gray-400 font-medium">
            Celebrate the dedication and artistry of our scholars. From first recitals to advanced masterclass showcases.
          </p>
          <p className="text-xs text-pink-500/70 font-bold uppercase tracking-widest pt-4">Demo Data - Beta Preview</p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_20px_rgba(219,39,119,0.4)]' 
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(perf => (
              <motion.div
                key={perf.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  onClick={() => navigate(`/showcase/${perf.id}`)}
                  className="group relative bg-gray-900 rounded-[24px] overflow-hidden border border-gray-800 hover:border-pink-500/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={perf.image} alt={perf.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-90">
                      <div className="w-16 h-16 rounded-full bg-pink-600/90 flex items-center justify-center text-white backdrop-blur-sm shadow-[0_0_30px_rgba(219,39,119,0.5)]">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </div>
                    </div>

                    <div className="absolute top-4 left-4">
                       <Badge variant="purple" className="bg-purple-500/80 backdrop-blur-md text-white border-none shadow-lg">
                         <Sparkles className="w-3 h-3 mr-1" /> {perf.badge}
                       </Badge>
                    </div>
                  </div>

                  <div className="p-6 relative z-10 bg-gray-900 mt-auto">
                    <h3 className="font-serif text-2xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">{perf.title}</h3>
                    <p className="text-gray-400 text-sm font-medium mb-4">{perf.student}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-2">
                        {perf.category === 'Vocal' ? <Mic className="w-4 h-4 text-gray-500" /> : <Music className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{perf.category}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><PlayCircle className="w-3 h-3"/> {perf.views}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
