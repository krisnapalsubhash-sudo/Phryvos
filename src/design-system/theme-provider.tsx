'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useThemeStore } from '@/store/theme';
import { colors } from './tokens';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = (theme === 'light' || theme === 'dark') ? theme : 'dark';
  const currentColors = colors[activeTheme] || colors.dark;
  const cssVars = Object.entries(currentColors)
    .map(([key, value]) => `--color-${key}: ${value};`)
    .join(' ');

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${cssVars} }`,
          }}
        />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: 'bg-card border border-border text-foreground shadow-xl rounded-2xl px-4 py-3 backdrop-blur-md',
              description: 'text-muted-foreground text-sm',
              actionButton: 'bg-primary text-primary-foreground text-sm rounded-lg px-3 py-1 font-medium',
              cancelButton: 'text-muted-foreground hover:text-foreground',
            },
          }}
        />
      </NextThemesProvider>
    </SessionProvider>
  );
}