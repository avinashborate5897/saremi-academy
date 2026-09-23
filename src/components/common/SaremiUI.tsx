import React from 'react';
import { Sparkles, Music, Star, ArrowRight, Loader2, X, Check } from 'lucide-react';

/* ==========================================================================
   1. BUTTON COMPONENT (12–18px radius, 2x horizontal padding, vibrant tokens)
   ========================================================================== */
export interface SaremiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'blue' | 'green' | 'yellow' | 'outline' | 'soft-purple' | 'soft-pink' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const SaremiButton: React.FC<SaremiButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs font-bold rounded-[12px] gap-1.5',
    md: 'px-5 py-2.5 text-sm font-bold rounded-[14px] gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-[16px] gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-saremi-primary text-white hover:bg-saremi-primary/90 active:scale-[0.98] shadow-saremi-purple transition-all duration-200',
    secondary: 'bg-saremi-secondary text-white hover:bg-saremi-secondary/90 active:scale-[0.98] shadow-saremi-pink transition-all duration-200',
    blue: 'bg-saremi-blue text-slate-900 hover:bg-saremi-blue/90 active:scale-[0.98] shadow-saremi-blue transition-all duration-200',
    green: 'bg-saremi-green text-slate-900 hover:bg-saremi-green/90 active:scale-[0.98] transition-all duration-200',
    yellow: 'bg-saremi-yellow text-slate-900 hover:bg-saremi-yellow/90 active:scale-[0.98] transition-all duration-200',
    outline: 'border-2 border-saremi-primary text-saremi-primary bg-white/80 hover:bg-saremi-soft-purple active:scale-[0.98] transition-all duration-200',
    'soft-purple': 'bg-saremi-soft-purple text-saremi-primary hover:bg-purple-100 active:scale-[0.98] transition-all duration-200',
    'soft-pink': 'bg-saremi-soft-pink text-saremi-secondary hover:bg-pink-100 active:scale-[0.98] transition-all duration-200',
    ghost: 'text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all duration-200',
  };

  const effectiveLeftIcon = leftIcon || (iconPosition === 'left' ? icon : null);
  const effectiveRightIcon = rightIcon || (iconPosition === 'right' ? icon : null);

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-display whitespace-nowrap cursor-pointer transition-transform select-none ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!isLoading && effectiveLeftIcon && <span className="shrink-0">{effectiveLeftIcon}</span>}
      <span>{children}</span>
      {!isLoading && effectiveRightIcon && <span className="shrink-0">{effectiveRightIcon}</span>}
    </button>
  );
};

/* ==========================================================================
   2. CARD COMPONENT (18–28px radius, soft subtle colorful shadows)
   ========================================================================== */
export interface SaremiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'cream' | 'soft-purple' | 'soft-pink' | 'soft-blue' | 'soft-yellow' | 'gradient';
  hoverEffect?: boolean;
  radius?: 'normal' | 'large' | 'hero';
}

export const SaremiCard: React.FC<SaremiCardProps> = ({
  children,
  variant = 'white',
  hoverEffect = true,
  radius = 'normal',
  className = '',
  ...props
}) => {
  const radiusClasses = {
    normal: 'rounded-[20px]',
    large: 'rounded-[24px]',
    hero: 'rounded-[32px]',
  };

  const variantClasses = {
    white: 'bg-white border border-slate-100 shadow-saremi-card',
    cream: 'bg-[#FFFDF9] border border-amber-50 shadow-saremi-card',
    'soft-purple': 'bg-saremi-soft-purple/70 border border-purple-100/80 shadow-saremi-card',
    'soft-pink': 'bg-saremi-soft-pink/70 border border-pink-100/80 shadow-saremi-card',
    'soft-blue': 'bg-saremi-soft-blue/70 border border-blue-100/80 shadow-saremi-card',
    'soft-yellow': 'bg-saremi-soft-yellow/60 border border-amber-100/80 shadow-saremi-card',
    gradient: 'bg-gradient-to-br from-white via-saremi-soft-purple/40 to-saremi-soft-pink/30 border border-purple-100 shadow-saremi-card',
  };

  return (
    <div
      className={`p-6 transition-all duration-300 ${radiusClasses[radius]} ${variantClasses[variant]} ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-saremi-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* ==========================================================================
   3. BADGE & PILL (Strictly single-line, instrument specific tokens)
   ========================================================================== */
export type InstrumentCategory = 'singing' | 'guitar' | 'keyboard' | 'tabla' | 'violin' | 'flute' | 'general' | 'live' | 'best-value' | 'discount';

export const SaremiBadge: React.FC<{
  children: React.ReactNode;
  category?: InstrumentCategory;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, category = 'general', size = 'sm', className = '' }) => {
  const categoryClasses: Record<InstrumentCategory, string> = {
    singing: 'bg-saremi-soft-pink text-saremi-secondary border border-pink-200',
    guitar: 'bg-orange-50 text-saremi-orange border border-orange-200',
    keyboard: 'bg-saremi-soft-blue text-saremi-blue border border-cyan-200',
    tabla: 'bg-saremi-soft-yellow text-amber-800 border border-yellow-200',
    violin: 'bg-saremi-soft-purple text-saremi-primary border border-purple-200',
    flute: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    general: 'bg-slate-100 text-slate-700 border border-slate-200',
    live: 'bg-red-500 text-white animate-pulse shadow-sm',
    'best-value': 'bg-gradient-to-r from-saremi-primary to-purple-800 text-white shadow-saremi-purple',
    discount: 'bg-amber-400 text-slate-950 font-black',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs rounded-full',
    md: 'px-3.5 py-1 text-xs font-bold rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-display font-semibold whitespace-nowrap select-none uppercase tracking-wider ${sizeClasses[size]} ${categoryClasses[category]} ${className}`}
    >
      {category === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
      {category === 'best-value' && <span>👑</span>}
      {children}
    </span>
  );
};

/* ==========================================================================
   4. PROGRESS RING & PROGRESS BAR (Rewarding & Animatable)
   ========================================================================== */
export const SaremiProgressBar: React.FC<{
  progress: number; // 0 to 100
  color?: 'purple' | 'pink' | 'blue' | 'green' | 'yellow';
  height?: string;
  showLabel?: boolean;
  className?: string;
}> = ({ progress, color = 'purple', height = 'h-3', showLabel = false, className = '' }) => {
  const boundedProgress = Math.min(100, Math.max(0, progress));

  const colorGradients = {
    purple: 'bg-gradient-to-r from-saremi-primary to-purple-400',
    pink: 'bg-gradient-to-r from-saremi-secondary to-pink-300',
    blue: 'bg-gradient-to-r from-saremi-blue to-cyan-300',
    green: 'bg-gradient-to-r from-saremi-green to-emerald-300',
    yellow: 'bg-gradient-to-r from-saremi-yellow to-amber-300',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold font-display text-slate-600">
          <span>Progress</span>
          <span className="text-saremi-primary">{Math.round(boundedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height} p-0.5`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorGradients[color]}`}
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
    </div>
  );
};

export const SaremiProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}> = ({ progress, size = 64, strokeWidth = 6, color = '#6C4BF4', className = '' }) => {
  const boundedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (boundedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute font-display font-bold text-xs text-slate-800">
        {Math.round(boundedProgress)}%
      </span>
    </div>
  );
};

/* ==========================================================================
   5. EMPTY STATE COMPONENT
   ========================================================================== */
export const SaremiEmptyState: React.FC<{
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({ icon = '🎵', title, description, actionText, onAction, className = '' }) => (
  <div className={`text-center py-12 px-6 rounded-[24px] bg-white border border-slate-100 shadow-saremi-card ${className}`}>
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-saremi-soft-purple flex items-center justify-center text-4xl animate-music-float shadow-inner">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-display text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <SaremiButton variant="primary" size="md" onClick={onAction}>
        {actionText}
      </SaremiButton>
    )}
  </div>
);

/* ==========================================================================
   6. LOADING / SHIMMER STATE
   ========================================================================== */
export const SaremiLoadingState: React.FC<{ text?: string; className?: string }> = ({
  text = 'Tuning the instruments...',
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
    <div className="flex items-center gap-1.5 h-10 mb-4 px-4 py-2 bg-saremi-soft-purple rounded-full">
      <span className="w-1.5 bg-saremi-primary rounded-full animate-sound-wave-1 h-6" />
      <span className="w-1.5 bg-saremi-secondary rounded-full animate-sound-wave-2 h-4" />
      <span className="w-1.5 bg-saremi-blue rounded-full animate-sound-wave-3 h-8" />
      <span className="w-1.5 bg-saremi-green rounded-full animate-sound-wave-4 h-5" />
      <span className="w-1.5 bg-saremi-yellow rounded-full animate-sound-wave-1 h-7" />
    </div>
    <p className="text-sm font-bold font-display text-saremi-primary animate-pulse">{text}</p>
  </div>
);

export const SaremiSkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-[20px] bg-white border border-slate-100 shadow-saremi-card animate-pulse ${className}`}>
    <div className="w-12 h-12 rounded-[16px] bg-slate-200 mb-4" />
    <div className="h-5 bg-slate-200 rounded-full w-3/4 mb-3" />
    <div className="h-3 bg-slate-100 rounded-full w-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-6" />
    <div className="h-10 bg-slate-200 rounded-[14px] w-full" />
  </div>
);

/* ==========================================================================
   7. INPUT & SELECT
   ========================================================================== */
export interface SaremiInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const SaremiInput: React.FC<SaremiInputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}) => (
  <div className="w-full text-left">
    {label && (
      <label className="block text-xs font-bold font-display text-slate-700 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-[14px] bg-white border text-sm font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-saremi-primary/30 focus:border-saremi-primary ${
          icon ? 'pl-10' : ''
        } ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200'} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500 font-semibold mt-1">{error}</p>}
    {!error && helperText && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
  </div>
);
