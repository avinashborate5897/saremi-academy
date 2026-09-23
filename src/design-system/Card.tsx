import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'musical' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-[28px] transition-all duration-300 text-left';
  
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[padding];

  const variantStyles = {
    default: 'bg-white border-2 border-gray-100 shadow-[0_8px_0_0_rgba(243,244,246,1)]',
    interactive: 'bg-white border-2 border-gray-100 hover:border-saremi-primary hover:shadow-[0_8px_0_0_rgba(108,75,244,0.2)] hover:-translate-y-1 cursor-pointer active:scale-[0.99] active:translate-y-0 active:shadow-[0_2px_0_0_rgba(108,75,244,0.2)]',
    musical: 'bg-saremi-bg border-2 border-saremi-yellow/50 shadow-[0_8px_0_0_rgba(255,216,77,0.3)]',
    elevated: 'bg-white border-none shadow-[0_20px_40px_-12px_rgba(108,75,244,0.15)]'
  }[variant];

  return (
    <div className={`${baseStyles} ${paddingStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
