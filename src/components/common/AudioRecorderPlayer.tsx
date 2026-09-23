import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AudioRecorderPlayerProps {
  label?: string;
  initialAudioUrl?: string;
  onAudioReady: (audioUrl: string, durationSeconds: number) => void;
  onClear?: () => void;
  maxDurationSeconds?: number;
  readOnly?: boolean;
}

export const AudioRecorderPlayer: React.FC<AudioRecorderPlayerProps> = ({
  label = 'Acoustic Audio Demonstration',
  initialAudioUrl,
  onAudioReady,
  onClear,
  maxDurationSeconds = 300, // 5 minutes max
  readOnly = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialAudioUrl) {
      setRecordedAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setRecorderError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioUrl(base64Audio);
          setTotalDuration(recordingSeconds);
          onAudioReady(base64Audio, recordingSeconds);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or unsupported:', err);
      setRecorderError(
        err.message || 'Microphone access is required to record audio. Please check your browser permissions.'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.playbackRate = playbackRate;
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setPlaybackTime(audioElementRef.current.currentTime);
      if (audioElementRef.current.duration) {
        setTotalDuration(audioElementRef.current.duration);
      }
    }
  };

  const handlePlaybackSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = rate;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setRecorderError('Please select a valid audio file (MP3, WAV, WebM).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setRecordedAudioUrl(url);
      setTotalDuration(60); // approximate
      onAudioReady(url, 60);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlaying(false);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setPlaybackTime(0);
    if (onClear) onClear();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 text-left space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
          {label}
        </label>
        {recordedAudioUrl && !readOnly && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Re-record
          </button>
        )}
      </div>

      {recorderError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recorderError}</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold text-red-950 font-mono">
              Recording... {formatTime(recordingSeconds)} / {formatTime(maxDurationSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Stop Recording
          </button>
        </div>
      ) : recordedAudioUrl ? (
        /* Audio Player Bar */
        <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
          <audio
            ref={audioElementRef}
            src={recordedAudioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-9 h-9 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full transition-all duration-150"
                  style={{
                    width: `${totalDuration ? Math.min(100, (playbackTime / totalDuration) * 100) : 0}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500 font-semibold">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Playback rate speed toggle for musicians */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handlePlaybackSpeed(rate)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : !readOnly ? (
        /* Recorder Controls */
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Mic className="w-4 h-4" />
            Record with Mic
          </button>

          <label className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50/80 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-amber-700" />
            Upload Audio File
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No audio recorded for this session.</p>
      )}
    </div>
  );
};
