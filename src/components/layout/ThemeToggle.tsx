'use client';

import { useTheme } from 'next-themes';
import { useThemeStore } from '@/store/theme';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'icon' | 'badge';
}

export function ThemeToggle({ className = '', variant = 'icon' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const { setTheme: setStoreTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setNextTheme(next);
    setStoreTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-border/50 bg-secondary/30 flex items-center justify-center opacity-70 ${className}`}
      >
        <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-secondary/50 hover:bg-secondary transition-all hover:scale-105 active:scale-95 text-foreground backdrop-blur-md ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="dark"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 text-amber-400"
            >
              <Moon className="w-3.5 h-3.5 fill-amber-400/20" />
              <span className="text-foreground">Dark</span>
            </motion.span>
          ) : (
            <motion.span
              key="light"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 text-amber-500"
            >
              <Sun className="w-3.5 h-3.5 fill-amber-500/20" />
              <span className="text-foreground">Light</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-9 h-9 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-foreground backdrop-blur-md ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -45, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 45, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-400"
          >
            <Moon className="w-4 h-4 fill-amber-400/20" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 45, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -45, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-500"
          >
            <Sun className="w-4 h-4 fill-amber-500/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
