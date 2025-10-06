import React, { useRef, useEffect, useState, useCallback } from 'react';

// --- Custom Hook for Audio Level Detection ---
const useAudioLevel = (stream: MediaStream | null | undefined) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) {
      setIsSpeaking(false);
      return;
    }
    
    // FIX: Add `window as any` to support older `webkitAudioContext` for broader browser compatibility.
    const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.5;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let speakingTimer: number | null = null;
    
    const checkSpeaking = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      
      if (average > 20) { // Threshold for speaking
        if (!speakingTimer) {
          setIsSpeaking(true);
        }
        if (speakingTimer) clearTimeout(speakingTimer);
        speakingTimer = window.setTimeout(() => {
          setIsSpeaking(false);
          speakingTimer = null;
        }, 1000); // User is considered "stopped" after 1s of silence
      }
    };
    
    const interval = setInterval(checkSpeaking, 100);

    return () => {
      clearInterval(interval);
      if (speakingTimer) clearTimeout(speakingTimer);
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return isSpeaking;
};

// --- Local VideoPlayer Component ---
interface VideoPlayerProps {
  stream: MediaStream | null | undefined;
  muted?: boolean;
  name: string;
  isMicOn: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, muted = false, name, isMicOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSpeaking = useAudioLevel(stream);
  const videoStream = stream?.getVideoTracks().length ? stream : null;
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream ?? null;
    }
  }, [videoStream]);

  const speakingClasses = isSpeaking ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-900' : 'ring-2 ring-transparent';

  return (
    <div className={`relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-lg w-full h-full flex justify-center items-center transition-all duration-300 ${speakingClasses}`}>
      {videoStream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover"></video>
      ) : (
        isMicOn && (
          <div className="w-full h-full flex justify-center items-center bg-gray-700">
            <span className="text-4xl font-bold text-white">{initial}</span>
          </div>
        )
      )}
      <div className="absolute bottom-1 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
        {name}
      </div>
    </div>
  );
};


// --- Local VideoGrid Component ---
interface RemoteParticipant {
    user: string;
    stream?: MediaStream;
    isCameraOn: boolean;
    isMicOn: boolean;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localStatus: { cameraOn: boolean; micOn: boolean };
  remoteParticipants: RemoteParticipant[];
  currentUser: string | null;
  containerHeight: number;
}

const VideoGrid: React.FC<VideoGridProps> = ({ localStream, localStatus, remoteParticipants, currentUser, containerHeight }) => {
  const showLocal = localStatus.cameraOn || localStatus.micOn;
  const activeRemotes = remoteParticipants.filter(p => p.isCameraOn || p.isMicOn);
  
  if (!showLocal && activeRemotes.length === 0) {
    return null;
  }

  const PADDING = 8; // p-2 from tailwind
  const tileHeight = containerHeight - (PADDING * 2);
  const tileWidth = tileHeight * (16 / 9);

  return (
    <div className="w-full h-full p-2 flex flex-row gap-2 justify-center md:justify-start overflow-x-auto">
        {showLocal && (
          <div style={{ width: `${tileWidth}px`, height: `${tileHeight}px` }} className="flex-shrink-0">
            <VideoPlayer stream={localStream} muted name={`${currentUser} (You)`} isMicOn={localStatus.micOn}/>
          </div>
        )}
        {activeRemotes.map(({ user, stream, isMicOn }) => (
          <div key={user} style={{ width: `${tileWidth}px`, height: `${tileHeight}px` }} className="flex-shrink-0">
            <VideoPlayer stream={stream} name={user} isMicOn={isMicOn} />
          </div>
        ))}
    </div>
  );
};


// --- Main Exported ScreenShareWindow Component ---
interface ScreenShareWindowProps {
  screenStream: MediaStream | null;
  localUserStream: MediaStream | null;
  localUserStatus: { cameraOn: boolean; micOn: boolean };
  remoteParticipants: RemoteParticipant[];
  sharingUser: string | null;
  currentUser: string | null;
}

const ScreenShareWindow: React.FC<ScreenShareWindowProps> = ({ screenStream, localUserStream, localUserStatus, remoteParticipants, sharingUser, currentUser }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSharingLocally = sharingUser === currentUser;

  const [gridHeight, setGridHeight] = useState(144); // Default height 9rem
  const isResizingRef = useRef(false);

  const MIN_HEIGHT = 80;
  const MAX_HEIGHT = 400;

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  }, []);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newHeight = window.innerHeight - e.clientY;
    const clampedHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));
    setGridHeight(clampedHeight);
  }, []);

  const handleResizeMouseUp = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  }, []);

  useEffect(() => {
    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [handleResizeMouseMove, handleResizeMouseUp]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <div className="w-full h-full flex justify-center items-center relative bg-gray-900/50 rounded-2xl overflow-hidden">
      {screenStream ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" muted={isSharingLocally}></video>
      ) : (
        <div className="text-center text-white p-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <h2 className="text-xl font-bold">Welcome to the Conversation</h2>
          <p className="text-gray-300">Turn on your camera or mic to begin.</p>
        </div>
      )}
      {sharingUser && (
         <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
            {isSharingLocally ? "You are sharing your screen" : `${sharingUser} is sharing`}
         </div>
      )}
      
      <div 
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{ height: `${gridHeight}px` }}
      >
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 left-0 right-0 h-3 bg-transparent cursor-row-resize flex justify-center items-center group z-30"
        >
          <div className="w-12 h-1 bg-white/30 rounded-full group-hover:bg-white/70 transition-colors"></div>
        </div>
        
        <VideoGrid 
          localStream={localUserStream}
          localStatus={localUserStatus}
          remoteParticipants={remoteParticipants}
          currentUser={currentUser}
          containerHeight={gridHeight}
        />
      </div>
    </div>
  );
};

export default ScreenShareWindow;