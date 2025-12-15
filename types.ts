export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar: string; // URL ou Base64
}

export interface Participant extends User {
  clothingSize?: {
    shirt: string;
    pants: string;
    shoes: string;
  };
  giftPreferences?: string;
  dislikes?: string;
  customMessage?: string;
}

export interface Group {
  id: string;
  name: string;
  groupImage?: string; // Nova Imagem do Grupo
  customSlug?: string;
  description?: string;
  adminId: string;
  isPublic: boolean;
  requiresApproval: boolean;
  maxMembers: number;
  createdAt: number;
  status: 'recruiting' | 'drawn' | 'completed';
  members: string[]; 
  pendingMembers: string[];
  drawResult?: Record<string, string>; 
  budget?: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'text' | 'system' | 'image' | 'file' | 'game_result';
  fileUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  category: string;
}

export enum GameType {
  Icebreaker = 'Icebreaker',
  TruthOrDare = 'TruthOrDare',
  AngolaQuiz = 'AngolaQuiz',
  GuessWho = 'GuessWho',
  LuckyCard = 'LuckyCard'
}