import React, { useState, useEffect, useMemo } from 'react';

interface PasswordModalProps {
  onPasswordSuccess: () => void;
}

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
    </svg>
);

const SuccessCharacter = () => (
    <svg viewBox="0 0 150 150" className="success-character w-36 h-36 mx-auto drop-shadow-lg">
      <defs>
        <radialGradient id="hairShine" cx="0.4" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="eyeShine" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      
      <path d="M30,80 C30,40 60,20 75,20 C90,20 120,40 120,80 C120,110 95,130 75,130 C55,130 30,110 30,80 Z" fill="#FFDFC4" />
      <path d="M20,80 C20,30 60,10 75,10 C90,10 130,30 130,80 L125,110 L25,110 Z" fill="#C06C84" />
      <path d="M35,25 C45,15 105,15 115,25 L120,50 L75,45 L30,50 Z" fill="#C06C84" />
      <path d="M75,10 C70,25 80,25 75,45" fill="#C06C84" />
      <path d="M20,80 C20,30 60,10 75,10 C90,10 130,30 130,80 L125,110 L25,110 Z" fill="url(#hairShine)" />
      
      <ellipse cx="58" cy="70" rx="12" ry="18" fill="#355C7D" />
      <circle cx="55" cy="65" r="5" fill="white" />
      <circle cx="62" cy="78" r="3" fill="url(#eyeShine)" />
      
      <ellipse cx="92" cy="70" rx="12" ry="18" fill="#355C7D" />
      <circle cx="89" cy="65" r="5" fill="white" />
      <circle cx="96" cy="78" r="3" fill="url(#eyeShine)" />
      
      <ellipse cx="48" cy="85" rx="10" ry="6" fill="#F67280" opacity="0.6" />
      <ellipse cx="102" cy="85" rx="10" ry="6" fill="#F67280" opacity="0.6" />
      
      <path d="M70,95 Q75,105 80,95" stroke="#A94064" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
);

const Sparkles = () => {
  const sparkleData = useMemo(() => Array.from({ length: 25 }).map(() => ({
    id: Math.random(),
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 0.7 + 0.3}s`,
      animationDelay: `${Math.random() * 0.5}s`,
    }
  })), []);

  return (
    <div className="sparkle-container">
      {sparkleData.map(sparkle => (
        <div key={sparkle.id} className="sparkle" style={sparkle.style as React.CSSProperties} />
      ))}
    </div>
  );
};

const PasswordModal: React.FC<PasswordModalProps> = ({ onPasswordSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onPasswordSuccess();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onPasswordSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Gadi is little kitten') {
      setIsSuccess(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword(''); // Clear the input on error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-md">
      <div className="password-modal-glow bg-white/20 border border-white/30 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        {!isSuccess ? (
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Enter the Whisper Room</h2>
            <p className="text-rose-100 mb-6">This is a private space. Please enter the password.</p>
            <form onSubmit={handleSubmit}>
              <div className="relative w-full mb-4">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setError(null);
                    setPassword(e.target.value);
                  }}
                  placeholder="Password"
                  className={`w-full px-4 py-3 bg-white/30 border rounded-full focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-rose-100 text-white ${error ? 'border-red-400 focus:ring-red-400' : 'border-rose-200/50 focus:ring-rose-300'}`}
                  autoFocus
                />
                 <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-rose-100 hover:text-white focus:outline-none"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:bg-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-black/20 transition-all duration-300"
                disabled={!password.trim()}
              >
                Enter
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10 success-animation-container h-64 flex flex-col justify-center items-center">
            <Sparkles />
            <SuccessCharacter />
            <h2 className="text-3xl neon-text mt-4">Welcome!</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordModal;