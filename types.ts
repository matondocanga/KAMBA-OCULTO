export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar: string;
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
  customSlug?: string; // Custom link part
  description?: string;
  adminId: string;
  isPublic: boolean;
  requiresApproval: boolean; // New: Require admin approval
  maxMembers: number;
  createdAt: number;
  status: 'recruiting' | 'drawn' | 'completed';
  members: string[]; // User IDs
  pendingMembers: string[]; // New: Users waiting for approval
  drawResult?: Record<string, string>; // Santa ID -> Receiver ID
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
