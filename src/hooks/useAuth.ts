'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/auth';
import { clearUserScopedClientState, validateAndSyncSession } from '@/lib/auth/client-session';

export function useAuth() {
  const { data: session, status } = useSession();
  const { user: storeUser, updateProfile } = useAuthStore();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';

  // Session-bound synchronization: if session changes or unauthenticated, maintain strict state boundary
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      validateAndSyncSession(session.user);
    } else if (status === 'unauthenticated') {
      if (useAuthStore.getState().user) {
        clearUserScopedClientState();
      }
    }
  }, [session, status]);

  // Ownership guard: only merge storeUser profile extensions if storeUser belongs to current session user
  const isStoreUserValid = !!storeUser?.id && storeUser.id === session?.user?.id;

  // Canonical user derived from real server session + validated store profile extensions
  const user = session?.user
    ? {
        id: session.user.id || (session.user as any).sub || '',
        username: session.user.username || '',
        displayName: session.user.name || session.user.username || 'User',
        email: session.user.email || undefined,
        avatar: session.user.image || (isStoreUserValid ? storeUser?.avatar : undefined) || '😊',
        bio: (isStoreUserValid ? storeUser?.bio : '') || '',
        interests: (isStoreUserValid ? storeUser?.interests : []) || [],
        location: (isStoreUserValid ? storeUser?.location : '') || '',
        followers: (isStoreUserValid ? storeUser?.followers : 0) || 0,
        following: (isStoreUserValid ? storeUser?.following : 0) || 0,
        postsCount: (isStoreUserValid ? storeUser?.postsCount : 0) || 0,
        isConnected: false,
        isOnline: true,
        createdAt: (isStoreUserValid ? storeUser?.createdAt : undefined) || new Date().toISOString(),
      }
    : null;

  const logout = async () => {
    clearUserScopedClientState();
    await signOut({ callbackUrl: '/login' });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    updateProfile,
  };
}

