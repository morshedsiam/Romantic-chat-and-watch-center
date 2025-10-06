import React, { useState } from 'react';

interface UsernameModalProps {
  onUsernameSet: (username: string) => void;
  initialUsername: string;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ onUsernameSet, initialUsername }) => {
  const [name, setName] = useState(initialUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUsernameSet(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-md">
      <div className="bg-white/20 border border-white/30 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Whisper Room</h2>
        <p className="text-rose-100 mb-6">Please enter your name to join the chat.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-3 bg-white/30 border border-rose-200/50 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-300 mb-4 placeholder:text-rose-100 text-white"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:bg-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-black/20 transition-all duration-300"
            disabled={!name.trim()}
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
