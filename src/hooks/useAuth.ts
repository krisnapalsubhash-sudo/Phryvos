'use client';

import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  return { user, isAuthenticated, login, logout };
}
