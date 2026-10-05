'use client';

import { useSession, signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const { data: session, status } = useSession();
  const { user: storeUser, updateProfile } = useAuthStore();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';

  // Canonical user derived from real server session + store profile extensions
  const user = session?.user
    ? {
        id: session.user.id || (session.user as any).sub || '',
        username: session.user.username || '',
        displayName: session.user.name || session.user.username || 'User',
        email: session.user.email || undefined,
        avatar: session.user.image || storeUser?.avatar || '😊',
        bio: storeUser?.bio || '',
        interests: storeUser?.interests || [],
        location: storeUser?.location || '',
        followers: storeUser?.followers || 0,
        following: storeUser?.following || 0,
        postsCount: storeUser?.postsCount || 0,
        isConnected: false,
        isOnline: true,
        createdAt: storeUser?.createdAt || new Date().toISOString(),
      }
    : null;

  return {
    user,
    isAuthenticated,
    isLoading,
    logout: () => signOut({ callbackUrl: '/login' }),
    updateProfile,
  };
}

