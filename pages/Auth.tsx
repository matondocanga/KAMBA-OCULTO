import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealBackend } from '../services/realBackend';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await RealBackend.loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError("Erro ao entrar com Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (isRegistering) {
            if (!name) throw new Error("Por favor, insira o seu nome.");
            await RealBackend.registerWithEmail(name, email, password);
        } else {
            await RealBackend.loginWithEmail(email, password);
        }
        navigate('/dashboard');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está a ser usado.');
        } else if (err.code === 'auth/wrong-password') {
            setError('Senha incorreta.');
        } else if (err.code === 'auth/user-not-found') {
            setError('Utilizador não encontrado. Cria uma conta.');
        } else if (err.code === 'auth/weak-password') {
            setError('A senha deve ter pelo menos 6 caracteres.');
        } else {
            setError(err.message || "Ocorreu um erro. Tenta novamente.");
        }
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
        
        <div className="text-center mb-8 mt-4">
          <div className="text-5xl font-black mb-2 tracking-wide">
            <WaveText text="KAMBA" colorClass="text-[#C62828]" />
          </div>
          <div className="text-2xl font-bold tracking-[0.3em]">
             <WaveText text="OCULTO" colorClass="text-[#D4AF37]" delayBase={0.5} />
          </div>
          <p className="text-gray-500 mt-6 text-sm font-medium animate-pulse">O amigo oculto mais mambo de Angola 🇦🇴</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        required={isRegistering}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Como te chamam?"
                        className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#D4AF37] outline-none"
                    />
                </div>
            )}
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="teu.email@exemplo.ao"
                    className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#D4AF37] outline-none"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#D4AF37] outline-none"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C62828] text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 hover:bg-red-700"
            >
                {isLoading ? 'A processar...' : (isRegistering ? 'Criar Conta Grátis' : 'Entrar na Conta')}
            </button>
        </form>

        <div className="text-center my-4">
            <button 
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs font-bold text-[#D4AF37] hover:underline uppercase tracking-wide"
            >
                {isRegistering ? 'Já tens conta? Entra aqui' : 'Não tens conta? Cria agora'}
            </button>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Ou continua com</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl shadow-sm transition flex items-center justify-center gap-3 mt-2"
        >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google
        </button>

      </div>
      
      <p className="text-center text-xs text-white/80 mt-6 drop-shadow-md font-bold">
         Feito com ❤️ para os kambas
      </p>
    </div>
  );
};

export default Auth;