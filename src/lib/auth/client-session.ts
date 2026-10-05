'use client';

import { useAuthStore } from '@/store/auth';
import { usePostsStore } from '@/store/posts';
import { useConnectionsStore } from '@/store/connections';
import { useStoriesStore } from '@/store/stories';
import { useRealtimeStore } from '@/store/realtime';
import { useUIStore } from '@/store/ui';
import { useFeaturesStore } from '@/store/features';

import { getSessionEpoch, incrementSessionEpoch, isStaleRequest } from './session-epoch';

export { getSessionEpoch, isStaleRequest };

/**
 * Authoritative list of user-scoped persistence keys in localStorage.
 * NOTE: Global application preferences ('phryvos-theme', 'phryvos-sound-enabled')
 * are intentionally excluded to protect user device preferences across sessions.
 */
export const USER_SCOPED_STORAGE_KEYS = [
  'phryvos-auth',
  'phryvos-posts',
  'phryvos-connections',
] as const;

/**
 * Completely purges all user-scoped client state from memory (Zustand) and storage (localStorage).
 * Increments session epoch so any in-flight asynchronous requests are safely discarded.
 */
export function clearUserScopedClientState() {
  // 1. Advance session epoch to invalidate in-flight async responses
  incrementSessionEpoch();

  // 2. Reset all user-scoped Zustand in-memory stores to pristine initial states first
  try {
    useAuthStore.getState().reset();
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting authStore:', e);
  }

  try {
    usePostsStore.getState().reset();
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting postsStore:', e);
  }

  try {
    useConnectionsStore.getState().reset();
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting connectionsStore:', e);
  }

  try {
    useStoriesStore.getState().reset();
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting storiesStore:', e);
  }

  try {
    useRealtimeStore.getState().disconnect();
  } catch (e) {
    console.warn('[SessionBoundary] Error disconnecting realtimeStore:', e);
  }

  try {
    useUIStore.getState().setSelectedChat(null);
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting uiStore selectedChat:', e);
  }

  try {
    useFeaturesStore.getState().resetSurvey();
  } catch (e) {
    console.warn('[SessionBoundary] Error resetting featuresStore survey:', e);
  }

  // 3. Purge persisted storage AFTER store resets so persist middleware does not write default state back to storage
  if (typeof window !== 'undefined') {
    try {
      useAuthStore.persist?.clearStorage?.();
    } catch {}
    try {
      usePostsStore.persist?.clearStorage?.();
    } catch {}
    try {
      useConnectionsStore.persist?.clearStorage?.();
    } catch {}

    try {
      for (const key of USER_SCOPED_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[SessionBoundary] Failed to clear user-scoped storage:', e);
    }
  }
}

/**
 * Validates cross-account boundary and synchronizes client stores with authoritative Auth.js session.
 * If any store holds data belonging to a previous user ID, a full purge is triggered immediately.
 */
export function validateAndSyncSession(sessionUser: {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const currentStoreUser = useAuthStore.getState().user;
  const postsOwner = usePostsStore.getState().ownerUserId;
  const connectionsOwner = useConnectionsStore.getState().ownerUserId;

  // Cross-account boundary check: if any store contains data from a different user ID, purge immediately!
  const hasMismatch =
    (currentStoreUser?.id && currentStoreUser.id !== sessionUser.id) ||
    (postsOwner && postsOwner !== sessionUser.id) ||
    (connectionsOwner && connectionsOwner !== sessionUser.id);

  if (hasMismatch) {
    clearUserScopedClientState();
  }

  // Bind store ownership to current session user
  usePostsStore.getState().setOwnerUserId(sessionUser.id);
  useConnectionsStore.getState().setOwnerUserId(sessionUser.id);

  // Sync canonical identity into useAuthStore if needed
  const existingUser = useAuthStore.getState().user;
  if (!existingUser || existingUser.id !== sessionUser.id) {
    useAuthStore.setState({
      user: {
        id: sessionUser.id,
        username: sessionUser.username,
        displayName: sessionUser.name || sessionUser.username || 'User',
        email: sessionUser.email || undefined,
        avatar: sessionUser.image || '😊',
        bio: '',
        interests: [],
        location: '',
        followers: 0,
        following: 0,
        postsCount: 0,
        isConnected: false,
        isOnline: true,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
    });
  }
}
