'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, MessageSquare, Heart, Plus, Menu, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { CURRENT_USER } from '@/lib/mock';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SoundToggle } from '@/components/effects/SoundToggle';
import { sound } from '@/lib/sound';

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const displayUser = user || CURRENT_USER;
  const [searchOpen, setSearchOpen] = useState(false);
  const isSearchPage = pathname === '/search' || pathname.startsWith('/search');

  return (
    <header className="sticky top-0 z-40 h-16 glass-panel border-b border-border/80 flex items-center justify-between px-4 md:px-6 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            sound.playPop(380);
            toggleSidebar();
          }}
          className="md:hidden btn-icon"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Brand Logo for desktop/mobile */}
        <Link
          href="/feed"
          onClick={() => sound.playPop(480)}
          className="flex items-center gap-2.5 group"
          aria-label="Phryvos Home"
        >
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105 border border-white/10">
            <img src="/brand/logo-icon-512.png" alt="Phryvos" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent leading-none">
              Phryvos
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Social
            </span>
          </div>
        </Link>

        {/* Search input with shortcut badge - hidden on /search page */}
        {!isSearchPage && (
          <div className="hidden md:flex items-center relative ml-4 w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search creators, topics..."
              className="w-full pl-10 pr-12 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border/60 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none placeholder:text-muted-foreground"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground bg-background/80 border border-border/80 rounded px-1.5 py-0.5 pointer-events-none">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Post Button */}
        <Link href="/feed" className="hidden sm:inline-flex">
          <Button
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs px-3.5 shadow-sm hover:shadow-glow-sm transition-all gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </Button>
        </Link>

        {/* Sound FX Toggle Button */}
        <SoundToggle />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Activity / Notifications */}
        <Link
          href="/notifications"
          onClick={() => sound.playPop(520)}
          className="btn-icon relative"
          aria-label="Notifications"
        >
          <Heart className="w-4 h-4" />
          <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
        </Link>

        {/* Messages */}
        <Link
          href="/chat"
          onClick={() => sound.playPop(560)}
          className="btn-icon relative"
          aria-label="Direct Messages"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-background" />
        </Link>

        {/* User Profile */}
        <Link
          href="/profile/me"
          onClick={() => sound.playPop(440)}
          className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-border/80 hover:ring-primary/60 transition-all flex items-center justify-center bg-secondary text-foreground text-sm font-semibold ml-1"
          aria-label="My Profile"
        >
          {displayUser.avatar ? (
            <span>{displayUser.avatar}</span>
          ) : (
            <span className="text-xs font-bold">{displayUser.displayName?.charAt(0) || 'U'}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
