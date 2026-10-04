'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  MessageSquare,
  User,
} from 'lucide-react';
import { sound } from '@/lib/sound';

const navItems = [
  { icon: Home, label: 'Feed', href: '/feed' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Compass, label: 'Radar', href: '/radar', highlight: true },
  { icon: MessageSquare, label: 'Chat', href: '/chat', badge: 3 },
  { icon: User, label: 'Profile', href: '/profile/me' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-border/80 z-50 md:hidden flex items-center justify-around px-2"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
        const isHighlight = item.highlight;

        if (isHighlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sound.playPop(620)}
              className="relative -top-4 flex flex-col items-center group"
              aria-label={item.label}
            >
              <div className="w-12 h-12 rounded-full phryvos-gradient flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-4 ring-background transition-transform active:scale-95">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-primary mt-1">Radar</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => sound.playPop(440)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
              {item.badge && item.badge > 0 && !isActive && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-primary text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
