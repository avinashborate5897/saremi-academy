import React from 'react';

interface SaremiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  alt?: string;
  onClick?: () => void;
}

export const SaremiLogo: React.FC<SaremiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'auto',
  alt = 'Saremi Academy',
  onClick
}) => {
  // Height sizing classes while preserving natural aspect ratio
  const sizeClasses = {
    xs: 'h-6 sm:h-7',
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20'
  }[size];

  // Optional background / filter for dark contexts if needed
  const variantClasses = {
    light: 'brightness-105',
    dark: '',
    auto: ''
  }[variant];

  return (
    <img
      src="/saremi-logo.png"
      alt={alt}
      referrerPolicy="no-referrer"
      onClick={onClick}
      className={`w-auto object-contain max-w-full ${sizeClasses} ${variantClasses} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      loading="eager"
    />
  );
};
