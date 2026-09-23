import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { Play, Share2, MessageCircle, Heart, ArrowLeft, Maximize2 } from 'lucide-react';
import { Button, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';
import { motion } from 'motion/react';

interface ShowcaseDetailViewProps {
  id: string;
}

export const ShowcaseDetailView: React.FC<ShowcaseDetailViewProps> = ({ id }) => {
  const { navigate } = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(128);

  // Demo Data fallback
  const title = id === 'p1' ? 'Raag Yaman Khayal' : 'Student Showcase Performance';
  const student = id === 'p1' ? 'Aisha V.' : 'Saremi Scholar';
  
  const handleLike = () => {
    if (liked) {
      setLikes(l => l - 1);
      setLiked(false);
    } else {
      setLikes(l => l + 1);
      setLiked(true);
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen pb-20 text-white selection:bg-pink-500 selection:text-white">
      <SEOHead
        title={`${title} by ${student}`}
        description="Experience a breathtaking student performance at Saremi Academy."
        canonicalPath={`/showcase/${id}`}
      />
      
      {/* Top Nav */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 z-50 flex items-center justify-between pointer-events-none">
        <button onClick={() => navigate('/performances')} className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Cinematic Player Area */}
      <div className="relative w-full h-[60vh] sm:h-[80vh] bg-black flex items-center justify-center group overflow-hidden">
        {/* Placeholder for actual video element */}
        <div className="absolute inset-0">
           <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80" alt={title} className={`w-full h-full object-cover transition-opacity duration-1000 ${isPlaying ? 'opacity-30' : 'opacity-60'}`} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent pointer-events-none" />

        {/* Play Button */}
        {!isPlaying && (
          <motion.button 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 w-24 h-24 rounded-full bg-pink-600/90 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform shadow-[0_0_50px_rgba(219,39,119,0.5)]"
            onClick={() => setIsPlaying(true)}
          >
            <Play className="w-10 h-10 fill-current ml-2" />
          </motion.button>
        )}
        
        {/* Fake Video UI when playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
             <div className="text-pink-500 animate-pulse font-bold tracking-widest uppercase">Simulating Video Playback...</div>
          </div>
        )}

        {/* Player Controls (Bottom) */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-4">
              <button className="text-white hover:text-pink-400" onClick={() => setIsPlaying(!isPlaying)}>
                 {isPlaying ? <span className="font-bold">PAUSE</span> : <Play className="w-6 h-6 fill-current"/>}
              </button>
              <div className="w-48 sm:w-96 h-1 bg-white/30 rounded-full overflow-hidden">
                 <div className="w-1/3 h-full bg-pink-500" />
              </div>
           </div>
           <button className="text-white hover:text-pink-400">
             <Maximize2 className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Details & Community */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-12">
          <div>
            <Badge variant="pink" className="bg-pink-500/10 text-pink-400 border-pink-500/20 mb-4">Showcase Performer</Badge>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-2">{title}</h1>
            <p className="text-xl text-gray-400 font-medium">Performed by <span className="text-white">{student}</span></p>
          </div>
          
          {/* Action Bar */}
          <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-full border border-gray-800">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-colors ${liked ? 'bg-pink-500/20 text-pink-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> {likes}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 font-bold transition-colors">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>

        {/* Community Comments (Moderated Demo) */}
        <div className="bg-gray-900 rounded-[32px] p-6 sm:p-10 border border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-pink-500" /> Community Cheers
            </h3>
            <Badge variant="brass" size="sm">Moderated</Badge>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold shrink-0">GK</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">Guru Kumar</span>
                  <Badge variant="purple" size="sm" className="bg-purple-500/20 text-purple-300 border-none px-1.5 py-0">Faculty</Badge>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
                <p className="text-gray-300 font-medium">Exceptional control over the microtones in the upper octave. The riyaaz is clearly paying off. Keep it up!</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 shrink-0">M</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">Meera T.</span>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
                <p className="text-gray-300 font-medium">This is so inspiring! 🎵 Giving me motivation for my own practice session today.</p>
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="mt-8 pt-8 border-t border-gray-800 flex gap-4">
             <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Share a supportive comment..." 
                  className="w-full bg-gray-950 border border-gray-800 rounded-full px-6 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-500 transition-colors">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
             </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4 font-medium">All comments are pre-moderated to ensure a positive, constructive environment.</p>

        </div>
      </div>
    </div>
  );
};
