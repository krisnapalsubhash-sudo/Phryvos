import { Metadata } from 'next';
import Link from 'next/link';
import { Home, Search, Compass } from 'lucide-react';
import { sound } from '@/lib/sound';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = {
  title: 'Page Not Found | Phryvos',
  description: 'The page you are looking for does not exist.',
};

export const viewport = {
  themeColor: '#000000',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ scale: [1, 1.06, 1], x: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/14 blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 0.94, 1], x: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[15%] -right-[10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-600/12 blur-[100px]"
        />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => sound.playPop(340)}>
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-white/10">
            <img src="/brand/logo-icon-512.png" alt="Phryvos" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-none tracking-tight phryvos-gradient-text">Phryvos</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Social</span>
          </div>
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/feed"
              onClick={() => sound.playPop(480)}
              className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-11 shadow-sm flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Feed
            </Link>
            <Link
              href="/search"
              onClick={() => sound.playPop(480)}
              className="w-full sm:w-auto rounded-xl border border-border/70 bg-background hover:bg-secondary/40 text-foreground font-semibold text-sm h-11 flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Discover People
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground py-4">
        © 2026 Phryvos — <span className="phryvos-gradient-text font-semibold">Where Strangers Become Stories.</span>
      </div>
    </div>
  );
}