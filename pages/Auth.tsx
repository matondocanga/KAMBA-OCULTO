import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockBackend } from '../services/mockBackend';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    setIsLoading(true);
    try {
      await MockBackend.login(email, name);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper component for the Wave Animation
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
      {/* Styles for the wave animation */}
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-xs">Teu Nome</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-[#FFF8E1] text-gray-900 placeholder-gray-400 focus:border-[#C62828] outline-none transition font-bold"
              placeholder="Ex: João Malanji"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-xs">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-[#FFF8E1] text-gray-900 placeholder-gray-400 focus:border-[#C62828] outline-none transition font-bold"
              placeholder="joao@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#C62828] hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'A entrar...' : 'Começar Agora 🚀'}
          </button>
          
          <div className="mt-6 flex flex-col gap-3">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Ou entra com</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <button type="button" className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 transition opacity-60 cursor-not-allowed">
              Google (Em breve)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
