import React from 'react';
import { WifiOff, Zap } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:right-auto sm:max-w-md z-[100] bg-slate-900/95 backdrop-blur-md text-white border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-bounce-subtle">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div>
          <div className="text-amber-300 font-bold font-display flex items-center gap-1.5">
            <span>Network Unstable</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <p className="text-slate-300 text-[11px] leading-tight mt-0.5">
            Offline Mode Active — Practice studio & cached curriculum remain accessible.
          </p>
        </div>
      </div>
      <div className="shrink-0 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
        Cached
      </div>
    </div>
  );
};
