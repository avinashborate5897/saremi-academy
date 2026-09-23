import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Image as ImageIcon, Sliders, AlertCircle, X, Upload } from 'lucide-react';
import { virtualBackgroundService, VirtualBackgroundMode } from '../../lib/agoraVirtualBackground';

interface VirtualBackgroundControlsProps {
  isTeacherOrAdmin: boolean;
  onModeChange?: (mode: VirtualBackgroundMode) => void;
  className?: string;
  variant?: 'floating' | 'toolbar';
}

export const VirtualBackgroundControls: React.FC<VirtualBackgroundControlsProps> = ({
  isTeacherOrAdmin,
  onModeChange,
  className = '',
  variant = 'floating'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<VirtualBackgroundMode>('saremi');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const supported = virtualBackgroundService.checkCompatibility();
    setIsSupported(supported);
    if (!supported) {
      setIsEnabled(false);
      setMode('none');
    }
  }, []);

  if (!isTeacherOrAdmin) {
    return null;
  }

  const handleToggle = async (enabled: boolean) => {
    setIsProcessing(true);
    setIsEnabled(enabled);
    const newMode: VirtualBackgroundMode = enabled ? 'saremi' : 'none';
    setMode(newMode);
    try {
      if (enabled) {
        await virtualBackgroundService.applyBackground('saremi');
        setStatusMessage('Saremi Studio Background active');
      } else {
        await virtualBackgroundService.disable();
        setStatusMessage('Background disabled');
      }
      onModeChange?.(newMode);
    } catch (e: any) {
      setStatusMessage('Could not update background');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSelectMode = async (selectedMode: VirtualBackgroundMode) => {
    setIsProcessing(true);
    setMode(selectedMode);
    const enabled = selectedMode !== 'none';
    setIsEnabled(enabled);
    try {
      if (selectedMode === 'none') {
        await virtualBackgroundService.disable();
        setStatusMessage('Camera background removed');
      } else {
        await virtualBackgroundService.applyBackground(selectedMode);
        setStatusMessage(selectedMode === 'saremi' ? 'Default Saremi Studio applied' : 'Custom background applied');
      }
      onModeChange?.(selectedMode);
    } catch (e: any) {
      setStatusMessage('Failed to change background');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setIsProcessing(true);
        setMode('custom');
        setIsEnabled(true);
        try {
          await virtualBackgroundService.setCustomImage(dataUrl);
          setStatusMessage('Custom background loaded');
          onModeChange?.('custom');
        } catch (err) {
          setStatusMessage('Failed to load custom image');
        } finally {
          setIsProcessing(false);
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (variant === 'toolbar') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
            isEnabled
              ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
          }`}
          title="Virtual Studio Background"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="hidden md:inline">Studio BG</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-amber-400' : 'bg-gray-500'}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-12 right-0 w-72 bg-[#121824] border border-amber-500/30 rounded-2xl p-4 shadow-2xl z-50 text-white backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-100">Virtual Background</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isSupported && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Client WebAssembly/WebGL virtual background acceleration is limited on this device. Live camera streaming continues normally.</span>
              </div>
            )}

            {/* Quick On/Off Switch */}
            <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-300 font-medium">Virtual Background</span>
              <button
                disabled={!isSupported || isProcessing}
                onClick={() => handleToggle(!isEnabled)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                  isEnabled ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Preset Options */}
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-gray-400 font-medium px-1">Background Presets</p>

              {/* Default Saremi Background */}
              <button
                disabled={!isSupported || isProcessing}
                onClick={() => handleSelectMode('saremi')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                  mode === 'saremi' && isEnabled
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                    : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                {/* Mini Visual Thumbnail */}
                <div className="w-12 h-8 rounded-lg overflow-hidden border border-amber-500/40 bg-black shrink-0 relative">
                  <img
                    src="/saremi-virtual-bg.svg"
                    alt="Saremi Studio"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-100">Default Saremi Studio</span>
                    {mode === 'saremi' && isEnabled && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">Branded conservatory & logo</p>
                </div>
              </button>

              {/* No Background */}
              <button
                disabled={isProcessing}
                onClick={() => handleSelectMode('none')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                  mode === 'none' || !isEnabled
                    ? 'bg-gray-800/80 border-gray-600 text-gray-200'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="w-12 h-8 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400 font-mono">None</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-100">No Background</span>
                    {(mode === 'none' || !isEnabled) && (
                      <Check className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">Original live camera feed</p>
                </div>
              </button>
            </div>

            {/* Custom Background Upload (Optional) */}
            <div className="mt-3 pt-2.5 border-t border-gray-800">
              <label className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  className="hidden"
                />
              </label>
            </div>

            {statusMessage && (
              <p className="mt-2 text-[10px] text-amber-300 text-center animate-pulse">
                {statusMessage}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Floating variant for the teacher video tile
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
          isEnabled
            ? 'bg-black/75 text-amber-300 border-amber-500/40 hover:bg-black/90'
            : 'bg-black/60 text-gray-400 border-gray-700 hover:text-white'
        }`}
        title="Teacher Studio Background Settings"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Studio BG</span>
        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 w-64 bg-[#101622]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl z-40 text-white backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Teacher Virtual BG
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <button
              disabled={isProcessing}
              onClick={() => handleSelectMode('saremi')}
              className={`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                mode === 'saremi' && isEnabled
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                  : 'bg-gray-900/70 border-gray-800 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Default Saremi Background
              </span>
              {mode === 'saremi' && isEnabled && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            <button
              disabled={isProcessing}
              onClick={() => handleSelectMode('none')}
              className={`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                mode === 'none' || !isEnabled
                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                  : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                No Background (Original)
              </span>
              {(mode === 'none' || !isEnabled) && <Check className="w-3.5 h-3.5 text-gray-300" />}
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
            <span>Center-framed teacher feed</span>
            {isProcessing ? (
              <span className="text-amber-400">Updating...</span>
            ) : isEnabled ? (
              <span className="text-emerald-400">Published to Live</span>
            ) : (
              <span>Disabled</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
