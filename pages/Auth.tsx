import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealBackend } from '../services/realBackend';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await RealBackend.loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const WaveText = ({ text, colorClass, delayBase = 0 }: { text: string, colorClass: string, delayBase?: number }) => (
    <div className="flex justify-center">
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block ${colorClass}`}
          style={{ 
            animation: 'wave 2s infinite ease-in-out',
            animationDelay: `${delayBase + (i * 0.1)}s`
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#C62828] relative overflow-hidden">
        
        <div className="text-center mb-10 mt-4">
          <div className="text-5xl font-black mb-2 tracking-wide">
            <WaveText text="KAMBA" colorClass="text-[#C62828]" />
          </div>
          <div className="text-2xl font-bold tracking-[0.3em]">
             <WaveText text="OCULTO" colorClass="text-[#D4AF37]" delayBase={0.5} />
          </div>
          <p className="text-gray-500 mt-6 text-sm font-medium animate-pulse">O amigo oculto mais mambo de Angola 🇦🇴</p>
        </div>

        <div className="space-y-5">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            {isLoading ? 'A conectar...' : 'Entrar com Google'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Ao entrar, você concorda em partilhar presentes bue fixes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;