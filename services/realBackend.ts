import { 
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, 
  onSnapshot, query, where, orderBy, arrayUnion, arrayRemove, limit 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateAuthProfile
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { User, Group, Message, Participant } from "../types";
import { ANGOLAN_GROUP_NAMES } from "../constants";

// Helper to convert Firestore doc to our types
const convertDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

export const RealBackend = {
  // --- Auth ---
  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    // Forçar seleção de conta para evitar loops de auto-login
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const userRef = doc(db, "users", fbUser.uid);
    const userSnap = await getDoc(userRef);

    let userData: User;

    if (userSnap.exists()) {
      userData = userSnap.data() as User;
    } else {
      userData = {
        id: fbUser.uid,
        name: fbUser.displayName || "Kamba Novo",
        email: fbUser.email || "",
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
      };
      await setDoc(userRef, userData);
    }
    return userData;
  },

  // REGISTO ATUALIZADO: Recebe dados completos
  registerWithEmail: async (
      name: string, 
      email: string, 
      pass: string, 
      extraData: { phone: string, address: string, clothingSize: any }
  ): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = result.user;

    await updateAuthProfile(fbUser, { displayName: name });

    const userData: Participant = {
      id: fbUser.uid,
      name: name,
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
      phone: extraData.phone,
      address: extraData.address,
      clothingSize: extraData.clothingSize
    };

    await setDoc(doc(db, "users", fbUser.uid), userData);
    return userData;
  },

  loginWithEmail: async (email: string, pass: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, pass);
  },

  logout: async () => {
    await signOut(auth);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            callback({ id: fbUser.uid, ...snap.data() } as User);
        } else {
            callback({ 
                id: fbUser.uid, 
                name: fbUser.displayName || "", 
                email: fbUser.email || "", 
                avatar: fbUser.photoURL || "" 
            });
        }
      } else {
        callback(null);
      }
    });
  },

  updateProfile: async (userId: string, data: Partial<Participant>): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  },

  getUserById: async (userId: string): Promise<User | null> => {
      const snap = await getDoc(doc(db, "users", userId));
      return snap.exists() ? convertDoc<User>(snap) : null;
  },

  getUsersInGroup: async (userIds: string[]): Promise<User[]> => {
    if (userIds.length === 0) return [];
    const promises = userIds.map(id => getDoc(doc(db, "users", id)));
    const docs = await Promise.all(promises);
    return docs.filter(d => d.exists()).map(d => convertDoc<User>(d));
  },

  // --- Groups ---
  createGroup: async (adminId: string, isPublic: boolean, customName?: string, customSlug?: string): Promise<Group> => {
    const name = customName || ANGOLAN_GROUP_NAMES[Math.floor(Math.random() * ANGOLAN_GROUP_NAMES.length)] + ` #${Math.floor(Math.random() * 100)}`;
    
    const newGroupData: Omit<Group, 'id'> = {
      name,
      groupImage: `https://picsum.photos/seed/${name}/200`, // Placeholder default
      customSlug: customSlug || "",
      adminId,
      isPublic,
      requiresApproval: false,
      maxMembers: 50,
      createdAt: Date.now(),
      status: 'recruiting',
      members: [adminId],
      pendingMembers: [],
      budget: '10.000 AOA',
    };

    const docRef = await addDoc(collection(db, "groups"), newGroupData);
    return { id: docRef.id, ...newGroupData };
  },

  getMyGroups: (userId: string, callback: (groups: Group[]) => void) => {
    const q = query(collection(db, "groups"), where("members", "array-contains", userId));
    return onSnapshot(q, (snap) => {
      const groups = snap.docs.map(d => convertDoc<Group>(d));
      callback(groups);
    });
  },

  getPublicGroups: (callback: (groups: Group[]) => void) => {
    const q = query(collection(db, "groups"), where("isPublic", "==", true), limit(20));
    return onSnapshot(q, (snap) => {
      const groups = snap.docs.map(d => convertDoc<Group>(d));
      callback(groups);
    });
  },

  getGroupById: async (groupId: string): Promise<Group | undefined> => {
    const snap = await getDoc(doc(db, "groups", groupId));
    return snap.exists() ? convertDoc<Group>(snap) : undefined;
  },
  
  subscribeToGroup: (groupId: string, callback: (group: Group | null) => void) => {
    return onSnapshot(doc(db, "groups", groupId), (snap) => {
        if (snap.exists()) callback(convertDoc<Group>(snap));
        else callback(null);
    });
  },

  joinGroup: async (groupId: string, userId: string): Promise<{success: boolean, message: string}> => {
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) return { success: false, message: 'Grupo não encontrado.' };
    const group = groupSnap.data() as Group;

    if (group.members.includes(userId)) return { success: true, message: 'Já és membro.' };
    if (group.pendingMembers.includes(userId)) return { success: true, message: 'Aguardando aprovação.' };

    if (group.requiresApproval) {
      await updateDoc(groupRef, { pendingMembers: arrayUnion(userId) });
      return { success: true, message: 'Solicitação enviada! Aguarda o Admin aceitar.' };
    } else {
      await updateDoc(groupRef, { members: arrayUnion(userId) });
      await RealBackend.sendMessage(groupId, "system", "admin", `Novo kamba entrou no grupo!`);
      return { success: true, message: 'Entraste no grupo!' };
    }
  },

  // NOVA FUNÇÃO: Adicionar por Email (Apenas Admin)
  addMemberByEmail: async (groupId: string, email: string): Promise<{status: 'added' | 'invited_email' | 'error', userName?: string}> => {
      try {
        // 1. Procurar user pelo email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // User existe -> Adicionar direto (bypass approval)
            const userDoc = snapshot.docs[0];
            const userId = userDoc.id;
            const userName = userDoc.data().name;

            const groupRef = doc(db, "groups", groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(userId),
                pendingMembers: arrayRemove(userId) // Remove se já estava pendente
            });
            
            await RealBackend.sendMessage(groupId, "system", "admin", `${userName} foi adicionado pelo Admin!`);
            return { status: 'added', userName };
        } else {
            // User não existe -> Retorna status para abrir cliente de email
            return { status: 'invited_email' };
        }
      } catch (e) {
          console.error(e);
          return { status: 'error' };
      }
  },

  approveMember: async (groupId: string, userId: string) => {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
        pendingMembers: arrayRemove(userId),
        members: arrayUnion(userId)
    });
    await RealBackend.sendMessage(groupId, "system", "admin", `Novo kamba aprovado!`);
  },

  rejectMember: async (groupId: string, userId: string) => {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, { pendingMembers: arrayRemove(userId) });
  },

  updateGroupSettings: async (groupId: string, updates: Partial<Group>) => {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, updates);
  },

  runDraw: async (groupId: string) => {
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');
    const group = groupSnap.data() as Group;

    const participants = [...group.members];
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

    await updateDoc(groupRef, {
        drawResult,
        status: 'drawn'
    });

    await RealBackend.sendMessage(groupId, "admin", "SISTEMA", 'O sorteio foi realizado! Vê quem te calhou 🤫');
  },

  subscribeToMessages: (groupId: string, callback: (msgs: Message[]) => void) => {
    const msgsRef = collection(db, "groups", groupId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => convertDoc<Message>(d));
        callback(msgs);
    });
  },

  sendMessage: async (groupId: string, senderId: string, senderName: string, text: string, type: any = 'text', fileUrl?: string) => {
    const msgsRef = collection(db, "groups", groupId, "messages");
    const newMessage: Omit<Message, 'id'> = {
        groupId,
        senderId,
        senderName,
        text,
        timestamp: Date.now(),
        type,
        fileUrl: fileUrl || ""
    };
    await addDoc(msgsRef, newMessage);
  },

  joinQueue: async (userId: string): Promise<string | null> => {
    const queueRef = doc(db, "system", "public_queue");
    const queueSnap = await getDoc(queueRef);
    
    let queue: string[] = [];
    if (queueSnap.exists()) {
        queue = queueSnap.data().users || [];
    }

    if (!queue.includes(userId)) {
        queue.push(userId);
    }

    if (queue.length >= 4) {
        const members = queue.splice(0, 4);
        const group = await RealBackend.createGroup(members[0], true, `Kamba Auto #${Date.now().toString().slice(-4)}`);
        
        for (let i = 1; i < members.length; i++) {
            await updateDoc(doc(db, "groups", group.id), { members: arrayUnion(members[i]) });
        }
        
        await RealBackend.runDraw(group.id);
        await setDoc(queueRef, { users: queue });
        return group.id;
    } else {
        await setDoc(queueRef, { users: queue });
        return null;
    }
  },
  
  addBotMember: async (groupId: string) => {
       const botNames = ['Matondo', 'Nzinga', 'Kiluanji', 'Jandira', 'Tchizé', 'Cleyton'];
       const randomName = botNames[Math.floor(Math.random() * botNames.length)] + ` Bot`;
       const botId = `bot_${Date.now()}`;
       
       const userRef = doc(db, "users", botId);
       await setDoc(userRef, {
           id: botId,
           name: randomName,
           email: "bot@kamba.ao",
           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`
       });

       const groupRef = doc(db, "groups", groupId);
       await updateDoc(groupRef, { members: arrayUnion(botId) });
       await RealBackend.sendMessage(groupId, "admin", "SISTEMA", `🤖 ${randomName} entrou (Bot)`);
  }
};