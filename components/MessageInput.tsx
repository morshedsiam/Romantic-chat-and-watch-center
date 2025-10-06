import React, { useState, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onTypingStatusChange: (isTyping: boolean) => void;
  onToggleScreenShare: (withAudio: boolean) => void;
  isSharing: boolean;
  canShare: boolean;
  onToggleCamera: () => void;
  isCameraOn: boolean;
  onToggleMic: () => void;
  isMicOn: boolean;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

const ScreenShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
);

const StopScreenShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-6-6M9.75 15.75l6-6" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
    </svg>
);

const StopCameraIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h10.5a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 1.5l21 21" />
    </svg>
);

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);

const StopMicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 1.5l21 21" />
    </svg>
);

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onTypingStatusChange, onToggleScreenShare, isSharing, canShare, onToggleCamera, isCameraOn, onToggleMic, isMicOn }) => {
  const [text, setText] = useState('');
  const [shareAudio, setShareAudio] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (typingTimeoutRef.current === null) {
      onTypingStatusChange(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingStatusChange(false);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      onTypingStatusChange(false);
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="p-4 border-t border-rose-200/50">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleScreenShare(shareAudio)}
              disabled={isLoading || !canShare}
              className={`p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${isSharing ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
              aria-label={isSharing ? "Stop sharing screen" : "Share screen"}
            >
              {isSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </button>
            {!isSharing && canShare && (
              <label className="flex items-center text-sm text-gray-600 cursor-pointer whitespace-nowrap" title="Share audio from your screen (e.g., a video in a tab)">
                <input 
                  type="checkbox" 
                  checked={shareAudio}
                  onChange={(e) => setShareAudio(e.target.checked)}
                  className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                />
                <span className="ml-1.5">Audio</span>
              </label>
            )}
        </div>
        <button
          type="button"
          onClick={onToggleCamera}
          disabled={isLoading}
          className={`p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${isCameraOn ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-400'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
          aria-label={isCameraOn ? "Stop camera" : "Start camera"}
        >
          {isCameraOn ? <StopCameraIcon /> : <CameraIcon />}
        </button>
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isLoading}
          className={`p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${isMicOn ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
          aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? <StopMicIcon /> : <MicIcon />}
        </button>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 w-full px-4 py-3 bg-white/70 border border-rose-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all duration-300 disabled:opacity-70 text-gray-800 placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 transition-all duration-300"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;