import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { Connection, User } from '@/types';
import { getSessionEpoch, isStaleRequest } from '@/lib/auth/session-epoch';

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

interface ConnectionsState {
  ownerUserId: string | null;
  connections: Connection[];
  pendingRequests: User[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Local mutations
  setOwnerUserId: (userId: string | null) => void;
  reset: () => void;
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
      ownerUserId: null,
      connections: [],
      pendingRequests: [],
      loading: false,
      error: null,
      initialized: false,

      setOwnerUserId: (userId) => set({ ownerUserId: userId }),

      reset: () =>
        set({
          ownerUserId: null,
          connections: [],
          pendingRequests: [],
          loading: false,
          error: null,
          initialized: false,
        }),

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
        const epoch = getSessionEpoch();
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean; connections: Connection[] }>('/api/connections');

          if (isStaleRequest(epoch)) return;

          if (data.success && data.connections) {
            set({ connections: data.connections, loading: false, initialized: true });
          } else {
            set({ loading: false, error: 'Failed to fetch connections' });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('fetchConnections error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch connections' });
        }
      },

      followUser: async (targetUserId: string) => {
        const epoch = getSessionEpoch();
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean }>('/api/connections', {
            method: 'POST',
            body: JSON.stringify({ targetUserId }),
          });

          if (isStaleRequest(epoch)) return;

          if (data.success) {
            set({ loading: false });
          } else {
            set({ loading: false, error: 'Failed to follow user' });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('followUser error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to follow user' });
        }
      },

      unfollowUser: async (targetUserId: string) => {
        const epoch = getSessionEpoch();
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean }>(`/api/connections/${targetUserId}`, {
            method: 'DELETE',
          });

          if (isStaleRequest(epoch)) return;

          if (data.success) {
            // Local remove
            get().removeConnection(targetUserId);
            set({ loading: false });
          } else {
            set({ loading: false, error: 'Failed to unfollow user' });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('unfollowUser error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to unfollow user' });
        }
      },
    }),
    {
      name: 'phryvos-connections',
      storage: createJSONStorage(createServerSafeStorage),
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        connections: state.connections,
        pendingRequests: state.pendingRequests,
      }),
    }
  )
);
