import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-center gap-2 rounded-xl bg-[#121829] border border-[#D49A3D]/40 px-4 py-2.5 text-xs font-medium text-[#FAF8F5] shadow-xl backdrop-blur-md animate-in slide-in-from-bottom">
      <WifiOff className="w-4 h-4 text-[#D49A3D] animate-pulse" />
      <span>Offline Mode — Riyaaz tools & cached notes are active</span>
    </div>
  );
};
