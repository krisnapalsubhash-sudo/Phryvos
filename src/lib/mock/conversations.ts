import type { Conversation } from '@/types';
import { MOCK_USERS, CURRENT_USER } from './users';

const recentChats: Conversation[] = [
  {
    id: 'c1',
    participants: [CURRENT_USER, MOCK_USERS[0]],
    messages: [
      { id: 'm1', senderId: MOCK_USERS[0].id, receiverId: 'me', content: 'Hey! How was your day?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: true },
      { id: 'm2', senderId: 'me', receiverId: MOCK_USERS[0].id, content: 'Pretty good! Just finished a project at work. You?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), isRead: true },
      { id: 'm3', senderId: MOCK_USERS[0].id, receiverId: 'me', content: 'Same here! Want to play some Valorant later?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), isRead: true },
    ],
    unreadCount: 0,
    lastMessage: { id: 'm3', senderId: MOCK_USERS[0].id, receiverId: 'me', content: 'Want to play some Valorant later?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), isRead: true },
    isTyping: false,
  },
  {
    id: 'c2',
    participants: [CURRENT_USER, MOCK_USERS[3]],
    messages: [
      { id: 'm4', senderId: MOCK_USERS[3].id, receiverId: 'me', content: 'Thanks for the feedback on my artwork!', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isRead: true },
      { id: 'm5', senderId: 'me', receiverId: MOCK_USERS[3].id, content: 'Your shading technique is incredible!', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), isRead: true },
    ],
    unreadCount: 2,
    lastMessage: { id: 'm4', senderId: MOCK_USERS[3].id, receiverId: 'me', content: 'Thanks for the feedback on my artwork!', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isRead: true },
    isTyping: false,
  },
  {
    id: 'c3',
    participants: [CURRENT_USER, MOCK_USERS[5]],
    messages: [
      { id: 'm6', senderId: MOCK_USERS[5].id, receiverId: 'me', content: 'Did you see the new AI paper I shared?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), isRead: true },
      { id: 'm7', senderId: 'me', receiverId: MOCK_USERS[5].id, content: 'Yes! The transformers architecture is fascinating', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: true },
    ],
    unreadCount: 0,
    lastMessage: { id: 'm7', senderId: 'me', receiverId: MOCK_USERS[5].id, content: 'Yes! The transformers architecture is fascinating', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: true },
    isTyping: false,
  },
  {
    id: 'c4',
    participants: [CURRENT_USER, MOCK_USERS[7]],
    messages: [
      { id: 'm8', senderId: MOCK_USERS[7].id, receiverId: 'me', content: 'Have you tried that new Korean restaurant downtown?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), isRead: false },
    ],
    unreadCount: 1,
    lastMessage: { id: 'm8', senderId: MOCK_USERS[7].id, receiverId: 'me', content: 'Have you tried that new Korean restaurant downtown?', type: 'text', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), isRead: false },
    isTyping: false,
  },
];

export function getConversations(): Conversation[] {
  return recentChats;
}

export function getConversationById(id: string): Conversation | undefined {
  return recentChats.find((c) => c.id === id);
}
