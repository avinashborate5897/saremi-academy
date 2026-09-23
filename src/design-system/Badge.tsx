import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brass' | 'emerald' | 'sky' | 'amber' | 'ruby' | 'outline' | 'purple' | 'pink';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-full select-none whitespace-nowrap shadow-sm';
  
  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 tracking-wider uppercase',
    md: 'text-xs px-3 py-1'
  }[size];

  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 border-b-2 border-gray-200',
    brass: 'bg-saremi-yellow text-[#7A5B08] border-b-2 border-[#E5B922]',
    emerald: 'bg-saremi-green text-green-900 border-b-2 border-green-600',
    sky: 'bg-saremi-blue text-blue-900 border-b-2 border-blue-500',
    amber: 'bg-saremi-orange text-orange-900 border-b-2 border-orange-500',
    ruby: 'bg-red-400 text-white border-b-2 border-red-600',
    outline: 'border-2 border-gray-200 text-gray-700 bg-white',
    purple: 'bg-saremi-primary text-white border-b-2 border-[#5035C0]',
    pink: 'bg-saremi-secondary text-white border-b-2 border-[#D93F6A]'
  }[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
};
