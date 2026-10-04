'use client';

import Link from 'next/link';
import { UserPlus, MapPin, TrendingUp, Sparkles, Compass } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { MOCK_USERS } from '@/lib/mock';
import { CURRENT_USER } from '@/lib/mock';
import type { User } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const TRENDING_TAGS = [
  { tag: 'designsystems', posts: '14.2k' },
  { tag: 'generativeAI', posts: '38.5k' },
  { tag: 'remoteWork', posts: '9.8k' },
  { tag: 'indieHackers', posts: '22.1k' },
];

function ActiveNowItem({ user }: { user: User }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2 px-2.5 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer group"
    >
      <div className="relative shrink-0">
        <Avatar size="sm" fallback={user.avatar} className="ring-2 ring-border/50" />
        {user.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
          {user.displayName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          {user.location || 'Exploring'}
        </p>
      </div>
      <Link href={`/chat`}>
        <Button
          variant="outline"
          size="xs"
          className="shrink-0 text-[11px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border-border hover:bg-primary hover:text-white"
        >
          Wave 👋
        </Button>
      </Link>
    </motion.div>
  );
}

function SuggestedUser({ user }: { user: User }) {
  return (
    <div className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/40 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <Avatar size="sm" fallback={user.avatar} className="ring-1 ring-border/60" />
          {user.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-xs text-foreground truncate">{user.displayName}</p>
          <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="xs"
        className="h-7 px-2.5 text-[11px] rounded-lg border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary shrink-0 gap-1"
      >
        <UserPlus className="w-3 h-3" />
        Follow
      </Button>
    </div>
  );
}

export function RightRail() {
  const { user } = useAuthStore();
  const currentUser = user || CURRENT_USER;

  const onlineUsers = MOCK_USERS.filter((u) => u.id !== currentUser.id && u.isOnline).slice(0, 4);
  const suggestedUsers = MOCK_USERS.filter((u) => u.id !== currentUser.id).slice(0, 3);

  return (
    <aside className="w-80 px-4 py-6 overflow-y-auto hidden xl:block border-l border-border/60 transition-colors">
      <div className="space-y-5">
        {/* Radar Promo Widget */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary mb-2">
                <Sparkles className="w-3 h-3" /> Real-time Radar
              </span>
              <h4 className="text-sm font-semibold text-foreground">Explore Living Universe</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Discover people orbiting your interests</p>
            </div>
          </div>
          <Link href="/radar" className="mt-3 block">
            <Button size="sm" className="w-full text-xs h-8 rounded-xl bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm">
              <Compass className="w-3.5 h-3.5" />
              Launch Radar
            </Button>
          </Link>
        </div>

        {/* Active Now */}
        <div className="bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <h3 className="font-semibold text-xs text-foreground tracking-tight">Active Creators</h3>
            </div>
            <Link href="/discover" className="text-[11px] text-primary hover:underline font-medium">
              View all
            </Link>
          </div>

          <div className="space-y-0.5">
            {onlineUsers.map((u) => (
              <ActiveNowItem key={u.id} user={u} />
            ))}
          </div>
        </div>

        {/* Suggested Follows */}
        <div className="bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-semibold text-xs text-foreground tracking-tight">Who to Follow</h3>
            <Link href="/search" className="text-[11px] text-primary hover:underline font-medium">
              See more
            </Link>
          </div>

          <div className="space-y-0.5">
            {suggestedUsers.map((u) => (
              <SuggestedUser key={u.id} user={u} />
            ))}
          </div>
        </div>

        {/* Trending Tags */}
        <div className="bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <h3 className="font-semibold text-xs text-foreground tracking-tight">Trending Topics</h3>
          </div>

          <div className="space-y-2">
            {TRENDING_TAGS.map((t) => (
              <Link
                key={t.tag}
                href={`/search?q=${t.tag}`}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors group"
              >
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  #{t.tag}
                </span>
                <span className="text-[11px] text-muted-foreground">{t.posts} posts</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-2 text-[11px] text-muted-foreground space-y-1">
          <p>© 2026 Phryvos Inc. • Privacy & Terms</p>
        </div>
      </div>
    </aside>
  );
}
