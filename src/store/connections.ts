import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { Connection, User } from '@/types';
import { MOCK_USERS } from '@/lib/mock/users';

const createServerSafeStorage = (): StateStorage => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
});

// Seed initial connections from mock users so the user has familiar connections
const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: 'conn-1',
    user: MOCK_USERS[0],
    connectedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastMessage: 'Want to play some Valorant later?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'conn-2',
    user: MOCK_USERS[3],
    connectedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastMessage: 'Thanks for the feedback on my artwork!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'conn-3',
    user: MOCK_USERS[5],
    connectedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    lastMessage: 'Yes! The transformers architecture is fascinating',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

interface ConnectionsState {
  connections: Connection[];
  pendingRequests: User[];
  loading: boolean;
  error: string | null;

  // Local mutations
  addConnection: (user: Partial<User> & { id: string; username: string; displayName: string }) => void;
  removeConnection: (userId: string) => void;
  isConnection: (userId: string) => boolean;
  addPendingRequest: (user: User) => void;
  removePendingRequest: (userId: string) => void;

  // API-backed actions
  fetchConnections: () => Promise<void>;
  followUser: (targetUserId: string) => Promise<void>;
  unfollowUser: (targetUserId: string) => Promise<void>;
}

const API_BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const useConnectionsStore = create<ConnectionsState>()(
  persist(
    (set, get) => ({
      connections: INITIAL_CONNECTIONS,
      pendingRequests: [],
      loading: false,
      error: null,

      addConnection: (userMeta) => {
        const { connections } = get();
        if (connections.some((c) => c.user.id === userMeta.id)) return;

        const fullUser: User = {
          id: userMeta.id,
          username: userMeta.username,
          displayName: userMeta.displayName,
          bio: userMeta.bio || 'Met via Phryvos Serendipitous Radar ✨',
          avatar: userMeta.avatar || '✨',
          interests: userMeta.interests || ['Radar Match', 'Conversations'],
          location: userMeta.location || 'Orbit',
          followers: userMeta.followers ?? 142,
          following: userMeta.following ?? 88,
          postsCount: userMeta.postsCount ?? 12,
          isConnected: true,
          isOnline: true,
          createdAt: new Date().toISOString(),
        };

        const newConn: Connection = {
          id: `conn-${Date.now()}`,
          user: fullUser,
          connectedAt: new Date().toISOString(),
          lastMessage: 'Revealed mutual connection!',
          lastMessageAt: new Date().toISOString(),
        };

        set({
          connections: [newConn, ...connections],
          pendingRequests: get().pendingRequests.filter((p) => p.id !== userMeta.id),
        });
      },

      removeConnection: (userId) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.user.id !== userId),
        }));
      },

      isConnection: (userId) => {
        return get().connections.some((c) => c.user.id === userId);
      },

      addPendingRequest: (user) => {
        const { pendingRequests } = get();
        if (pendingRequests.some((p) => p.id === user.id)) return;
        set({ pendingRequests: [...pendingRequests, user] });
      },

      removePendingRequest: (userId) => {
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((p) => p.id !== userId),
        }));
      },

      // API-backed actions
      fetchConnections: async () => {
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean; connections: Connection[] }>('/api/connections');

          if (data.success && data.connections) {
            set({ connections: data.connections, loading: false });
          } else {
            set({ loading: false, error: 'Failed to fetch connections' });
          }
        } catch (error) {
          console.error('fetchConnections error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch connections' });
        }
      },

      followUser: async (targetUserId: string) => {
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean }>('/api/connections', {
            method: 'POST',
            body: JSON.stringify({ targetUserId }),
          });

          if (data.success) {
            set({ loading: false });
          } else {
            set({ loading: false, error: 'Failed to follow user' });
          }
        } catch (error) {
          console.error('followUser error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to follow user' });
        }
      },

      unfollowUser: async (targetUserId: string) => {
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean }>(`/api/connections/${targetUserId}`, {
            method: 'DELETE',
          });

          if (data.success) {
            // Local remove
            get().removeConnection(targetUserId);
            set({ loading: false });
          } else {
            set({ loading: false, error: 'Failed to unfollow user' });
          }
        } catch (error) {
          console.error('unfollowUser error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to unfollow user' });
        }
      },
    }),
    {
      name: 'phryvos-connections',
      storage: createJSONStorage(createServerSafeStorage),
      partialize: (state) => ({
        connections: state.connections,
        pendingRequests: state.pendingRequests,
      }),
    }
  )
);
