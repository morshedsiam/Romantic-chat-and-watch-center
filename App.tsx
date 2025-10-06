
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from './types';
import { supabase } from './services/supabaseClient';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import UsernameModal from './components/UsernameModal';
import type { RealtimeChannel } from '@supabase/supabase-js';
import FloatingEmojis from './components/FloatingEmojis';
import ScreenShareWindow from './components/ScreenShareWindow';
import PulsingHeart from './components/PulsingHeart';

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

type ParticipantStatus = { cameraOn: boolean; micOn: boolean };

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const [sharingUser, setSharingUser] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [participants, setParticipants] = useState<Map<string, ParticipantStatus>>(new Map());

  const [localUserStream, setLocalUserStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { camera?: MediaStream, screen?: MediaStream }>>(new Map());

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localUserStreamRef = useRef<MediaStream>(new MediaStream());
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const typingTimersRef = useRef<Map<string, number>>(new Map());
  
  messagesRef.current = messages;

  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleUsernameSet = (name: string) => {
    localStorage.setItem('chatUsername', name);
    setUsername(name);
  };

  const updatePresence = useCallback(() => {
    if (channelRef.current && username) {
        const payload = {
            user: username,
            sharing: !!localScreenStreamRef.current,
            cameraOn: localUserStreamRef.current.getVideoTracks().length > 0,
            micOn: localUserStreamRef.current.getAudioTracks().length > 0,
        };
        channelRef.current.track(payload);
    }
  }, [username]);
  
  const negotiateAllPeers = useCallback(async () => {
    for (const [remoteUser, pc] of peerConnectionsRef.current.entries()) {
      try {
        if (pc.signalingState === 'stable') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channelRef.current?.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'offer', offer, target: remoteUser, from: username } });
        }
      } catch (e) {
        console.error(`Renegotiation failed for ${remoteUser}`, e);
      }
    }
  }, [username]);

  const cleanupConnections = useCallback(() => {
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      
      localUserStreamRef.current.getTracks().forEach(track => track.stop());
      localUserStreamRef.current = new MediaStream();

      if(localScreenStreamRef.current) {
          localScreenStreamRef.current.getTracks().forEach(track => track.stop());
          localScreenStreamRef.current = null;
      }
      setLocalUserStream(null);
      setLocalScreenStream(null);
      setRemoteStreams(new Map());
      setIsCameraOn(false);
      setIsMicOn(false);
  }, []);

 const toggleCamera = useCallback(async () => {
    const videoTrack = localUserStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.stop();
      localUserStreamRef.current.removeTrack(videoTrack);
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track === videoTrack);
        if (sender) pc.removeTrack(sender);
      });
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        localUserStreamRef.current.addTrack(newTrack);
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(newTrack, localUserStreamRef.current);
        });
        setIsCameraOn(true);
      } catch (err) {
        console.error("Camera access failed:", err);
        setError("Failed to access camera. Please check browser permissions.");
      }
    }
    setLocalUserStream(new MediaStream(localUserStreamRef.current.getTracks()));
    updatePresence();
    await negotiateAllPeers();
  }, [updatePresence, negotiateAllPeers]);

  const toggleMic = useCallback(async () => {
    const audioTrack = localUserStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.stop();
      localUserStreamRef.current.removeTrack(audioTrack);
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track === audioTrack);
        if (sender) pc.removeTrack(sender);
      });
      setIsMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = stream.getAudioTracks()[0];
        localUserStreamRef.current.addTrack(newTrack);
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(newTrack, localUserStreamRef.current);
        });
        setIsMicOn(true);
      } catch (err) {
        console.error("Mic access failed:", err);
        setError("Failed to access microphone. Please check browser permissions.");
      }
    }
    setLocalUserStream(new MediaStream(localUserStreamRef.current.getTracks()));
    updatePresence();
    await negotiateAllPeers();
  }, [updatePresence, negotiateAllPeers]);

  const toggleScreenShare = useCallback(async (withAudio: boolean) => {
    if (localScreenStreamRef.current) {
      const stream = localScreenStreamRef.current;
      stream.getTracks().forEach(track => track.stop());
      peerConnectionsRef.current.forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && stream.getTracks().includes(sender.track)) {
            pc.removeTrack(sender);
          }
        });
      });
      localScreenStreamRef.current = null;
      setLocalScreenStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: withAudio });
        stream.getTracks().forEach(track => {
          track.onended = () => {
            if (localScreenStreamRef.current) toggleScreenShare(false); // Pass false to avoid re-prompting
          };
        });
        localScreenStreamRef.current = stream;
        setLocalScreenStream(stream);
        peerConnectionsRef.current.forEach(pc => {
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        });
      } catch (err) {
        console.error("Screen share failed:", err);
        localScreenStreamRef.current = null;
        setLocalScreenStream(null);
      }
    }
    updatePresence();
    await negotiateAllPeers();
  }, [updatePresence, negotiateAllPeers]);

  useEffect(() => {
    if (!username) return;

    const fetchMessages = async () => {
      setIsHistoryLoading(true);
      try {
        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Failed to fetch message history:', err);
        setError('Could not load message history.');
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchMessages();

    const channel = supabase.channel(`whisper-room-v2:${Date.now()}`, {
      config: { presence: { key: username }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    const handleTrackEvent = (event: RTCTrackEvent, remoteUser: string) => {
      const track = event.track;
      
      setRemoteStreams(prev => {
        const newRemoteStreams = new Map(prev);
        const userStreams = newRemoteStreams.get(remoteUser) || {};
        // Differentiate streams by checking for audio tracks on the incoming stream
        const streamIsScreen = event.streams[0]?.getAudioTracks().length > 0 || track.kind === 'video';
        const streamKey = streamIsScreen && localScreenStreamRef.current && event.streams[0].id.includes(localScreenStreamRef.current.id) ? 'screen' : 'camera';

        if (!userStreams[streamKey]) userStreams[streamKey] = new MediaStream();
        userStreams[streamKey]!.addTrack(track);
        
        track.onended = () => {
            setRemoteStreams(prevOnEnded => {
                const updatedStreams = new Map(prevOnEnded);
                const userStreamsOnEnded = updatedStreams.get(remoteUser);
                if (userStreamsOnEnded && userStreamsOnEnded[streamKey]) {
                    userStreamsOnEnded[streamKey]!.removeTrack(track);
                    if (userStreamsOnEnded[streamKey]!.getTracks().length === 0) delete userStreamsOnEnded[streamKey];
                }
                if(Object.keys(userStreamsOnEnded || {}).length === 0) updatedStreams.delete(remoteUser);
                return updatedStreams;
            });
        };
        newRemoteStreams.set(remoteUser, userStreams);
        return newRemoteStreams;
      });
    };

    const createPeerConnection = async (remoteUser: string, isInitiator: boolean) => {
      if (peerConnectionsRef.current.has(remoteUser)) return;
      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current.set(remoteUser, pc);
      
      localUserStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localUserStreamRef.current));
      if (localScreenStreamRef.current) localScreenStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localScreenStreamRef.current!));
      
      pc.onicecandidate = event => {
        if (event.candidate) channel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'candidate', candidate: event.candidate, target: remoteUser, from: username } });
      };
      pc.ontrack = (event) => handleTrackEvent(event, remoteUser);
      
      if (isInitiator) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'offer', offer, target: remoteUser, from: username } });
        } catch (err) {
            console.error(`Initial negotiation error with ${remoteUser}:`, err);
        }
      }
    };
    
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (!messagesRef.current.some(m => m.id === payload.new.id)) {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const currentUsers = Object.values(newState).flatMap((p: any) => p).map(p => p.user);
        const sharer = currentUsers.find(user => (newState[user][0] as any).sharing);
        setSharingUser(sharer || null);

        const newParticipants = new Map<string, ParticipantStatus>();
        currentUsers.forEach(user => {
          if (user !== username) {
            const presence = newState[user]?.[0];
            // FIX: Explicitly cast presence to 'any' to access dynamic properties
            // from Supabase presence state, resolving the 'unknown' type error.
            if (presence) {
              newParticipants.set(user, { cameraOn: (presence as any).cameraOn, micOn: (presence as any).micOn });
            }
          }
        });
        setParticipants(newParticipants);

        const remoteUsernames = currentUsers.filter(u => u !== username);
        remoteUsernames.forEach(remoteUser => { if (!peerConnectionsRef.current.has(remoteUser)) createPeerConnection(remoteUser, true); });
        peerConnectionsRef.current.forEach((pc, user) => {
            if (!remoteUsernames.includes(user)) {
                pc.close();
                peerConnectionsRef.current.delete(user);
                setRemoteStreams(prev => {
                    const newStreams = new Map(prev);
                    newStreams.delete(user);
                    return newStreams;
                });
            }
        });
      })
      .on('broadcast', { event: 'webrtc' }, async ({ payload }) => {
        if (payload.target !== username) return;
        const fromUser = payload.from;
        let pc = peerConnectionsRef.current.get(fromUser);
        if (payload.type === 'offer') {
          if (!pc) {
            await createPeerConnection(fromUser, false);
            pc = peerConnectionsRef.current.get(fromUser)!;
          }
          if (pc.signalingState !== 'stable') {
              // Handle offer collision
              await Promise.all([
                  pc.setLocalDescription({type: 'rollback'}),
                  pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
              ]);
          } else {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'answer', answer, target: fromUser, from: username } });
        } else if (payload.type === 'answer' && pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        } else if (payload.type === 'candidate' && pc) {
          if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { user, isTyping } = payload;
        if (!user || user === username) return;

        const existingTimer = typingTimersRef.current.get(user);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingTimersRef.current.delete(user);
        }

        if (isTyping) {
          setTypingUsers(prev => prev.includes(user) ? prev : [...prev, user]);
          const timer = window.setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== user));
            typingTimersRef.current.delete(user);
          }, 2000);
          typingTimersRef.current.set(user, timer);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== user));
        }
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') updatePresence();
        if (err) { setError('Could not connect. Please refresh.'); console.error('Real-time subscription error:', err); }
      });
    return () => {
      cleanupConnections();
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [username, cleanupConnections, updatePresence, negotiateAllPeers, toggleScreenShare]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!username) return;
    const { error } = await supabase.from('messages').insert([{ sender: username, text }]);
    if (error) { setError('Message could not be sent.'); console.error('Error sending message:', error); }
  }, [username]);
  
  const handleTypingStatusChange = useCallback((isTyping: boolean) => {
    if (channelRef.current && username) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: username, isTyping },
      });
    }
  }, [username]);

  const isSharing = username === sharingUser;
  const isAnyoneScreenSharing = !!sharingUser;

  const isLocalMediaActive = isCameraOn || isMicOn;
  const isRemoteMediaActive = Array.from(participants.values()).some(p => p.cameraOn || p.micOn);
  const isMediaActive = isAnyoneScreenSharing || isLocalMediaActive || isRemoteMediaActive;

  const activeScreenShareStream = isSharing ? localScreenStream : remoteStreams.get(sharingUser!)?.screen || null;

  const remoteParticipantList = Array.from(participants.entries())
    .map(([user, status]) => ({
        user,
        stream: remoteStreams.get(user)?.camera,
        isCameraOn: status.cameraOn,
        isMicOn: status.micOn,
    }));

  return (
    <div className="w-full h-screen flex flex-col p-4 relative">
      <FloatingEmojis isSharing={isMediaActive} />
      {!username && <UsernameModal onUsernameSet={handleUsernameSet} />}
      
      <div className={`w-full h-full flex flex-col md:flex-row gap-4 transition-all duration-500 relative z-10 ${!username ? 'scale-95' : ''}`}>
        <main className="flex-1 flex flex-col min-w-0">
          <ScreenShareWindow 
            screenStream={activeScreenShareStream} 
            localUserStream={localUserStream}
            localUserStatus={{cameraOn: isCameraOn, micOn: isMicOn}}
            remoteParticipants={remoteParticipantList}
            sharingUser={sharingUser} 
            currentUser={username} 
          />
        </main>
        <aside className="relative w-full md:w-96 lg:w-[450px] h-full flex flex-col bg-white/50 backdrop-blur-lg rounded-2xl shadow-xl shadow-pink-400/40">
           <header className="p-4 border-b border-rose-200/50">
            <h1 className="text-2xl font-bold text-center text-gray-800 tracking-wider">
              Whisper Room
            </h1>
            <p className="text-center text-sm text-gray-600">A shared space for conversations</p>
          </header>
          {error && (
              <div className="p-4 bg-red-100 text-red-700 text-center text-sm" onClick={() => setError(null)} style={{cursor: 'pointer'}}>
                  <strong>Error:</strong> {error} <span className="font-sans text-xs">(click to dismiss)</span>
              </div>
          )}
          <div className="flex-1 p-6 overflow-y-auto">
              {isHistoryLoading && username ? (
                  <div className="flex justify-center items-center h-full">
                      <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" aria-label="Loading history"></div>
                  </div>
              ) : (
                  <ChatWindow messages={messages} currentUser={username} typingUsers={typingUsers} />
              )}
          </div>
          <MessageInput 
            onSendMessage={handleSendMessage} 
            isLoading={!username || isHistoryLoading} 
            onTypingStatusChange={handleTypingStatusChange}
            onToggleScreenShare={toggleScreenShare}
            isSharing={!!localScreenStream}
            canShare={!sharingUser || isSharing}
            onToggleCamera={toggleCamera}
            isCameraOn={isCameraOn}
            onToggleMic={toggleMic}
            isMicOn={isMicOn}
          />
          <PulsingHeart isTyping={typingUsers.length > 0} />
        </aside>
      </div>
    </div>
  );
};

export default App;
