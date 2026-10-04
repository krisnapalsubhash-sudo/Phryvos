'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isHydrated, setHydrated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: 'bg-surface-elevated border-border text-text-primary shadow-lg rounded-xl px-4 py-3',
              description: 'text-text-secondary text-sm',
              actionButton: 'btn-secondary text-sm',
              cancelButton: 'text-text-tertiary hover:text-text-primary',
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}