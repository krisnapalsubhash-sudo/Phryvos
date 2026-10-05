'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MessageSquare,
  Heart,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();

  const displayUser = user;

  return (
    <header className="desktop-only sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-4 py-3 h-16">
      <div className="flex items-center gap-4">
        <Link
          href="/feed"
          className="flex items-center gap-2 group"
          aria-label="Phryvos Home"
        >
          <img src="/brand/logo-icon-512.png" alt="Phryvos Logo" className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform" />
          <span className="phryvos-gradient-text text-xl font-bold tracking-tight">Phryvos</span>
        </Link>

        <div className="relative w-72 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/50 border-none focus:outline-none focus:ring-2 focus:ring-ring/50 text-sm placeholder:text-muted-foreground"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-accent transition-colors relative" aria-label="Direct Messages">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </button>

        <button className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Activity">
          <Heart className="w-5 h-5" />
        </button>

        <Link
          href="/profile/me"
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
          aria-label="Profile"
        >
          <span className="text-lg">{displayUser?.avatar || '👤'}</span>
        </Link>
      </div>
    </header>
  );
}