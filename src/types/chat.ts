import type { User } from './user';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'emoji';
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  isTyping?: boolean;
}

export interface Match {
  id: string;
  users: [User, User];
  matchedAt: string;
  status: 'pending' | 'matched' | 'ended';
}

export interface MessageRequest {
  id: string;
  sender: User;
  initialMessage: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  respondedAt?: string;
}

export interface Notification {
  id: string;
  actor?: User;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}
