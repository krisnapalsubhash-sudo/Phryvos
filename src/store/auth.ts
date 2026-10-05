import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { User } from '@/types';
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

// Extended User type with website
export interface ExtendedUser extends User {
  website?: string;
  cover?: string;
  email?: string;
  emailVerified?: string;
  role?: string;
  ageGroup?: string;
  onboardingCompleted?: boolean;
  demoMode?: boolean;
}

interface AuthState {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (username: string) => void;
  logout: () => void;
  reset: () => void;
  updateProfile: (updates: Partial<ExtendedUser>) => void;
  setHydrated: (hydrated: boolean) => void;

  // API-backed action
  updateProfileAPI: (updates: Partial<ExtendedUser>) => Promise<void>;
  fetchProfile: () => Promise<void>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      login: (_username: string) => {
        console.warn('Direct useAuthStore.login is deprecated. Use NextAuth signIn() for server-validated auth.');
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('phryvos-auth');
          } catch {}
        }
      },

      reset: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('phryvos-auth');
          } catch {}
        }
      },

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      // API-backed actions
      updateProfileAPI: async (updates) => {
        const epoch = getSessionEpoch();
        try {
          const data = await apiFetch<{ success: boolean; user: ExtendedUser }>('/api/me/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates),
          });

          // Drop stale response if session changed or logged out
          if (isStaleRequest(epoch)) return;

          if (data.success && data.user) {
            set({ user: data.user });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('updateProfileAPI error:', error);
          throw error;
        }
      },

      fetchProfile: async () => {
        const epoch = getSessionEpoch();
        try {
          const data = await apiFetch<{ success: boolean; user: ExtendedUser }>('/api/me/profile');

          // Drop stale response if session changed or logged out
          if (isStaleRequest(epoch)) return;

          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('fetchProfile error:', error);
        }
      },
    }),
    {
      name: 'phryvos-auth',
      storage: createJSONStorage(createServerSafeStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);