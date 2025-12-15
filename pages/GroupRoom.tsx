import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Group, Message, User, Product } from '../types';
import { RealBackend } from '../services/realBackend';
import { COLORS, MACRO_YETU, MOCK_PRODUCTS, GAME_DATA } from '../constants';

const GroupRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingMembers, setPendingMembers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'activities' | 'shop' | 'members' | 'settings'>('chat');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [myMatch, setMyMatch] = useState<User | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);

  // 1. Auth Check
  useEffect(() => {
      const unsub = RealBackend.onAuthStateChange(user => {
          if (!user) navigate('/');
          setCurrentUser(user);
      });
      return () => unsub();
  }, []);

  // 2. Real-time Subscriptions (Group, Messages)
  useEffect(() => {
    if (!id || !currentUser) return;

    // Listen to Group Details
    const unsubGroup = RealBackend.subscribeToGroup(id, async (g) => {
        if (!g) {
             navigate('/dashboard'); 
             return;
        }
        setGroup(g);
        
        // Fetch Members Data (One-time fetch on group update for simplicity, ideally listener too)
        const mems = await RealBackend.getUsersInGroup(g.members);
        setMembers(mems);
        
        if (g.pendingMembers.length > 0) {
            const pends = await RealBackend.getUsersInGroup(g.pendingMembers);
            setPendingMembers(pends);
        } else {
            setPendingMembers([]);
        }

        // Check Match
        if (g.status === 'drawn' && g.drawResult) {
            const matchId = g.drawResult[currentUser.id];
            if (matchId) {
                const match = await RealBackend.getUserById(matchId);
                setMyMatch(match || null);
            }
        }
    });

    // Listen to Messages
    const unsubMsgs = RealBackend.subscribeToMessages(id, (msgs) => {
        setMessages(msgs);
    });

    return () => {
        unsubGroup();
        unsubMsgs();
    };
  }, [id, currentUser]);

  useEffect(() => {
    if(activeTab === 'chat') scrollToBottom();
  }, [messages, activeTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !currentUser) return;
    await RealBackend.sendMessage(id, currentUser.id, currentUser.name, newMessage);
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && id && currentUser) {
      const file = e.target.files[0];
      // Note: Real file upload needs Firebase Storage. For now, sending dummy text.
      // await uploadToStorage(file)...
      await RealBackend.sendMessage(id, currentUser.id, currentUser.name, `[Ficheiro: ${file.name}] (Upload real requer bucket)`, 'file');
    }
  };

  const handleDraw = async () => {
    if (!group || !id) return;
    if (group.members.length < 4) {
      alert("Precisas de pelo menos 4 kambas para sortear!");
      return;
    }
    try {
      await RealBackend.runDraw(id);
    } catch (e) {
      alert("Erro ao sortear");
    }
  };

  const handleRevealClick = () => {
    if (myMatch) {
        setShowRevealModal(true);
    } else {
        alert("Ainda não tens um par atribuído.");
    }
  };

  const handleGameStart = (gameName: string) => {
      if (!id || !currentUser) return;
      const text = `📢 Começou um jogo de ${gameName}!`;
      RealBackend.sendMessage(id, 'admin', 'SISTEMA', text);
  };

  if (!group || !currentUser) return <div className="p-8 text-center">Carregando grupo...</div>;

  const isAdmin = group.adminId === currentUser.id;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:h-[calc(100vh-100px)]">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
          <p className="text-xs text-gray-500">{members.length} Membros • {group.status === 'recruiting' ? 'Aberto' : 'Sorteado'}</p>
        </div>
        <div className="flex gap-2">
           {isAdmin && group.status === 'recruiting' && (
             <button onClick={handleDraw} className="bg-[#D4AF37] text-white px-3 py-1 rounded-lg text-xs font-bold shadow animate-pulse">
               🎲 Sortear
             </button>
           )}
           {group.status === 'drawn' && (
             <button onClick={handleRevealClick} className="bg-[#2E7D32] text-white px-3 py-1 rounded-lg text-xs font-bold shadow">
               🕵️ Ver Par
             </button>
           )}
        </div>
      </div>

      {/* Scrollable Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-lg mb-4 overflow-x-auto">
        {[
          {id: 'chat', icon: '💬', label: 'Chat'},
          {id: 'activities', icon: '🎮', label: 'Atividades'},
          {id: 'shop', icon: '🛍️', label: 'Loja'},
          {id: 'members', icon: '👥', label: 'Membros'},
          {id: 'settings', icon: '⚙️', label: 'Config'}
        ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)} 
             className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-md transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow text-[#C62828]' : 'text-gray-500'}`}
           >
             {tab.icon} {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDFBF7]">
              {messages.map((msg) => {
                 const isMe = msg.senderId === currentUser.id;
                 const isSystem = msg.senderId === 'admin';
                 const isGameResult = msg.type === 'game_result';

                 if (isSystem) return <div key={msg.id} className="text-center bg-gray-100 rounded-lg p-2 text-xs text-gray-500 italic my-2 border border-gray-200 mx-10">{msg.text}</div>;
                 if (isGameResult) return <div key={msg.id} className="text-center bg-[#FFF8E1] border border-[#D4AF37] rounded-lg p-2 my-2 text-sm text-[#8a6d1c] font-bold whitespace-pre-wrap">{msg.text}</div>;
                 
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-[#C62828] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                       {!isMe && <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>}
                       {msg.text}
                     </div>
                   </div>
                 );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                📎
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escreve uma mambo..." 
                className="flex-1 bg-[#FFF8E1] border border-gray-200 text-gray-900 placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#C62828]"
              />
              <button type="submit" className="bg-[#C62828] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">➤</button>
            </form>
          </div>
        )}

        {activeTab === 'activities' && (
          <ActivitiesPanel 
            members={members} 
            onSendResult={(text) => RealBackend.sendMessage(id!, currentUser.id, currentUser.name, text, 'game_result')} 
            onStartGame={handleGameStart}
          />
        )}

        {activeTab === 'shop' && (
          <ShopPanel members={members} />
        )}

        {activeTab === 'members' && (
           <div className="p-4 overflow-y-auto h-full">
             
             {isAdmin && pendingMembers.length > 0 && (
                <div className="mb-6 border-b pb-4">
                    <h3 className="font-bold text-[#D4AF37] mb-2">Solicitações Pendentes ⏳</h3>
                    <div className="space-y-2">
                        {pendingMembers.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between bg-yellow-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <img src={pm.avatar} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-bold">{pm.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => RealBackend.approveMember(group.id, pm.id)}
                                      className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                                    >Aceitar</button>
                                    <button 
                                      onClick={() => RealBackend.rejectMember(group.id, pm.id)}
                                      className="bg-red-600 text-white text-xs px-2 py-1 rounded"
                                    >Rejeitar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <h3 className="font-bold text-gray-700 mb-4">Participantes ({members.length})</h3>
             
             {isAdmin && (
                <button 
                    onClick={() => RealBackend.addBotMember(group.id)}
                    className="w-full bg-gray-100 text-gray-600 text-sm font-bold py-2 rounded-lg mb-4 border border-dashed border-gray-300 hover:bg-gray-200"
                >
                    🤖 Adicionar Bot (Teste)
                </button>
             )}

             <div className="space-y-3">
               {members.map(m => (
                 <div key={m.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                   <img src={m.avatar} className="w-10 h-10 rounded-full border border-[#D4AF37]" alt=""/>
                   <div>
                     <p className="font-bold text-sm">{m.name}</p>
                     {group.adminId === m.id && <span className="text-[10px] bg-[#D4AF37] text-white px-2 py-0.5 rounded-full">Admin</span>}
                   </div>
                 </div>
               ))}
               <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                 <p className="text-xs text-gray-500 mb-2">ID do Grupo:</p>
                 <code className="block bg-gray-100 p-2 rounded font-mono text-sm break-all select-all">
                   {group.id}
                 </code>
               </div>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 overflow-y-auto h-full">
             <h3 className="font-bold text-gray-700 mb-4">Configurações do Grupo</h3>
             <div className="space-y-4">
               <div>
                  <label className="text-xs text-gray-500 block mb-1">Nome do Grupo</label>
                  <input disabled value={group.name} className="w-full bg-gray-100 border border-gray-200 rounded p-2 text-sm" />
               </div>
               
               {isAdmin ? (
                   <>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-bold text-gray-700">Grupo Público</span>
                        <input 
                            type="checkbox" 
                            checked={group.isPublic} 
                            onChange={(e) => RealBackend.updateGroupSettings(group.id, { isPublic: e.target.checked })}
                            className="w-5 h-5 text-[#C62828]"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-bold text-gray-700">Exigir Aprovação</span>
                        <input 
                            type="checkbox" 
                            checked={group.requiresApproval} 
                            onChange={(e) => RealBackend.updateGroupSettings(group.id, { requiresApproval: e.target.checked })}
                            className="w-5 h-5 text-[#C62828]"
                        />
                    </div>
                   </>
               ) : (
                   <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded">
                       Apenas o Admin pode alterar as configurações.
                   </div>
               )}
             </div>
          </div>
        )}
      </div>

      {showRevealModal && myMatch && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#C62828] bg-opacity-95 p-6 animate-fade-in">
             <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-[#D4AF37] relative">
                <button onClick={() => setShowRevealModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                <h2 className="text-2xl font-black text-[#C62828] mb-2">TEU KAMBA É...</h2>
                <div className="my-6">
                    <img src={myMatch.avatar} className="w-32 h-32 rounded-full border-4 border-[#2E7D32] mx-auto shadow-lg animate-bounce" />
                </div>
                <h3 className="text-3xl font-bold text-[#2E7D32] mb-2">{myMatch.name}</h3>
                <p className="text-gray-500 text-sm italic">"Shhh! Não contes a ninguém!" 🤫</p>
                <div className="mt-6">
                    <button onClick={() => { setShowRevealModal(false); setActiveTab('shop'); }} className="bg-[#D4AF37] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-yellow-600 w-full">
                        Comprar Presente Agora
                    </button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
};

// --- Activities & Games Components (Same UI, Logic separated) ---

const ActivitiesPanel: React.FC<{ 
    members: User[], 
    onSendResult: (text: string) => void, 
    onStartGame: (game: string) => void
}> = ({ members, onSendResult, onStartGame }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'LuckyCard') {
      return <LuckyCardGame onFinish={(res) => { onSendResult(res); setActiveGame(null); }} onCancel={() => setActiveGame(null)} />;
  }

  if (activeGame === 'Quiz') {
      return <QuizGame members={members} onFinish={(res) => { onSendResult(res); setActiveGame(null); }} onCancel={() => setActiveGame(null)} onStart={() => onStartGame('Quiz Angola')} />;
  }

  if (activeGame === 'Icebreaker') {
      return <TurnBasedCardGame 
        title="Quebra Gelo 🧊" 
        data={GAME_DATA.icebreaker} 
        members={members}
        bgColor="bg-blue-50"
        titleColor="text-blue-800"
        onFinish={(res) => { onSendResult(res); setActiveGame(null); }} 
        onCancel={() => setActiveGame(null)}
        onStart={() => onStartGame('Quebra Gelo')}
      />;
  }

  if (activeGame === 'Truth') {
      return <TurnBasedCardGame 
        title="Verdade ou Desafio 🤫" 
        data={GAME_DATA.truth} 
        members={members}
        bgColor="bg-purple-50"
        titleColor="text-purple-800"
        onFinish={(res) => { onSendResult(res); setActiveGame(null); }} 
        onCancel={() => setActiveGame(null)}
        onStart={() => onStartGame('Verdade ou Desafio')}
      />;
  }

  if (activeGame === 'Guess') {
      const guessData = members.map(m => `Quem é este kamba? Começa com a letra "${m.name.charAt(0)}"...`);
      return <TurnBasedCardGame 
        title="Adivinha o Kamba 🕵️" 
        data={guessData.length > 0 ? guessData : ["Adicione membros primeiro!"]}
        members={members}
        bgColor="bg-yellow-50"
        titleColor="text-yellow-800"
        onFinish={(res) => { onSendResult(res); setActiveGame(null); }} 
        onCancel={() => setActiveGame(null)}
        onStart={() => onStartGame('Adivinha o Kamba')}
      />;
  }

  return (
    <div className="p-4 overflow-y-auto h-full grid grid-cols-2 gap-3">
      <GameCard emoji="🧊" title="Quebra Gelo" color="bg-blue-50 text-blue-800" onClick={() => setActiveGame('Icebreaker')} />
      <GameCard emoji="🤫" title="Verdade/Desafio" color="bg-purple-50 text-purple-800" onClick={() => setActiveGame('Truth')} />
      <GameCard emoji="🇦🇴" title="Quiz Angola" color="bg-red-50 text-red-800" onClick={() => setActiveGame('Quiz')} />
      <GameCard emoji="🕵️" title="Adivinha o Kamba" color="bg-yellow-50 text-yellow-800" onClick={() => setActiveGame('Guess')} />
      <GameCard emoji="🍀" title="Mambo da Sorte" color="bg-green-50 text-green-800" onClick={() => setActiveGame('LuckyCard')} />
    </div>
  );
};

// Generic Turn-Based Card Game for Icebreaker, Truth, Guess
const TurnBasedCardGame = ({ members, title, data, bgColor, titleColor, onFinish, onCancel, onStart }: any) => {
    const [step, setStep] = useState<'lobby' | 'playing' | 'end'>('lobby');
    const [currentRound, setCurrentRound] = useState(0);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [currentPlayer, setCurrentPlayer] = useState<User | null>(null);
    const [currentCard, setCurrentCard] = useState('');
    const [playerAnswer, setPlayerAnswer] = useState('');

    const maxRounds = Math.min(members.length * 2, 10);

    useEffect(() => {
        const s: any = {};
        members.forEach((m: User) => s[m.id] = 0);
        setScores(s);
    }, [members]);

    const startRound = () => {
        const r = Math.floor(Math.random() * members.length);
        const c = Math.floor(Math.random() * data.length);
        setCurrentPlayer(members[r]);
        setCurrentCard(data[c]);
        setPlayerAnswer('');
    };

    const handleNext = (points: number) => {
        if (currentPlayer) {
            setScores(prev => ({...prev, [currentPlayer.id]: (prev[currentPlayer.id] || 0) + points}));
        }
        
        if (currentRound + 1 >= maxRounds) {
            setStep('end');
        } else {
            setCurrentRound(r => r + 1);
            startRound();
        }
    };

    if (members.length < 2) {
        return (
            <div className="p-6 text-center flex flex-col justify-center h-full">
                <p className="text-red-500 mb-4 font-bold">⚠️ Precisas de pelo menos mais um kamba online para jogar!</p>
                <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded font-bold">Voltar</button>
            </div>
        );
    }

    if (step === 'lobby') {
        return (
            <div className={`flex flex-col items-center justify-center h-full ${bgColor} p-6 text-center`}>
                <h3 className={`font-bold text-2xl ${titleColor} mb-2`}>{title}</h3>
                <p className="text-gray-600 mb-6">Modo Multiplayer (Turnos)</p>
                <div className="bg-white p-4 rounded-lg shadow-sm w-full mb-6">
                    <p className="font-bold text-sm mb-2">Jogadores ({members.length}):</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {members.map((m: User) => (
                            <img key={m.id} src={m.avatar} className="w-8 h-8 rounded-full border border-gray-300" title={m.name} />
                        ))}
                    </div>
                </div>
                <button onClick={() => { setStep('playing'); startRound(); onStart && onStart(); }} className={`bg-[#C62828] text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-pulse opacity-90 hover:opacity-100`}>
                    Começar Jogo
                </button>
                <button onClick={onCancel} className="mt-4 text-sm text-gray-500 underline">Cancelar</button>
            </div>
        );
    }

    if (step === 'playing' && currentPlayer) {
        return (
             <div className="flex flex-col h-full bg-white p-6 justify-between">
                <div className="text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Rodada {currentRound + 1}/{maxRounds}</span>
                    <div className="mt-4 mb-2">
                        <img src={currentPlayer.avatar} className="w-16 h-16 rounded-full mx-auto border-4 border-[#D4AF37] mb-2" />
                        <h4 className="text-lg font-bold text-gray-800">Vez de: {currentPlayer.name}</h4>
                    </div>
                </div>

                <div className={`${bgColor} p-6 rounded-2xl border-2 border-gray-100 shadow-inner min-h-[120px] flex items-center justify-center text-center`}>
                    <p className={`text-xl font-bold ${titleColor}`}>{currentCard}</p>
                </div>
                
                {/* Input Field for Answer - Local interaction only */}
                <div className="my-4">
                    <textarea 
                        value={playerAnswer}
                        onChange={(e) => setPlayerAnswer(e.target.value)}
                        placeholder="Escreve a tua resposta aqui..."
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#C62828] outline-none bg-gray-50"
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleNext(0)} className="bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200">
                        Pular ❌
                    </button>
                    <button onClick={() => handleNext(1)} className="bg-[#2E7D32] text-white font-bold py-3 rounded-xl shadow hover:bg-green-700">
                        Feito ✅
                    </button>
                </div>
             </div>
        );
    }

    if (step === 'end') {
        const sorted = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
        return (
            <div className={`flex flex-col h-full ${bgColor} p-6`}>
                <h3 className={`font-bold text-2xl ${titleColor} text-center mb-6`}>Resultado Final 🏆</h3>
                <div className="bg-white rounded-xl shadow-sm p-4 flex-1 overflow-y-auto space-y-3">
                    {sorted.map(([uid, score], idx) => {
                        const m = members.find((u:User) => u.id === uid);
                        if(!m) return null;
                        return (
                            <div key={uid} className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-400 w-4">{idx+1}</span>
                                    <img src={m.avatar} className="w-8 h-8 rounded-full" />
                                    <span className="font-bold text-gray-700">{m.name}</span>
                                </div>
                                <span className={`font-bold ${idx===0 ? 'text-[#D4AF37] text-xl' : 'text-gray-600'}`}>{score} pts</span>
                            </div>
                        )
                    })}
                </div>
                <button 
                    onClick={() => {
                        let text = `🏆 RESULTADO ${title.toUpperCase()}\n\n`;
                        sorted.forEach(([uid, s], i) => {
                            const m = members.find((u:User) => u.id === uid);
                            if(m) text += `${i+1}. ${m.name}: ${s} pts\n`;
                        });
                        onFinish(text);
                    }} 
                    className="mt-4 bg-[#C62828] text-white w-full py-3 rounded-xl font-bold shadow"
                >
                    Enviar para o Chat
                </button>
            </div>
        )
    }

    return null;
}

const LuckyCardGame: React.FC<{onFinish: (r: string) => void, onCancel: () => void}> = ({onFinish, onCancel}) => {
    const [selected, setSelected] = useState<number | null>(null);

    const handlePick = (i: number) => {
        if(selected !== null) return;
        setSelected(i);
        const prizes = ["Nada 😅", "Um Abraço 🤗", "Quem paga o jantar és tu! 💸"];
        const result = prizes[Math.floor(Math.random() * prizes.length)];
        
        setTimeout(() => {
            onFinish(`🍀 MAMBO DA SORTE:\nEu escolhi a carta ${i+1} e saiu: ${result}`);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-green-50 p-6">
            <h3 className="font-bold text-xl text-green-800 mb-6">Escolhe uma Carta!</h3>
            <div className="flex gap-4">
                {[0, 1, 2].map(i => (
                    <button 
                        key={i}
                        onClick={() => handlePick(i)}
                        className={`w-20 h-32 rounded-xl border-2 border-green-700 shadow-md transition-all transform ${selected === i ? 'bg-white -translate-y-4' : 'bg-green-600 hover:scale-105'}`}
                    >
                        <span className="text-3xl">{selected === i ? '🎁' : '❓'}</span>
                    </button>
                ))}
            </div>
            <button onClick={onCancel} className="mt-8 text-gray-500 text-sm">Cancelar</button>
        </div>
    );
};

const QuizGame: React.FC<{members: User[], onFinish: (r: string) => void, onCancel: () => void, onStart: () => void}> = ({members, onFinish, onCancel, onStart}) => {
    const [step, setStep] = useState<'lobby' | 'playing' | 'end'>('lobby');
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);

    const questions = [
        { q: "Capital de Angola?", opts: ["Luanda", "Benguela", "Huambo"], a: 0 },
        { q: "Moeda oficial?", opts: ["Euro", "Kwanza", "Dólar"], a: 1 },
        { q: "Prato típico?", opts: ["Pizza", "Sushi", "Funge"], a: 2 },
    ];

    if (members.length < 2) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 mb-4 font-bold">⚠️ Precisas de pelo menos mais um kamba online para jogar o Quiz!</p>
                <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded font-bold">Voltar</button>
            </div>
        );
    }

    if (step === 'lobby') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 p-6 text-center">
                <h3 className="font-bold text-2xl text-[#C62828] mb-2">Quiz Angola 🇦🇴</h3>
                <p className="text-gray-600 mb-6">Desafia os teus kambas!</p>
                <div className="bg-white p-4 rounded-lg shadow-sm w-full mb-6">
                    <p className="font-bold text-sm mb-2">Jogadores Prontos:</p>
                    <div className="flex justify-center gap-2">
                        {members.slice(0, 3).map(m => (
                            <img key={m.id} src={m.avatar} className="w-8 h-8 rounded-full" />
                        ))}
                        {members.length > 3 && <span className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-xs">+{members.length - 3}</span>}
                    </div>
                </div>
                <button onClick={() => { setStep('playing'); onStart && onStart(); }} className="bg-[#C62828] text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-pulse">
                    Começar Jogo
                </button>
                <button onClick={onCancel} className="mt-4 text-sm text-gray-400">Cancelar</button>
            </div>
        );
    }

    if (step === 'playing') {
        const q = questions[currentQ];
        return (
            <div className="flex flex-col h-full bg-white p-6">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-4">
                    <span>Questão {currentQ + 1}/{questions.length}</span>
                    <span>Pontos: {score}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">{q.q}</h3>
                <div className="space-y-3">
                    {q.opts.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                if (idx === q.a) setScore(s => s + 10);
                                if (currentQ + 1 < questions.length) setCurrentQ(c => c + 1);
                                else {
                                    const finalScore = idx === q.a ? score + 10 : score;
                                    onFinish(`🧠 QUIZ ANGOLA - RESULTADO:\nFiz ${finalScore} pontos em ${questions.length} perguntas! Quem consegue bater?`);
                                }
                            }}
                            className="w-full bg-gray-100 hover:bg-[#FFF8E1] hover:border-[#D4AF37] border border-transparent p-4 rounded-xl text-left font-bold text-gray-700 transition"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const GameCard = ({ emoji, title, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} p-4 rounded-xl flex flex-col items-center justify-center h-32 hover:opacity-90 transition shadow-sm`}>
    <span className="text-3xl mb-2">{emoji}</span>
    <span className="font-bold text-xs">{title}</span>
  </button>
);

const ShopPanel: React.FC<{ members: User[] }> = ({ members }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [notes, setNotes] = useState('');

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !recipientId) return;

    const recipient = members.find(m => m.id === recipientId);
    if (!recipient) return;

    // Strict WhatsApp Template
    const text = `Olá Macro Yetu! 👋
Quero encomendar um presente pelo App KAMBA OCULTO! 🎁

🛍 Produto: ${selectedProduct.name}
💰 Valor: ${selectedProduct.price} ${selectedProduct.currency}

👤 Para o Kamba: ${recipient.name}
🖼 Foto para Personalizar: ${recipient.avatar}

📝 Minhas Observações: ${notes || 'Isso mesmo'}

Aguardo confirmação do pagamento!`;

    const url = `https://wa.me/${MACRO_YETU.phones[0]}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSelectedProduct(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
       {/* Supplier Info */}
       <div className="bg-white border-l-4 border-[#D4AF37] shadow-sm p-3 mb-4 rounded-r-lg flex items-center gap-3">
         <div className="bg-[#FFF8E1] p-2 rounded-full border border-[#D4AF37]">🏢</div>
         <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Fornecedor Oficial</p>
            <p className="text-sm font-bold text-gray-800">{MACRO_YETU.name}</p>
            <p className="text-xs text-gray-500">{MACRO_YETU.address} • {MACRO_YETU.phones[0]}</p>
         </div>
       </div>

       <div className="bg-[#D4AF37] bg-opacity-10 border border-[#D4AF37] rounded-lg p-3 mb-4 text-xs text-[#8a6d1c]">
        🛒 Loja do Grupo - Escolhe um presente para um Kamba!
      </div>
      
      <div className="space-y-4">
        {MOCK_PRODUCTS.map(p => (
          <div key={p.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0">
            <img src={p.image} alt={p.name} className="w-20 h-20 object-cover rounded-lg bg-gray-200" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
              <p className="text-[#C62828] font-black text-sm">{p.price.toLocaleString()} Kz</p>
              <button 
                onClick={() => setSelectedProduct(p)}
                className="mt-2 bg-[#2E7D32] text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-green-700"
              >
                Ofertar no Grupo
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Selection */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-fade-in">
             <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400">✕</button>
             <h3 className="font-bold text-lg mb-4 text-[#C62828]">Ofertar: {selectedProduct.name}</h3>
             
             <form onSubmit={handleBuy} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-600 mb-1">Para quem é o presente?</label>
                 <select 
                   required
                   value={recipientId} 
                   onChange={e => setRecipientId(e.target.value)}
                   className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900"
                 >
                   <option value="">Selecione um Kamba...</option>
                   {members.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                   ))}
                 </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Observações</label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900"
                    rows={2}
                    placeholder="Ex: Embrulho vermelho..."
                  />
               </div>
               <button type="submit" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-lg shadow flex justify-center items-center gap-2">
                 <span>Continuar no WhatsApp</span> <span>💬</span>
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupRoom;