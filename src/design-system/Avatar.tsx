import React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: React.ReactNode;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  badge,
  className = ''
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  }[size];

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeStyles} rounded-full object-cover border-2 border-white shadow-sm`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeStyles} rounded-full bg-[#121829] text-[#D49A3D] font-bold flex items-center justify-center border-2 border-white shadow-sm select-none`}
        >
          {getInitials(name)}
        </div>
      )}
      {badge && (
        <div className="absolute -bottom-1 -right-1 z-10 flex items-center justify-center">
          {badge}
        </div>
      )}
    </div>
  );
};
