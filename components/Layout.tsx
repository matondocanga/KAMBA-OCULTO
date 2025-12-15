import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Snowfall from './Snowfall';
import { RealBackend } from '../services/realBackend';
import { User } from '../types';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = RealBackend.onAuthStateChange((u) => {
        setUser(u);
        setLoading(false);
        // If on Auth page but logged in, redirect
        if (location.pathname === '/' && u) {
            navigate('/dashboard');
        }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    RealBackend.logout();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/';

  if (loading && !isAuthPage) return <div className="h-screen flex items-center justify-center text-[#C62828]">Carregando Kamba Oculto...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      <Snowfall />
      
      {!isAuthPage && user && (
        <header className="sticky top-0 z-50 bg-[#C62828] shadow-lg border-b-4 border-[#D4AF37]">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/dashboard" className="flex flex-col leading-none">
              <span className="text-[#D4AF37] font-black text-xl tracking-wider drop-shadow-md">KAMBA</span>
              <span className="text-white font-bold text-sm tracking-widest -mt-1">OCULTO</span>
            </Link>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <Link to="/profile">
                     <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border-2 border-[#D4AF37] bg-white object-cover"
                    />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-white text-sm hover:text-red-200 hidden md:block"
                  >
                    Sair
                  </button>
                </div>
            </div>
          </div>
        </header>
      )}

      <main className={`container mx-auto px-4 py-6 relative z-10 ${isAuthPage ? 'h-screen flex items-center justify-center' : ''}`}>
        {children}
      </main>

      {!isAuthPage && user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 pb-safe">
          <div className="flex justify-around items-center h-16">
            <Link to="/dashboard" className="flex flex-col items-center text-xs text-gray-600 hover:text-[#C62828]">
              <span className="text-xl">🏠</span>
              <span>Home</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center text-xs text-gray-600 hover:text-[#C62828]">
              <span className="text-xl">👤</span>
              <span>Perfil</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;