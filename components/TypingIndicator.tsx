import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) {
    return null;
  }

  const generateTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    }
    if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    }
    return `${users.slice(0, 2).join(', ')} and ${users.length - 2} more are typing`;
  };

  return (
    <div className="flex flex-col items-start animate-pop-in">
      <div className="bg-white text-gray-800 self-start rounded-r-2xl rounded-tl-2xl px-4 py-2 shadow-md flex items-center gap-2">
        <span className="text-sm text-gray-500 italic">{generateTypingText()}</span>
        <div className="flex gap-1 items-center h-5">
            <span className="typing-dot h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
            <span className="typing-dot h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
            <span className="typing-dot h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;