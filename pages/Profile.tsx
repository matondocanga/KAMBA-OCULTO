import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealBackend } from '../services/realBackend';
import { User } from '../types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [clothing, setClothing] = useState({ shirt: '', pants: '', shoes: '' });
  const [notifs, setNotifs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = RealBackend.onAuthStateChange(u => {
        if (!u) navigate('/');
        else {
            setUser(u);
            const p = u as any;
            if(p.phone) setPhone(p.phone);
            if(p.address) setAddress(p.address);
            if(p.giftPreferences) setPrefs(p.giftPreferences);
            if(p.clothingSize) setClothing(p.clothingSize);
        }
    });
    return () => unsub();
  }, [navigate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 500000) { // Limit to 500KB for Firestore base64
            alert("A imagem é muito grande! Tenta uma menor que 500KB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            if(user) {
                // Optimistic update
                setUser({...user, avatar: base64String});
                await RealBackend.updateProfile(user.id, { avatar: base64String });
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
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

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-6 pb-24">
      <div className="flex flex-col items-center mb-6 relative">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-[#D4AF37] object-cover bg-gray-100" alt="avatar" />
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs font-bold">Trocar 📷</span>
            </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
        
        <h2 className="text-xl font-bold mt-3">{user.name}</h2>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="space-y-6">
        {/* Settings Section */}
        <section>
          <h3 className="text-sm font-bold text-[#C62828] uppercase border-b pb-2 mb-3">Dados Pessoais</h3>
          <div className="space-y-3">
             <div>
                <label className="text-xs text-gray-500 block mb-1">Telemóvel</label>
                <input 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="WhatsApp"
                    className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm"
                />
             </div>
             <div>
                <label className="text-xs text-gray-500 block mb-1">Endereço</label>
                <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Seu Endereço Principal"
                    className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm"
                    rows={2}
                />
             </div>
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
                <div>
                     <label className="text-[10px] block text-center mb-1">Camisa</label>
                     <input value={clothing.shirt} onChange={e => setClothing({...clothing, shirt: e.target.value})} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" />
                </div>
                <div>
                     <label className="text-[10px] block text-center mb-1">Calça</label>
                     <input value={clothing.pants} onChange={e => setClothing({...clothing, pants: e.target.value})} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" />
                </div>
                <div>
                     <label className="text-[10px] block text-center mb-1">Sapatos</label>
                     <input value={clothing.shoes} onChange={e => setClothing({...clothing, shoes: e.target.value})} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-2 text-sm text-center" />
                </div>
            </div>
        </section>

        <section>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
             <span className="text-sm font-medium">Notificações Push</span>
             {/* Simple visual toggle */}
             <button onClick={() => setNotifs(!notifs)} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notifs ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifs ? 'translate-x-5' : 'translate-x-0'}`}></div>
             </button>
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