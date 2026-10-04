export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  cover?: string;
  interests: string[];
  location?: string;
  followers: number;
  following: number;
  postsCount: number;
  isConnected: boolean;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
}

export interface Profile extends User {
  isFollowing: boolean;
  connectionDate?: string;
}

export interface Connection {
  id: string;
  user: User;
  connectedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}
