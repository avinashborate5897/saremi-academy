import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import { Button } from '../../design-system';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={install}
        leftIcon={<Download className="w-4 h-4" />}
      >
        Install App
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIOSGuide(true)}
          className="border-white/20 text-white"
        >
          Install on iOS
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl relative text-center">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Install on iPhone / iPad</h3>
              <p className="mt-2 text-sm font-medium text-gray-600 mb-6">
                1. Tap the <strong>Share</strong> button in the Safari toolbar.<br /><br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowIOSGuide(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
