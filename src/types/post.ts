import type { User } from './user';

export type PostFormat = 'raw' | 'voice' | 'midnight' | 'standard';

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  // Enhanced feed features
  format?: PostFormat;
  audioDuration?: number; // e.g. 24 for 24s
  voiceWaveform?: number[]; // [20, 60, 40, 90...]
  midnightGradient?: string; // CSS gradient class or style
  isAnonymous?: boolean;
  readingTime?: string; // e.g. '2 min read'
  vibe?: string; // e.g. 'Midnight Confession', 'Travel Memoir', 'Deep Question'
  tags?: string[];
}

export interface StorySlide {
  id: string;
  type: 'image' | 'voice' | 'midnight';
  mediaUrl?: string;
  audioDuration?: number;
  content?: string;
  caption?: string;
  tag?: string;
  gradient?: string;
}

export interface Story {
  id: string;
  author: User;
  images: string[];
  views: number;
  hasSeen: boolean;
  createdAt: string;
  expiresAt: string;
  // Enhanced story hub features
  isVoiceStory?: boolean;
  isMidnightDrop?: boolean;
  slides?: StorySlide[];
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

