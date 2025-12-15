import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealBackend } from '../services/realBackend';
import { User } from '../types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [clothing, setClothing] = useState({ shirt: 'M', pants: '40', shoes: '42' });
  const [notifs, setNotifs] = useState(true);

  useEffect(() => {
    const unsub = RealBackend.onAuthStateChange(u => {
        if (!u) navigate('/');
        else {
            setUser(u);
            // Load existing profile data (mocked fields for now, or assume contained in user obj)
            // In a full implementation, these would come from the User object in Firestore
        }
    });
    return () => unsub();
  }, [navigate]);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    try {
        await RealBackend.updateProfile(user.id, {
            giftPreferences: prefs,
            clothingSize: clothing,
            phone,
            address
        });
        alert("Perfil atualizado com sucesso! 🇦🇴");
    } catch(e) {
        alert("Erro ao salvar");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-6 pb-24">
      <div className="flex flex-col items-center mb-6">
        <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-[#D4AF37] mb-3" alt="avatar" />
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="space-y-6">
        {/* Settings Section */}
        <section>
          <h3 className="text-sm font-bold text-[#C62828] uppercase border-b pb-2 mb-3">Dados Pessoais</h3>
          <div className="space-y-3">
             <input 
               value={phone}
               onChange={e => setPhone(e.target.value)}
               placeholder="Telemóvel (WhatsApp)"
               className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm"
             />
             <textarea 
               value={address}
               onChange={e => setAddress(e.target.value)}
               placeholder="Seu Endereço Principal"
               className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm"
               rows={2}
             />
          </div>
        </section>

        <section>
           <h3 className="text-sm font-bold text-[#C62828] uppercase border-b pb-2 mb-3">Preferências de Presentes</h3>
           <textarea 
            className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm"
            rows={3}
            placeholder="O que gostarias de ganhar? (Ex: Livros, Vinho...)"
            value={prefs}
            onChange={e => setPrefs(e.target.value)}
          />
        </section>

        <section>
            <h3 className="text-sm font-bold text-[#C62828] uppercase border-b pb-2 mb-3">Tamanhos</h3>
            <div className="grid grid-cols-3 gap-2">
                <input 
                    placeholder="Camisa" 
                    value={clothing.shirt}
                    onChange={e => setClothing({...clothing, shirt: e.target.value})}
                    className="bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" 
                />
                <input 
                    placeholder="Calça" 
                    value={clothing.pants}
                    onChange={e => setClothing({...clothing, pants: e.target.value})}
                    className="bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" 
                />
                <input 
                    placeholder="Sapatos" 
                    value={clothing.shoes}
                    onChange={e => setClothing({...clothing, shoes: e.target.value})}
                    className="bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" 
                />
            </div>
        </section>

        <section>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
             <span className="text-sm font-medium">Notificações Push</span>
             <input type="checkbox" checked={notifs} onChange={e => setNotifs(e.target.checked)} className="toggle" />
          </div>
        </section>

        <button 
            onClick={handleSave}
            className="w-full bg-[#C62828] text-white font-bold py-3 rounded-lg shadow hover:bg-red-700 transition"
        >
            Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default Profile;