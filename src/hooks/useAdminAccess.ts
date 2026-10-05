import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function useAdminAccess() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;

        if (!adminId) {
          // If admin ID not configured, deny access for security
          setIsAdmin(false);
          setIsLoading(false);
          router.push('/404');
          return;
        }

        if (user && user.id === adminId) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/404');
        }
      } catch (error) {
        console.error('Admin access check error:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      checkAdminAccess();
    } else {
      // Wait for auth to initialize
      const checkAuth = setInterval(() => {
        if (user?.id) {
          clearInterval(checkAuth);
          checkAdminAccess();
        }
      }, 100);
    }
  }, [user, router]);

  return { isAdmin, isLoading };
}