import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Group, User } from '../types';
import { RealBackend } from '../services/realBackend';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [isQueueing, setIsQueueing] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSlug, setNewGroupSlug] = useState('');
  const [isPublicGroup, setIsPublicGroup] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    // Auth Check
    const unsubAuth = RealBackend.onAuthStateChange((user) => {
        if (!user) navigate('/');
        setCurrentUser(user);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
      if (!currentUser) return;

      // Subscribe to My Groups
      const unsubMy = RealBackend.getMyGroups(currentUser.id, (groups) => {
          setMyGroups(groups);
      });

      // Subscribe to Public Groups
      const unsubPub = RealBackend.getPublicGroups((groups) => {
          setPublicGroups(groups.filter(g => !g.members.includes(currentUser.id)));
      });

      return () => {
          unsubMy();
          unsubPub();
      };
  }, [currentUser]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
        const g = await RealBackend.createGroup(currentUser.id, isPublicGroup, newGroupName || undefined, newGroupSlug || undefined);
        setShowCreateModal(false);
        navigate(`/group/${g.id}`);
    } catch (e) {
        alert("Erro ao criar grupo.");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !joinCode) return;
    
    try {
        const res = await RealBackend.joinGroup(joinCode, currentUser.id);
        alert(res.message);
        if (res.success) {
            setShowJoinModal(false);
            navigate(`/group/${joinCode}`);
        }
    } catch (e) {
        alert("Erro ou código inválido.");
    }
  };

  const handleJoinPublicQueue = async () => {
    if (!currentUser) return;
    setIsQueueing(true);
    try {
        const matchedGroupId = await RealBackend.joinQueue(currentUser.id);
        if (matchedGroupId) {
            alert("Encontramos um grupo para ti! 🇦🇴");
            navigate(`/group/${matchedGroupId}`);
        } else {
            alert("Estás na fila de espera! Assim que tivermos 4 pessoas, o grupo é criado.");
        }
    } catch (e) {
        alert("Erro ao entrar na fila.");
    } finally {
        setIsQueueing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-[#C62828] to-[#B71C1C] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Olá, {currentUser?.name}! 👋</h1>
          <p className="opacity-90 text-sm">Pronto para trocar mambos?</p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-[#C62828] px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-gray-100 transition"
            >
              + Criar Grupo
            </button>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="bg-gray-900 bg-opacity-40 text-white border border-white border-opacity-30 px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-opacity-60 transition"
            >
              🔑 Entrar com Código
            </button>
            <Link to="/shop" className="bg-[#2E7D32] text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-green-700 transition">
              🛍️ Loja Global
            </Link>
            <button 
              onClick={handleJoinPublicQueue}
              disabled={isQueueing}
              className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-yellow-600 transition disabled:opacity-70"
            >
              {isQueueing ? 'Procurando...' : '🌍 Fila (Auto)'}
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 text-8xl opacity-10 transform translate-x-4 translate-y-4">🎁</div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'my' ? 'border-[#C62828] text-[#C62828]' : 'border-transparent text-gray-500'}`}
        >
          Meus Grupos
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'public' ? 'border-[#C62828] text-[#C62828]' : 'border-transparent text-gray-500'}`}
        >
          Explorar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeTab === 'my' ? (
          myGroups.length > 0 ? (
            myGroups.map(group => (
              <Link to={`/group/${group.id}`} key={group.id}>
                <GroupCard group={group} isMember={true} />
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              <p>Ainda não tens grupos.</p>
            </div>
          )
        ) : (
          publicGroups.map(group => (
            <div key={group.id} onClick={async () => {
              if(!currentUser) return;
              const res = await RealBackend.joinGroup(group.id, currentUser.id);
              if(res.success) {
                  alert(res.message);
                  navigate(`/group/${group.id}`);
              } else {
                  alert(res.message);
              }
            }}>
               <GroupCard group={group} isMember={false} />
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[#C62828]">Criar Novo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome do Grupo</label>
                <input 
                  type="text" 
                  className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#C62828] outline-none"
                  placeholder="Ex: Família da Banda"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="publicToggle"
                  checked={isPublicGroup}
                  onChange={e => setIsPublicGroup(e.target.checked)}
                  className="w-5 h-5 text-[#C62828] rounded focus:ring-[#C62828]"
                />
                <label htmlFor="publicToggle" className="text-sm text-gray-700">Grupo Público (Qualquer um pode entrar)</label>
              </div>
              <button type="submit" className="w-full bg-[#C62828] text-white font-bold py-3 rounded-lg shadow mt-2">
                Criar Grupo
              </button>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[#2E7D32]">Entrar com Código</h2>
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <p className="text-sm text-gray-500">Pede o ID do grupo ao administrador.</p>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">ID do Grupo</label>
                <input 
                  type="text" 
                  className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm focus:border-[#2E7D32] outline-none font-mono"
                  placeholder="Ex:..."
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-[#2E7D32] text-white font-bold py-3 rounded-lg shadow mt-2">
                Entrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupCard: React.FC<{ group: Group; isMember: boolean }> = ({ group, isMember }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative cursor-pointer">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{group.members.length} membros • {group.isPublic ? 'Público' : 'Privado'}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        group.status === 'recruiting' ? 'bg-green-100 text-green-800' :
        group.status === 'drawn' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {group.status === 'recruiting' ? 'Aberto' : group.status === 'drawn' ? 'Sorteado' : 'Fim'}
      </span>
    </div>
    {!isMember && (
      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
        <span className="text-sm font-bold text-[#C62828]">
            {group.requiresApproval ? 'Pedir para Entrar →' : 'Entrar no Grupo →'}
        </span>
      </div>
    )}
  </div>
);

export default Dashboard;