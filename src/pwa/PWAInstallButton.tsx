import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { Button } from '../design-system';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D49A3D] hover:bg-[#C2892E] text-[#121829] text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${className}`}
        aria-label="Install Saremi Academy App"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition cursor-pointer min-h-[44px] sm:min-h-0 ${className}`}
          aria-label="Install App on iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#D49A3D]" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-left animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#D49A3D]" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed space-y-2 mb-4">
                Enjoy full-screen live classrooms, daily practice reminders, and offline Tanpura:
              </p>
              <ol className="text-xs text-gray-700 space-y-2.5 list-decimal list-inside bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE5DB]">
                <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
              <Button
                variant="brass"
                size="sm"
                className="w-full mt-4"
                onClick={() => setShowIOSGuide(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
