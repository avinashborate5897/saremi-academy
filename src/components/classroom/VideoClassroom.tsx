import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2, Sparkles, VideoOff, Sun } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { virtualBackgroundService } from '../../lib/agoraVirtualBackground';
import { VirtualBackgroundControls } from './VirtualBackgroundControls';
import { requestAgoraToken } from '../../lib/sessionService';

// Silence verbose Agora SDK internal error popups when media hardware is not connected
try {
  AgoraRTC.setLogLevel(4); // 4 = NONE
} catch (_) {}

// Intercept benign DEVICE_NOT_FOUND error logs from Agora SDK so they do not crash or flag as uncaught errors
if (typeof window !== 'undefined' && !(window as any).__agoraConsoleFilterInstalled) {
  (window as any).__agoraConsoleFilterInstalled = true;
  const originalError = console.error;
  console.error = function (...args: any[]) {
    const errorStr = args
      .map(a => (typeof a === 'string' ? a : (a?.message || a?.name || '')))
      .join(' ');
    if (
      errorStr.includes('DEVICE_NOT_FOUND') ||
      errorStr.includes('NotFoundError: Requested device not found') ||
      errorStr.includes('track-mic') ||
      errorStr.includes('track-cam')
    ) {
      console.warn('[VideoClassroom Media Notice]', ...args);
      return;
    }
    return originalError.apply(console, args);
  };
}

interface VideoClassroomProps {
  classId: string;
  agoraChannelName?: string;
  studentName: string;
  teacherName: string;
  isTeacherOrAdmin: boolean;
  currentUserUid?: string;
  currentUserRole?: string;
  currentUserEmail?: string;
  isTrial?: boolean;
  trialId?: string;
  packageData?: any;
  isMicOn: boolean;
  isVideoOn: boolean;
  onStudentJoined?: () => void;
  onStudentLeft?: () => void;
}

export const VideoClassroom: React.FC<VideoClassroomProps> = ({
  classId,
  agoraChannelName,
  studentName,
  teacherName,
  isTeacherOrAdmin,
  currentUserUid,
  currentUserRole,
  currentUserEmail,
  isTrial,
  trialId,
  packageData,
  isMicOn,
  isVideoOn,
  onStudentJoined,
  onStudentLeft
}) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [hasMicDevice, setHasMicDevice] = useState<boolean>(true);
  const [hasCamDevice, setHasCamDevice] = useState<boolean>(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [audioMode, setAudioMode] = useState<'voice' | 'music'>('music');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('singing');

  const handleAudioModeChange = async (mode: 'voice' | 'music', inst: string) => {
    setAudioMode(mode);
    setSelectedInstrument(inst);
    if (localAudioTrack) {
      try {
        const profile = mode === 'music' ? 'music_standard_stereo' : 'speech_standard';
        await (localAudioTrack as any).setAudioProfile?.(profile);
      } catch (e) {
        console.warn('Audio profile switch notice:', e);
      }
    }
  };

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Screen Wake Lock API Integration to prevent display sleep during 1:1 live sessions
  const requestScreenWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.info('[VideoClassroom] Screen wake lock acquired for live music session.');
      } catch (err) {
        console.warn('[VideoClassroom] Screen wake lock request notice:', err);
      }
    }
  };

  const releaseScreenWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.info('[VideoClassroom] Screen wake lock released.');
      } catch (err) {
        console.warn('[VideoClassroom] Screen wake lock release notice:', err);
      }
    }
  };

  useEffect(() => {
    requestScreenWakeLock();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseScreenWakeLock();
    };
  }, []);

  // Compute unified Agora channel name
  const effectiveChannelName = 
    agoraChannelName 
      ? agoraChannelName.replace(/[^a-zA-Z0-9_-]/g, '_')
      : (isTrial || trialId || classId.startsWith('cls_trial_'))
      ? `saremi_trial_${(trialId || classId.replace('cls_trial_', '')).replace(/[^a-zA-Z0-9_-]/g, '_')}`
      : `saremi_class_${classId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  useEffect(() => {
    let isMounted = true;
    setConnectionStatus('connecting');
    setConnectionError(null);

    const initAgora = async () => {
      try {
        if (!agoraClientRef.current) {
          agoraClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        }
        const agoraClient = agoraClientRef.current;
        const channelName = effectiveChannelName;
        
        let numericUid = 0;
        if (currentUserUid) {
          let hash = 0;
          for (let i = 0; i < currentUserUid.length; i++) {
            hash = (hash << 5) - hash + currentUserUid.charCodeAt(i);
            hash |= 0;
          }
          numericUid = Math.abs(hash) || (Math.floor(Math.random() * 899999) + 100000);
        } else {
          numericUid = Math.floor(Math.random() * 899999) + 100000;
        }

        const roleStr = 'publisher'; // Both publisher in 1:1 live conservatory studio

        // Retrieve Firebase ID Token with readiness check
        let currentAuthUser = auth.currentUser;
        if (!currentAuthUser && typeof (auth as any).authStateReady === 'function') {
          await (auth as any).authStateReady();
          currentAuthUser = auth.currentUser;
        }

        const idToken = await currentAuthUser?.getIdToken();
        if (!idToken) {
          throw new Error('Please ensure you are logged into your account to enter this live class session.');
        }

        const data = await requestAgoraToken({
          channelName,
          uid: numericUid,
          role: roleStr as 'publisher',
          classId,
          isTrial: Boolean(isTrial || trialId || classId.startsWith('cls_trial_'))
        }, idToken);

        if (!isMounted) return;

        const { token, appId, uid } = data;

        // Auto-renew token before privilege expiration
        agoraClient.on('token-privilege-will-expire', async () => {
          try {
            const freshToken = await currentAuthUser?.getIdToken(true);
            if (freshToken) {
              const freshData = await requestAgoraToken({
                channelName,
                uid: numericUid,
                role: roleStr as 'publisher',
                classId,
                isTrial: Boolean(isTrial || trialId || classId.startsWith('cls_trial_'))
              }, freshToken);
              await agoraClient.renewToken(freshData.token);
              console.info('[VideoClassroom] Agora RTC token renewed successfully.');
            }
          } catch (renewErr) {
            console.warn('[VideoClassroom] Token renewal notice:', renewErr);
          }
        });

        agoraClient.on('user-published', async (user, mediaType) => {
          if (isTeacherOrAdmin && onStudentJoined) {
            onStudentJoined();
          }
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
            if (remoteVideoRef.current && user.videoTrack) {
              user.videoTrack.play(remoteVideoRef.current);
            }
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          }
        });

        agoraClient.on('user-left', (user) => {
          if (isTeacherOrAdmin && onStudentLeft) {
            onStudentLeft();
          }
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        if (agoraClient.connectionState === 'DISCONNECTED') {
          await agoraClient.join(appId, channelName, token, uid);
        }

        if (isMounted) {
          setConnectionStatus('connected');
        }

        // Safely verify whether microphone and camera hardware actually exist on the client
        let hasMic = false;
        let hasCam = false;

        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const audioProbe = await navigator.mediaDevices.getUserMedia({ audio: true });
            hasMic = audioProbe.getAudioTracks().length > 0;
            audioProbe.getTracks().forEach(t => t.stop());
          } catch (_) {
            hasMic = false;
          }

          try {
            const videoProbe = await navigator.mediaDevices.getUserMedia({ video: true });
            hasCam = videoProbe.getVideoTracks().length > 0;
            videoProbe.getTracks().forEach(t => t.stop());
          } catch (_) {
            hasCam = false;
          }
        }

        if (isMounted) {
          setHasMicDevice(hasMic);
          setHasCamDevice(hasCam);
        }

        let audioTrack: IMicrophoneAudioTrack | null = null;
        let videoTrack: ICameraVideoTrack | null = null;

        if (hasMic) {
          try {
            const audioProfile = audioMode === 'music' ? 'music_standard' : 'speech_standard';
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: audioProfile as any } as any);
            if (isMounted) setHasMicDevice(true);
          } catch (deviceErr: any) {
            console.warn('[VideoClassroom] Microphone unavailable:', deviceErr?.message || deviceErr);
            if (isMounted) setHasMicDevice(false);
          }
        }
        
        if (hasCam) {
          try {
            videoTrack = await AgoraRTC.createCameraVideoTrack();
            if (isMounted) setHasCamDevice(true);
          } catch (deviceErr: any) {
            console.warn('[VideoClassroom] Camera unavailable:', deviceErr?.message || deviceErr);
            if (isMounted) setHasCamDevice(false);
          }
        }

        if (!audioTrack && !videoTrack) {
          console.info('[VideoClassroom] Joined Agora session in interactive subscriber mode (no local media devices).');
        }

        if (isMounted) {
          if (audioTrack) setLocalAudioTrack(audioTrack);
          if (videoTrack) {
            setLocalVideoTrack(videoTrack);

            // Apply branded Saremi Academy virtual background for teacher before publishing
            if (isTeacherOrAdmin) {
              try {
                await virtualBackgroundService.setupTrack(videoTrack, 'saremi', true);
              } catch (vbErr) {
                console.warn('[VirtualBackground] Auto-apply notice:', vbErr);
              }
            }
          }

          const tracksToPublish = [audioTrack, videoTrack].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
          if (tracksToPublish.length > 0 && agoraClient.connectionState === 'CONNECTED') {
            await agoraClient.publish(tracksToPublish);
          }
        } else {
          audioTrack?.close();
          videoTrack?.close();
          agoraClient.leave();
        }
      } catch (error: any) {
        console.error('Agora connection error:', error);
        if (isMounted) {
          setConnectionStatus('error');
          setConnectionError(error?.message || 'Could not connect to Agora Live Classroom.');
        }
      }
    };

    initAgora();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          await virtualBackgroundService.cleanup();
        } catch (_) {}

        if (localAudioTrack) {
          localAudioTrack.stop();
          localAudioTrack.close();
        }
        if (localVideoTrack) {
          localVideoTrack.stop();
          localVideoTrack.close();
        }
        if (agoraClientRef.current) {
          agoraClientRef.current.removeAllListeners();
          await agoraClientRef.current.leave();
        }
      };
      cleanup();
    };
  }, [classId, effectiveChannelName, retryCount]);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      const user = remoteUsers[0];
      if (user.videoTrack) {
        user.videoTrack.play(remoteVideoRef.current);
      }
    }
  }, [remoteUsers]);

  useEffect(() => {
    if (localAudioTrack) {
      localAudioTrack.setMuted(!isMicOn);
    }
  }, [isMicOn, localAudioTrack]);

  useEffect(() => {
    if (localVideoTrack) {
      localVideoTrack.setMuted(!isVideoOn);
    }
  }, [isVideoOn, localVideoTrack]);

  return (
    <div className="flex-1 flex flex-col gap-4 relative">
      {/* Music-Grade Agora Audio Controls Bar */}
      <div className="bg-[#121829] text-white p-3 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs">
            🎵
          </span>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Agora Music-Grade Audio</span>
            <p className="text-[11px] text-slate-300">Optimized for Indian Classical & Western Instruments ({selectedInstrument})</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => handleAudioModeChange('music', selectedInstrument)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${audioMode === 'music' ? 'bg-[#D49A3D] text-[#121829] shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              Music Mode (High Fidelity)
            </button>
            <button
              onClick={() => handleAudioModeChange('voice', selectedInstrument)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${audioMode === 'voice' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              Voice Mode
            </button>
          </div>

          <select
            value={selectedInstrument}
            onChange={(e) => handleAudioModeChange(audioMode, e.target.value)}
            className="bg-slate-900 text-slate-100 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="singing">Singing / Vocal</option>
            <option value="guitar">Guitar</option>
            <option value="keyboard">Keyboard / Piano</option>
            <option value="tabla">Tabla</option>
            <option value="flute">Flute</option>
            <option value="violin">Violin</option>
            <option value="harmonium">Harmonium</option>
            <option value="tanpura">Tanpura</option>
          </select>

          {/* Screen Wake Lock API Active Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold" title="Screen Wake Lock is active to keep your screen illuminated during live class">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Screen Awake Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
      {/* Banner / Status alerts */}
      {connectionError && (
        <div className="absolute top-2 left-2 right-2 z-30 p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{connectionError}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                setConnectionError(null);
                setConnectionStatus('connecting');
                setRetryCount(c => c + 1);
              }}
              className="text-amber-300 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-red-900/60 border border-red-700/50 cursor-pointer transition-colors"
            >
              Retry
            </button>
            <button onClick={() => setConnectionError(null)} className="text-red-300 hover:text-white text-xs underline cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Teacher Stream */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A2333] to-[#0F1722] border border-gray-800 shadow-2xl flex flex-col justify-between p-4 group">
        <div 
          ref={isTeacherOrAdmin ? localVideoRef : remoteVideoRef}
          className="absolute inset-0 z-0" 
          style={{ objectFit: 'cover' }}
        />
        <div className="flex items-center justify-between z-10 gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-bold text-amber-300 border border-amber-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {teacherName} (Guru)
            </span>
            {isTeacherOrAdmin && (
              <VirtualBackgroundControls isTeacherOrAdmin={isTeacherOrAdmin} variant="floating" />
            )}
          </div>
          <span className="px-2 py-1 rounded-md bg-black/50 text-[11px] text-gray-300 font-mono">
            48 kHz / 24-bit
          </span>
        </div>
        
        {/* Placeholder if video is not playing */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-300 font-serif text-3xl font-bold mb-3 shadow-inner">
            {teacherName.charAt(0)}
          </div>
          {connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting to Agora Live Studio...</span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-medium">
              {isTeacherOrAdmin
                ? (localVideoTrack ? (isVideoOn ? 'Camera Active' : 'Camera Muted') : (hasCamDevice ? 'Camera Standby' : 'Virtual Studio (No Camera)'))
                : (remoteUsers.length > 0 ? 'Guru Live Stream' : 'Waiting for Guru...')}
            </p>
          )}
          <p className="text-[10px] text-gray-500 font-mono mt-1.5">
            Room: {effectiveChannelName}
          </p>
        </div>

        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 text-[11px] text-emerald-400">
            {isTeacherOrAdmin && !hasMicDevice ? (
              <MicOff className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {isTeacherOrAdmin
                ? (hasMicDevice ? (isMicOn ? 'Studio Mic Active' : 'Mic Muted') : 'No Mic Detected')
                : 'Studio Audio'}
            </span>
          </div>
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Agora Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Student Stream */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A2333] to-[#0F1722] border border-gray-800 shadow-2xl flex flex-col justify-between p-4">
        <div 
          ref={isTeacherOrAdmin ? remoteVideoRef : localVideoRef}
          className="absolute inset-0 z-0" 
          style={{ objectFit: 'cover' }}
        />
        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-bold text-gray-200 border border-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {studentName} {isTeacherOrAdmin ? '' : '(You)'}
          </span>
          <span className="px-2 py-1 rounded-md bg-black/50 text-[11px] text-gray-300 font-mono">
            {!isTeacherOrAdmin
              ? (localVideoTrack ? (isVideoOn ? 'HD Cam' : 'Cam Off') : (hasCamDevice ? 'Cam Standby' : 'No Cam'))
              : (remoteUsers.length > 0 ? 'HD Cam' : 'Offline')}
          </span>
        </div>

        {/* Placeholder if video is not playing */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-300 font-serif text-3xl font-bold mb-3">
            {studentName.charAt(0)}
          </div>
          <p className="text-xs text-gray-400 font-medium">
            {!isTeacherOrAdmin
              ? (localVideoTrack ? (isVideoOn ? 'Camera Active' : 'Camera Muted') : (hasCamDevice ? 'Camera Standby' : 'Interactive Audio Mode (No Camera)'))
              : (remoteUsers.length > 0 ? 'Student Video' : 'Waiting for student to join...')}
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-1.5">
            Room: {effectiveChannelName}
          </p>
        </div>

        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 text-[11px] text-gray-300">
            {!isTeacherOrAdmin ? (
              !hasMicDevice ? (
                <MicOff className="w-3.5 h-3.5 text-amber-400" />
              ) : isMicOn ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              )
            ) : (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {!isTeacherOrAdmin
                ? (hasMicDevice ? (isMicOn ? 'Mic Active' : 'Mic Muted') : 'No Mic Detected')
                : 'Student Audio'}
            </span>
          </div>
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Agora Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};
