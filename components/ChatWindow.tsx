import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUser: string | null;
  typingUsers: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser, typingUsers }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex flex-col gap-4 message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id ?? message.created_at} message={message} currentUser={currentUser} />
      ))}
      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;