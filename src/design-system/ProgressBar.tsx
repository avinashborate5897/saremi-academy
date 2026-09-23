import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'brass' | 'emerald' | 'indigo' | 'colorful';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'brass',
  size = 'md',
  showLabel = false,
  label,
  className = ''
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  
  const heightClass = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-6'
  }[size];

  const fillVariant = {
    brass: 'bg-gradient-to-r from-saremi-yellow to-yellow-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    emerald: 'bg-gradient-to-r from-saremi-green to-emerald-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    indigo: 'bg-gradient-to-r from-saremi-primary to-purple-600 shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    colorful: 'bg-gradient-to-r from-saremi-primary via-saremi-secondary to-saremi-yellow shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]'
  }[variant];

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-bold text-gray-700">{label}</span>}
          {showLabel && <span className="font-serif font-bold text-gray-900 bg-saremi-soft-purple text-saremi-primary px-2 py-0.5 rounded-full">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-white border-2 border-gray-100 shadow-inner rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${fillVariant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
