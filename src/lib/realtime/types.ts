export type RealtimeEventType =
  | 'presence_sync'
  | 'queue_joined'
  | 'match_found'
  | 'chat_message'
  | 'typing'
  | 'stranger_left'
  | 'connection_request'
  | 'connection_accepted';

export interface MatchPreferences {
  interests: string[];
  languages: string[];
  ageGroupPref: 'SAME' | 'ANY' | 'OLDER' | 'YOUNGER';
  minAge?: number;
  maxAge?: number;
  gameTags: string[];
  hobbyTags: string[];
  topicTags: string[];
  locationSharing: 'NONE' | 'COUNTRY' | 'REGION' | 'CITY';
  country?: string;
  region?: string;
  city?: string;
  enableInterestMatch: boolean;
  minInterestOverlap: number;
  allowSkipRematch: boolean;
}

export interface RealtimeUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  location?: string;
  interests?: string[];
  vibe?: string;
  ageGroup?: string;
  birthDate?: string;
  matchPreferences?: MatchPreferences;
  locationDisplay?: string;
  languages?: string[];
  gameTags?: string[];
  hobbyTags?: string[];
  topicTags?: string[];
}

export interface RealtimeMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type?: 'text' | 'image' | 'voice';
  timestamp: string;
  status?: 'sending' | 'delivered' | 'failed';
}

export interface RealtimeRoom {
  id: string;
  participants: [RealtimeUser, RealtimeUser];
  createdAt: string;
  messages: RealtimeMessage[];
}

export interface RealtimeActionPayload {
  action:
    | 'join_queue'
    | 'leave_queue'
    | 'send_message'
    | 'typing'
    | 'skip_room'
    | 'send_friend_request'
    | 'accept_friend_request'
    | 'block_user'
    | 'report_user';
  userId: string;
  targetUserId?: string;
  roomId?: string;
  userMeta?: RealtimeUser;
  text?: string;
  type?: 'text' | 'image' | 'voice';
  isTyping?: boolean;
  reason?: string;
}
