'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  MessageSquare,
  Heart,
  User,
  Settings,
  Sparkles,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { sound } from '@/lib/sound';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { icon: Home, label: 'Feed', href: '/feed' },
  { icon: Search, label: 'Discover', href: '/search' },
  { icon: Compass, label: 'Radar', href: '/radar', highlight: true },
  { icon: MessageSquare, label: 'Chat', href: '/chat', badge: 3 },
  { icon: Heart, label: 'Activity', href: '/notifications', badge: 5 },
  { icon: User, label: 'Profile', href: '/profile/me' },
];

export function LeftRail() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Check if user is admin
  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  const isAdmin = user?.id === adminId;

  return (
    <nav
      className="fixed left-0 top-0 h-screen w-16 md:w-20 glass-panel border-r border-border/70 flex flex-col items-center py-5 z-40 transition-all"
      aria-label="Main navigation"
    >
      {/* Brand Icon */}
      <Link
        href="/feed"
        onClick={() => sound.playPop(480)}
        className="mb-8 group relative"
        aria-label="Phryvos Home"
      >
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-all border border-white/10">
          <img src="/brand/logo-icon-512.png" alt="Phryvos Home" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-md opacity-40 group-hover:opacity-75 transition-opacity -z-10" />
      </Link>

      {/* Navigation Links */}
      <div className="flex flex-col gap-2 w-full px-2.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sound.playPop(item.highlight ? 600 : 440)}
              className={`relative flex flex-col items-center justify-center w-full h-12 rounded-2xl transition-all group ${
                isActive
                  ? item.highlight
                    ? 'text-white bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-500/20'
                    : 'text-primary bg-primary/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive && !item.highlight ? 'fill-primary/20' : ''}`} />
                {item.badge && item.badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-semibold' : 'font-normal opacity-80'}`}>
                {item.label}
              </span>

              {/* Active vertical accent indicator */}
              {isActive && (
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* Admin Dashboard Link - only visible to admin */}
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            onClick={() => sound.playPop(640)}
            className="relative flex flex-col items-center justify-center w-full h-12 rounded-2xl transition-all group bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 border border-amber-500/20"
            aria-label="Admin Dashboard"
          >
            <div className="relative">
              <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                A
              </span>
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-semibold">
              Admin
            </span>
          </Link>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Actions: Theme Toggle & Settings */}
      <div className="flex flex-col items-center gap-2.5 w-full px-2">
        <ThemeToggle className="w-10 h-10 rounded-xl" />

        <Link
          href="/settings"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5 hover:rotate-45 transition-transform duration-300" />
        </Link>
      </div>
    </nav>
  );
}
