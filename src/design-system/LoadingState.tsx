import React from 'react';

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Harmonizing your music space...',
  subtext = 'Connecting to Saremi Conservatory live stream',
  className = ''
}) => {
  return (
    <div className={`p-12 text-center flex flex-col items-center justify-center ${className}`}>
      {/* Musical pulse indicator */}
      <div className="flex items-center gap-1.5 h-10 mb-4">
        <span className="w-1.5 bg-[#D49A3D] rounded-full animate-bounce [animation-delay:-0.3s] h-8" />
        <span className="w-1.5 bg-[#121829] rounded-full animate-bounce [animation-delay:-0.15s] h-10" />
        <span className="w-1.5 bg-[#D49A3D] rounded-full animate-bounce h-6" />
        <span className="w-1.5 bg-[#121829] rounded-full animate-bounce [animation-delay:-0.2s] h-9" />
        <span className="w-1.5 bg-[#D49A3D] rounded-full animate-bounce [animation-delay:-0.4s] h-7" />
      </div>
      <h4 className="font-serif text-base font-bold text-[#121829] mb-1">
        {message}
      </h4>
      <p className="text-xs text-gray-400">
        {subtext}
      </p>
    </div>
  );
};
