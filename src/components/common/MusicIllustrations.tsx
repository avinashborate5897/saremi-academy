import React from 'react';

// Consistent, playful, premium SVG illustrations for Saremi Academy
export const MusicalNotesFloat: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`pointer-events-none select-none relative ${className}`}>
    <span className="absolute -top-3 left-2 text-saremi-primary animate-music-float opacity-80 text-xl">🎵</span>
    <span className="absolute top-1 -right-4 text-saremi-secondary animate-music-float-delayed opacity-75 text-lg">🎶</span>
    <span className="absolute -bottom-2 left-6 text-saremi-yellow animate-music-float opacity-90 text-sm">✨</span>
    <span className="absolute -top-6 right-8 text-saremi-blue animate-music-float-delayed opacity-70 text-base">⭐</span>
  </div>
);

export const SoundWaveIcon: React.FC<{ active?: boolean; className?: string }> = ({ active = true, className = '' }) => (
  <div className={`flex items-center gap-1 h-7 px-2 py-1 bg-saremi-soft-purple rounded-full ${className}`}>
    <span className={`w-1 rounded-full bg-saremi-primary ${active ? 'animate-sound-wave-1' : 'h-2'}`} />
    <span className={`w-1 rounded-full bg-saremi-secondary ${active ? 'animate-sound-wave-2' : 'h-3'}`} />
    <span className={`w-1 rounded-full bg-saremi-blue ${active ? 'animate-sound-wave-3' : 'h-4'}`} />
    <span className={`w-1 rounded-full bg-saremi-green ${active ? 'animate-sound-wave-4' : 'h-2'}`} />
    <span className={`w-1 rounded-full bg-saremi-yellow ${active ? 'animate-sound-wave-1' : 'h-3'}`} />
  </div>
);

export const SingingIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="singingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEAF1" />
          <stop offset="100%" stopColor="#F0EAFF" />
        </linearGradient>
        <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5C8A" />
          <stop offset="100%" stopColor="#6C4BF4" />
        </linearGradient>
      </defs>
      {/* Background soft bubble */}
      <circle cx="100" cy="100" r="85" fill="url(#singingGrad)" />
      
      {/* Sound waves rings */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="#FF5C8A" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
      <circle cx="100" cy="100" r="55" fill="none" stroke="#6C4BF4" strokeWidth="2" opacity="0.3" />

      {/* Pop Microphone Stand */}
      <rect x="96" y="95" width="8" height="60" rx="4" fill="#334155" />
      <ellipse cx="100" cy="155" rx="30" ry="8" fill="#1E293B" opacity="0.2" />
      
      {/* Mic Head & Grille */}
      <rect x="86" y="55" width="28" height="42" rx="14" fill="url(#micGrad)" />
      <line x1="86" y1="70" x2="114" y2="70" stroke="#FFF" strokeWidth="2" opacity="0.6" />
      <line x1="86" y1="80" x2="114" y2="80" stroke="#FFF" strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="65" r="5" fill="#FFF" opacity="0.8" />

      {/* Decorative floating notes */}
      <path d="M140 50 Q150 40 160 50 T170 50" fill="none" stroke="#FF5C8A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="140" cy="50" r="4" fill="#FF5C8A" />
      <circle cx="160" cy="50" r="4" fill="#FF5C8A" />
      
      <circle cx="50" cy="65" r="3" fill="#FFD84D" />
      <polygon points="50,55 53,62 60,62 55,66 57,73 50,69 43,73 45,66 40,62 47,62" fill="#FFD84D" transform="scale(0.8) translate(10, 10)" />
      
      {/* Sparkles */}
      <circle cx="150" cy="120" r="3" fill="#43C6FF" />
      <circle cx="45" cy="130" r="4" fill="#54D68A" />
    </svg>
  </div>
);

export const GuitarIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="guitarBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4EA" />
          <stop offset="100%" stopColor="#FFE8D6" />
        </linearGradient>
        <linearGradient id="guitarBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9B54" />
          <stop offset="100%" stopColor="#FF5C8A" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="85" fill="url(#guitarBg)" />
      
      {/* Guitar Neck */}
      <rect x="94" y="30" width="12" height="70" rx="3" fill="#7C2D12" transform="rotate(-30 100 100)" />
      <rect x="88" y="20" width="24" height="20" rx="4" fill="#9A3412" transform="rotate(-30 100 100)" />
      
      {/* Guitar Body (Acoustic 8-Shape) */}
      <g transform="rotate(-30 100 100)">
        {/* Upper bout */}
        <circle cx="100" cy="110" r="26" fill="url(#guitarBody)" />
        {/* Lower bout */}
        <circle cx="100" cy="142" r="34" fill="url(#guitarBody)" />
        {/* Sound Hole */}
        <circle cx="100" cy="120" r="12" fill="#3E160C" />
        <circle cx="100" cy="120" r="14" fill="none" stroke="#FFD84D" strokeWidth="2" />
        {/* Strings */}
        <line x1="98" y1="25" x2="98" y2="155" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
        <line x1="100" y1="25" x2="100" y2="155" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
        <line x1="102" y1="25" x2="102" y2="155" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
        {/* Bridge */}
        <rect x="90" y="148" width="20" height="6" rx="2" fill="#3E160C" />
      </g>
      
      {/* Floating vibe elements */}
      <circle cx="155" cy="55" r="4" fill="#FF9B54" />
      <circle cx="145" cy="140" r="5" fill="#6C4BF4" />
      <path d="M40 70 Q50 60 60 75" fill="none" stroke="#FF5C8A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

export const KeyboardIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="pianoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9F8FF" />
          <stop offset="100%" stopColor="#F0EAFF" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="85" fill="url(#pianoBg)" />
      
      {/* Keyboard Bed */}
      <rect x="35" y="75" width="130" height="65" rx="14" fill="#1E293B" />
      
      {/* White Keys */}
      <rect x="42" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="58" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="74" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="90" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="106" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="122" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="138" y="82" width="14" height="50" rx="4" fill="#FFFFFF" />
      <rect x="154" y="82" width="4" height="50" rx="2" fill="#FFFFFF" />

      {/* Black Keys */}
      <rect x="52" y="82" width="9" height="30" rx="2" fill="#0F172A" />
      <rect x="68" y="82" width="9" height="30" rx="2" fill="#0F172A" />
      <rect x="100" y="82" width="9" height="30" rx="2" fill="#0F172A" />
      <rect x="116" y="82" width="9" height="30" rx="2" fill="#0F172A" />
      <rect x="132" y="82" width="9" height="30" rx="2" fill="#0F172A" />

      {/* Glow / Sparkles */}
      <circle cx="100" cy="50" r="6" fill="#43C6FF" opacity="0.8" />
      <circle cx="160" cy="65" r="4" fill="#FFD84D" />
      <path d="M45 55 Q60 40 75 55" fill="none" stroke="#43C6FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

export const TablaIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="tablaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF6C9" />
          <stop offset="100%" stopColor="#FFF9F1" />
        </linearGradient>
        <linearGradient id="bayanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="dayanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="85" fill="url(#tablaBg)" />

      {/* Bayan (Left Base Drum) */}
      <g transform="translate(45, 65)">
        <ellipse cx="30" cy="60" rx="28" ry="10" fill="#64748B" opacity="0.3" />
        <path d="M5,25 Q1,50 12,65 Q30,72 48,65 Q59,50 55,25 Z" fill="url(#bayanGrad)" />
        <ellipse cx="30" cy="25" rx="25" ry="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <ellipse cx="26" cy="24" rx="12" ry="5" fill="#1E293B" />
      </g>

      {/* Dayan (Right Wood Drum) */}
      <g transform="translate(105, 70)">
        <ellipse cx="25" cy="55" rx="22" ry="8" fill="#78350F" opacity="0.3" />
        <path d="M6,20 Q4,45 12,55 Q25,60 38,55 Q46,45 44,20 Z" fill="url(#dayanGrad)" />
        <ellipse cx="25" cy="20" rx="19" ry="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
        <ellipse cx="25" cy="20" rx="9" ry="4" fill="#1E293B" />
        {/* Tuning pegs */}
        <rect x="3" y="32" width="4" height="12" rx="1" fill="#78350F" />
        <rect x="43" y="32" width="4" height="12" rx="1" fill="#78350F" />
      </g>

      {/* Rhythm energy rings */}
      <path d="M70 40 Q100 25 130 40" fill="none" stroke="#FFD84D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="30" r="3" fill="#FF9B54" />
      <circle cx="160" cy="90" r="4" fill="#54D68A" />
    </svg>
  </div>
);

export const ViolinIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="violinBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0EAFF" />
          <stop offset="100%" stopColor="#FFEAF1" />
        </linearGradient>
        <linearGradient id="violinBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="85" fill="url(#violinBg)" />
      
      {/* Violin Neck */}
      <rect x="96" y="25" width="8" height="60" rx="2" fill="#475569" transform="rotate(25 100 100)" />
      <circle cx="120" cy="35" r="7" fill="#334155" />

      {/* Violin Body */}
      <g transform="rotate(25 100 100)">
        <ellipse cx="100" cy="115" rx="26" ry="18" fill="url(#violinBody)" />
        <ellipse cx="100" cy="145" rx="32" ry="24" fill="url(#violinBody)" />
        {/* Waist indentation */}
        <path d="M76,128 Q88,130 76,132" fill="#F0EAFF" />
        <path d="M124,128 Q112,130 124,132" fill="#F0EAFF" />
        {/* F-holes */}
        <path d="M90 125 Q92 135 88 142" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
        <path d="M110 125 Q108 135 112 142" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
      </g>

      {/* Bow */}
      <line x1="40" y1="160" x2="160" y2="40" stroke="#FFD84D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

export const FluteIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="fluteBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9F8FF" />
          <stop offset="100%" stopColor="#E6FFFA" />
        </linearGradient>
        <linearGradient id="bambooGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="85" fill="url(#fluteBg)" />
      
      {/* Bamboo Bansuri Flute */}
      <g transform="rotate(-35 100 100)">
        <rect x="30" y="93" width="140" height="14" rx="7" fill="url(#bambooGrad)" />
        {/* Thread bindings */}
        <rect x="45" y="93" width="5" height="14" fill="#FF5C8A" />
        <rect x="155" y="93" width="5" height="14" fill="#FF5C8A" />
        {/* Tone holes */}
        <circle cx="70" cy="100" r="3" fill="#0F172A" />
        <circle cx="85" cy="100" r="3" fill="#0F172A" />
        <circle cx="100" cy="100" r="3" fill="#0F172A" />
        <circle cx="115" cy="100" r="3" fill="#0F172A" />
        <circle cx="130" cy="100" r="3" fill="#0F172A" />
        <circle cx="145" cy="100" r="3" fill="#0F172A" />
      </g>

      {/* Melodic Swirls */}
      <path d="M130 50 Q160 70 145 95 T175 110" fill="none" stroke="#54D68A" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <circle cx="140" cy="45" r="4" fill="#43C6FF" />
      <circle cx="50" cy="140" r="5" fill="#FFD84D" />
    </svg>
  </div>
);

export const TeacherIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <circle cx="100" cy="100" r="85" fill="#F0EAFF" />
      
      {/* Teacher avatar circle */}
      <circle cx="100" cy="85" r="28" fill="#6C4BF4" />
      {/* Headphone on teacher */}
      <path d="M72 85 A28 28 0 0 1 128 85" fill="none" stroke="#FF5C8A" strokeWidth="6" strokeLinecap="round" />
      <rect x="68" y="76" width="8" height="18" rx="4" fill="#FF5C8A" />
      <rect x="124" y="76" width="8" height="18" rx="4" fill="#FF5C8A" />

      {/* Smiling Face elements */}
      <circle cx="93" cy="82" r="3" fill="#FFFFFF" />
      <circle cx="107" cy="82" r="3" fill="#FFFFFF" />
      <path d="M94 92 Q100 98 106 92" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Body / Torso */}
      <path d="M60 155 Q100 130 140 155" fill="#43C6FF" />
      
      {/* Mentor Star badge */}
      <circle cx="145" cy="55" r="16" fill="#FFD84D" />
      <polygon points="145,45 148,52 155,53 150,58 152,65 145,61 138,65 140,58 135,53 142,52" fill="#92400E" />
    </svg>
  </div>
);

export const TrophyCertificateIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
      <circle cx="100" cy="100" r="85" fill="#FFF9F1" />
      
      {/* Golden Trophy Cup */}
      <path d="M70 65 L130 65 L120 110 Q100 130 80 110 Z" fill="#FFD84D" stroke="#D97706" strokeWidth="3" />
      {/* Cup Handles */}
      <path d="M70 75 C55 75 55 95 72 100" fill="none" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M130 75 C145 75 145 95 128 100" fill="none" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      
      {/* Stem and Base */}
      <rect x="94" y="120" width="12" height="20" fill="#D97706" />
      <rect x="75" y="140" width="50" height="14" rx="4" fill="#6C4BF4" />
      
      {/* Star on trophy */}
      <polygon points="100,75 103,82 110,83 105,88 107,95 100,91 93,95 95,88 90,83 97,82" fill="#FFFFFF" />

      {/* Sparkles around */}
      <circle cx="45" cy="60" r="4" fill="#FF5C8A" />
      <circle cx="155" cy="70" r="5" fill="#43C6FF" />
      <circle cx="140" cy="140" r="4" fill="#54D68A" />
    </svg>
  </div>
);

export const InstrumentIllustrationMap: Record<string, React.FC<{ className?: string }>> = {
  singing: SingingIllustration,
  vocals: SingingIllustration,
  vocal: SingingIllustration,
  guitar: GuitarIllustration,
  keyboard: KeyboardIllustration,
  piano: KeyboardIllustration,
  tabla: TablaIllustration,
  violin: ViolinIllustration,
  flute: FluteIllustration,
  bansuri: FluteIllustration,
};

export const getInstrumentIllustration = (categoryOrName: string = '') => {
  const key = categoryOrName.toLowerCase();
  if (key.includes('sing') || key.includes('vocal') || key.includes('voice') || key.includes('raga')) return SingingIllustration;
  if (key.includes('guitar')) return GuitarIllustration;
  if (key.includes('piano') || key.includes('keyboard') || key.includes('synthesizer')) return KeyboardIllustration;
  if (key.includes('tabla') || key.includes('percussion') || key.includes('dholak')) return TablaIllustration;
  if (key.includes('violin') || key.includes('string')) return ViolinIllustration;
  if (key.includes('flute') || key.includes('bansuri') || key.includes('wind')) return FluteIllustration;
  return SingingIllustration;
};
