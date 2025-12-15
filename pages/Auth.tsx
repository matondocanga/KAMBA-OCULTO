import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealBackend } from '../services/realBackend';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration Step
  const [step, setStep] = useState(1);
  
  // Basic Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Extra Mandatory Fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shirt, setShirt] = useState('');
  const [pants, setPants] = useState('');
  const [shoes, setShoes] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    // Check if there is a pending redirect from a group link
    const redirectPath = sessionStorage.getItem('redirectPath');
    if(redirectPath) {
       // Just ensuring we know it exists, actual redirect happens after auth
    }
  }, []);

  const handlePostAuth = () => {
      const redirectPath = sessionStorage.getItem('redirectPath');
      if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath);
      } else {
          navigate('/dashboard');
      }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await RealBackend.loginWithGoogle();
      handlePostAuth();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
          setError("Fechaste a janela do Google antes de terminar.");
      } else if (err.code === 'auth/cancelled-popup-request') {
          setError("Apenas um pedido de login por vez.");
      } else if (err.code === 'auth/unauthorized-domain') {
          setError("Este domínio não está autorizado no Firebase. Adiciona-o na consola.");
      } else {
          setError(`Erro no Google Auth: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && step === 1) {
        if (!name || !email || !password) {
            setError("Preencha todos os campos.");
            return;
        }
        if (password.length < 6) {
            setError("A senha deve ter 6+ caracteres.");
            return;
        }
        setStep(2);
        return;
    }

    setIsLoading(true);

    try {
        if (isRegistering) {
            if (!phone || !address || !shirt || !pants || !shoes) {
                setError("Por favor, preencha todos os dados de perfil.");
                setIsLoading(false);
                return;
            }
            await RealBackend.registerWithEmail(name, email, password, {
                phone,
                address,
                clothingSize: { shirt, pants, shoes }
            });
        } else {
            await RealBackend.loginWithEmail(email, password);
        }
        handlePostAuth();
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') setError('Este email já está a ser usado.');
        else if (err.code === 'auth/wrong-password') setError('Senha incorreta.');
        else if (err.code === 'auth/user-not-found') setError('Utilizador não encontrado.');
        else setError(err.message || "Ocorreu um erro.");
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
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200 text-center animate-bounce">
                {error}
            </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-4">
            
            {/* STEP 1: LOGIN or REGISTER BASIC */}
            {(!isRegistering || step === 1) && (
                <>
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
                </>
            )}

            {/* STEP 2: REGISTER DETAILS */}
            {isRegistering && step === 2 && (
                <div className="animate-fade-in">
                    <p className="text-center text-sm font-bold text-[#C62828] mb-4">Quase lá! Só mais uns dados para o presente 🎁</p>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telemóvel (WhatsApp)</label>
                            <input 
                                type="tel" 
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="9xx xxx xxx"
                                className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#D4AF37]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço Principal</label>
                            <input 
                                type="text" 
                                required
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Bairro, Rua, Ponto de ref..."
                                className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#D4AF37]"
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Camisa</label>
                                <input value={shirt} onChange={e => setShirt(e.target.value)} placeholder="M/L" className="w-full bg-[#FFF8E1] border p-2 rounded text-center text-sm" required />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Calça</label>
                                <input value={pants} onChange={e => setPants(e.target.value)} placeholder="40" className="w-full bg-[#FFF8E1] border p-2 rounded text-center text-sm" required />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sapato</label>
                                <input value={shoes} onChange={e => setShoes(e.target.value)} placeholder="42" className="w-full bg-[#FFF8E1] border p-2 rounded text-center text-sm" required />
                             </div>
                        </div>
                        
                        <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 underline w-full text-center mt-2">Voltar</button>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C62828] text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 hover:bg-red-700 mt-4"
            >
                {isLoading ? 'A processar...' : (isRegistering ? (step === 1 ? 'Continuar →' : 'Finalizar Cadastro') : 'Entrar na Conta')}
            </button>
        </form>

        <div className="text-center my-4">
            <button 
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); setStep(1); }}
                className="text-xs font-bold text-[#D4AF37] hover:underline uppercase tracking-wide"
            >
                {isRegistering ? 'Já tens conta? Entra aqui' : 'Não tens conta? Cria agora'}
            </button>
        </div>

        {!isRegistering && (
            <>
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
            </>
        )}

      </div>
    </div>
  );
};

export default Auth;