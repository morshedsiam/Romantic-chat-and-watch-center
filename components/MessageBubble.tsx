import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUser: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const isCurrentUser = message.sender === currentUser;

  const bubbleClasses = isCurrentUser
    ? 'bg-rose-500 text-white self-end rounded-l-2xl rounded-tr-2xl'
    : 'bg-white text-gray-800 self-start rounded-r-2xl rounded-tl-2xl';
  
  const senderName = !isCurrentUser && (
    <p className="text-xs text-gray-500 mb-1 font-semibold">{message.sender}</p>
  );

  return (
    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
      {senderName}
      <div
        className={`max-w-md lg:max-w-lg px-5 py-3 shadow-md transition-all duration-300 ${bubbleClasses}`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;