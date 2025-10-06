import React from 'react';

interface PulsingHeartProps {
  typingUsers: string[];
}

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-rose-500 drop-shadow-lg">
        <path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" />
    </svg>
);

const PulsingHeart: React.FC<PulsingHeartProps> = ({ typingUsers }) => {
  const isTyping = typingUsers.length > 0;

  const generateTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    }
    return 'Several people are typing...';
  };

  return (
    <div 
        className={`absolute bottom-24 right-4 pointer-events-none z-30 transition-all duration-500 transform flex flex-col items-center gap-2 ${isTyping ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        aria-hidden="true"
    >
      <div className={isTyping ? 'pulse-heart-animation' : ''}>
        <HeartIcon />
      </div>
      {isTyping && (
        <p className="text-sm font-semibold text-rose-800 bg-white/50 px-3 py-1 rounded-full shadow-md text-center">
          {generateTypingText()}
        </p>
      )}
    </div>
  );
};

export default PulsingHeart;