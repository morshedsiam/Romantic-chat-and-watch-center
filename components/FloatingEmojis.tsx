
import React, { useState, useEffect } from 'react';

const EMOJIS = ['💖', '✨', '🌸', '🌹', '❤️', '💕', '💋', '💫', '😍', '🥰'];

interface Emoji {
  id: number;
  emoji: string;
  // FIX: Allow CSS custom properties (variables) in the style object.
  style: React.CSSProperties & { [key: `--${string}`]: string | number };
}

interface FloatingEmojisProps {
  isSharing: boolean;
}

const FloatingEmojis: React.FC<FloatingEmojisProps> = ({ isSharing }) => {
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  useEffect(() => {
    const createEmoji = () => {
       const newEmoji: Emoji = {
        id: Date.now() + Math.random(),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        style: {
          left: `${Math.random() * 100}vw`,
          animationDuration: `${Math.random() * 5 + 7}s`, // 7 to 12 seconds
          '--x-end': `${(Math.random() - 0.5) * 200}px`,
          '--rotate-end': `${(Math.random() - 0.5) * 720}deg`,
          fontSize: `${Math.random() * 1 + 1}rem`
        },
      };

      setEmojis(prev => [...prev, newEmoji]);

      setTimeout(() => {
        setEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 12000); 
    }
    
    const interval = setInterval(createEmoji, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-20 transition-opacity duration-700 ${isSharing ? 'opacity-30' : 'opacity-100'}`}>
      {emojis.map(({ id, emoji, style }) => (
        <span key={id} className="emoji-floater" style={style}>
          {emoji}
        </span>
      ))}
    </div>
  );
};

export default FloatingEmojis;