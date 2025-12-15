import { User, Group, Message, Participant } from '../types';
import { ANGOLAN_GROUP_NAMES } from '../constants';

// Keys for LocalStorage
const USERS_KEY = 'kamba_users';
const GROUPS_KEY = 'kamba_groups';
const MESSAGES_KEY = 'kamba_messages';
const CURRENT_USER_KEY = 'kamba_current_user';
const QUEUE_KEY = 'kamba_public_queue';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const MockBackend = {
  // --- Auth ---
  login: async (email: string, name: string): Promise<User> => {
    await delay(500);
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        id: 'u_' + Date.now(),
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(CURRENT_USER_KEY);
    return u ? JSON.parse(u) : null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateProfile: async (userId: string, data: Partial<Participant>): Promise<User> => {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex((u: User) => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      const current = MockBackend.getCurrentUser();
      if(current && current.id === userId) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[idx]));
      }
      return users[idx];
    }
    throw new Error('User not found');
  },

  // --- Groups ---
  createGroup: async (adminId: string, isPublic: boolean, customName?: string, customSlug?: string): Promise<Group> => {
    await delay(600);
    const groups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    
    const name = customName || ANGOLAN_GROUP_NAMES[Math.floor(Math.random() * ANGOLAN_GROUP_NAMES.length)] + ` #${Math.floor(Math.random() * 100)}`;
    
    const newGroup: Group = {
      id: 'g_' + Date.now(),
      name,
      customSlug,
      adminId,
      isPublic,
      requiresApproval: false, // Default false
      maxMembers: 50,
      createdAt: Date.now(),
      status: 'recruiting',
      members: [adminId],
      pendingMembers: [],
      budget: '10.000 AOA',
    };
    
    groups.push(newGroup);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    return newGroup;
  },

  getGroups: async (): Promise<Group[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
  },

  getGroupById: async (groupId: string): Promise<Group | undefined> => {
    const groups = await MockBackend.getGroups();
    return groups.find(g => g.id === groupId);
  },

  // Updated Join Logic
  joinGroup: async (groupId: string, userId: string): Promise<{success: boolean, message: string}> => {
    await delay(400);
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    
    if (idx !== -1) {
      const group = groups[idx];
      
      // Check if already in
      if (group.members.includes(userId)) return { success: true, message: 'Já és membro.' };
      if (group.pendingMembers.includes(userId)) return { success: true, message: 'Aguardando aprovação.' };

      if (group.requiresApproval) {
        groups[idx].pendingMembers.push(userId);
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        return { success: true, message: 'Solicitação enviada! Aguarda o Admin aceitar.' };
      } else {
        groups[idx].members.push(userId);
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        return { success: true, message: 'Entraste no grupo!' };
      }
    }
    return { success: false, message: 'Grupo não encontrado.' };
  },

  addBotMember: async (groupId: string): Promise<void> => {
    await delay(200);
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    
    if (idx !== -1) {
       // Create Bot
       const botNames = ['Matondo', 'Nzinga', 'Kiluanji', 'Jandira', 'Tchizé', 'Cleyton'];
       const randomName = botNames[Math.floor(Math.random() * botNames.length)] + ` ${Math.floor(Math.random() * 100)}`;
       const botId = `bot_${Date.now()}`;
       
       const botUser: User = {
           id: botId,
           name: randomName,
           email: `${botId}@kamba.ao`,
           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`
       };

       // Save Bot to Users
       const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
       users.push(botUser);
       localStorage.setItem(USERS_KEY, JSON.stringify(users));

       // Add to Group
       groups[idx].members.push(botId);
       localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
       
       await MockBackend.sendMessage(groupId, 'admin', `🤖 ${randomName} entrou no grupo (Bot de Teste)`);
    }
  },

  updateGroupSettings: async (groupId: string, updates: Partial<Group>): Promise<void> => {
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    if(idx !== -1) {
        groups[idx] = { ...groups[idx], ...updates };
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    }
  },

  approveMember: async (groupId: string, userId: string): Promise<void> => {
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    if(idx !== -1) {
        // Remove from pending, add to members
        groups[idx].pendingMembers = groups[idx].pendingMembers.filter(id => id !== userId);
        if(!groups[idx].members.includes(userId)) {
             groups[idx].members.push(userId);
        }
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        await MockBackend.sendMessage(groupId, 'admin', `Novo kamba na área! Boas vindas!`);
    }
  },

  rejectMember: async (groupId: string, userId: string): Promise<void> => {
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    if(idx !== -1) {
        groups[idx].pendingMembers = groups[idx].pendingMembers.filter(id => id !== userId);
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    }
  },

  // --- Draw Logic ---
  runDraw: async (groupId: string): Promise<void> => {
    await delay(1000);
    const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const idx = groups.findIndex(g => g.id === groupId);
    
    if (idx === -1) throw new Error('Group not found');
    const group = groups[idx];
    
    const participants = [...group.members];
    // Fisher-Yates shuffle
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    const drawResult: Record<string, string> = {};
    for (let i = 0; i < participants.length; i++) {
      const santa = participants[i];
      const receiver = participants[(i + 1) % participants.length];
      drawResult[santa] = receiver;
    }

    groups[idx].drawResult = drawResult;
    groups[idx].status = 'drawn';
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    
    await MockBackend.sendMessage(groupId, 'admin', 'SISTEMA: O sorteio foi realizado! Vê quem te calhou 🤫');
  },

  // --- Chat ---
  getMessages: async (groupId: string): Promise<Message[]> => {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return allMessages.filter(m => m.groupId === groupId).sort((a, b) => a.timestamp - b.timestamp);
  },

  sendMessage: async (groupId: string, senderId: string, text: string, senderName: string = 'User', type: any = 'text', fileUrl?: string): Promise<Message> => {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    const newMessage: Message = {
      id: 'm_' + Date.now(),
      groupId,
      senderId,
      senderName,
      text,
      timestamp: Date.now(),
      type,
      fileUrl
    };
    allMessages.push(newMessage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
    return newMessage;
  },

  // --- Public Queue ---
  joinQueue: async (userId: string): Promise<string | null> => {
    await delay(500);
    const queue: string[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    
    if (!queue.includes(userId)) {
      queue.push(userId);
    }

    if (queue.length < 4) {
      const botsNeeded = 4 - queue.length;
      const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      
      for(let i=0; i<botsNeeded; i++) {
        const botId = `bot_${Date.now()}_${i}`;
        const botName = `Kamba Bot ${i+1}`;
        allUsers.push({
          id: botId,
          name: botName,
          email: `bot${i}@kamba.ao`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${botName}`
        });
        queue.push(botId);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
    }

    if (queue.length >= 4) {
      const members = queue.splice(0, 4);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); 
      
      const newGroup = await MockBackend.createGroup(members[0], true, `Kamba Auto #${Date.now().toString().slice(-4)}`);
      
      const groups: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
      const gIdx = groups.findIndex(g => g.id === newGroup.id);
      if(gIdx !== -1) {
        groups[gIdx].members = members;
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        await MockBackend.runDraw(newGroup.id);
        return newGroup.id;
      }
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
    return null;
  },

  getUsersInGroup: (userIds: string[]): User[] => {
     const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
     return users.filter(u => userIds.includes(u.id));
  }
};
