import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Instagram
} from 'lucide-react';
import { SaremiButton } from '../common/SaremiUI';
import { MusicalNotesFloat, SingingIllustration, SoundWaveIcon } from '../common/MusicIllustrations';
import { SaremiLogo } from '../common/SaremiLogo';

interface Props {
  onOpenBooking: () => void;
  onExploreCourses: () => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenBooking, onExploreCourses }) => {
  const instagramUrl = 'https://www.instagram.com/saremiacademy';

  return (
    <section className="relative w-full overflow-hidden bg-saremi-bg py-12 sm:py-16 lg:py-24">
      {/* Soft Pastel Background Blobs */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-saremi-soft-purple rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-saremi-soft-pink rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-64 h-64 bg-saremi-soft-yellow rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Top Badges & Instagram Handle Chip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-purple-100 shadow-xs">
                <SaremiLogo size="xs" className="h-5" alt="Saremi Academy" />
                <span className="w-1.5 h-1.5 rounded-full bg-saremi-secondary" />
                <span className="text-xs font-semibold text-slate-600">Live 1:1 Online Conservatory</span>
              </div>

              {/* Instagram Handle Chip */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#0F0F0F] border border-pink-200 hover:border-pink-400 text-xs font-bold transition-all shadow-xs group"
                title="Follow Saremi Academy on Instagram @saremiacademy"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform" />
                <span>@saremiacademy</span>
              </a>

              {/* Saremi AI Pandit Interactive Callout Chip */}
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('[aria-label="Open Saremi AI Pandit Chat"]') as HTMLElement;
                  if (el) el.click();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-50 via-white to-pink-50 border border-purple-200 hover:border-purple-400 text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Ask Saremi AI Pandit about ragas, taals, and fees"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="bg-gradient-to-r from-[#6C4BF4] to-pink-600 bg-clip-text text-transparent">
                  ✨ Saremi AI Pandit
                </span>
              </button>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12]">
              Discover the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saremi-primary via-purple-600 to-saremi-secondary">
                Artist Within.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the joy of music with live 1:1 mentorship from certified maestros, interactive smart Riyaaz practice tools, and recognized graded certification.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <SaremiButton 
                variant="primary" 
                size="lg" 
                onClick={onOpenBooking} 
                icon={<Sparkles className="w-5 h-5 text-amber-300" />}
                className="w-full sm:w-auto"
              >
                Book a Free Trial
              </SaremiButton>
              
              <SaremiButton 
                variant="outline" 
                size="lg" 
                onClick={onExploreCourses} 
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="w-full sm:w-auto"
              >
                Explore Courses
              </SaremiButton>
            </div>
            
            {/* Social Trust / Student Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 border-t border-purple-100/60">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-saremi-soft-purple">
                    <img 
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1534528741775-53994a69daeb' : i === 2 ? '1507003211169-0a1dd7228f2d' : i === 3 ? '1517841905240-472988babdf9' : '1539571696357-5a69c17a67c6'}?w=100&auto=format&fit=crop&q=80`} 
                      alt="Student" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
              <div className="text-left text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1 text-amber-500">
                  {'★'.repeat(5)} <span className="text-slate-800 font-extrabold ml-1">4.9/5</span>
                </div>
                <p className="text-slate-500 font-medium">Over 5,000+ happy students learning worldwide</p>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Musical Visual & Character Stage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Stage Backdrop Card */}
            <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-white via-saremi-soft-purple/50 to-saremi-soft-pink/40 rounded-[36px] p-6 shadow-saremi-card border border-purple-100/80 flex flex-col items-center justify-center">
              
              {/* Floating musical note elements */}
              <MusicalNotesFloat className="absolute inset-0 z-20" />

              {/* Main Center Instrument Scene */}
              <div className="relative z-10 animate-music-float">
                <SingingIllustration className="w-56 h-56" />
              </div>

              {/* Bottom Interactive Soundwave Pill */}
              <div className="absolute bottom-5 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-saremi-purple border border-purple-100">
                <span className="w-2.5 h-2.5 rounded-full bg-saremi-green animate-ping" />
                <span className="text-xs font-bold font-display text-slate-800">Live 1:1 Audio Studio</span>
                <SoundWaveIcon active={true} className="h-6" />
              </div>

              {/* Floating Instrument Badges */}
              <div className="absolute -top-3 -right-3 bg-white px-3.5 py-1.5 rounded-2xl shadow-saremi-pink border border-pink-100 text-xs font-bold font-display text-saremi-secondary rotate-6">
                🎸 Acoustic Guitar
              </div>
              <div className="absolute -bottom-2 -left-3 bg-white px-3.5 py-1.5 rounded-2xl shadow-saremi-blue border border-cyan-100 text-xs font-bold font-display text-saremi-blue -rotate-6">
                🎹 Classical Piano
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};
