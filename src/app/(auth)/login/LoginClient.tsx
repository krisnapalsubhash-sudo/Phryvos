'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';
import { staggerContainer, fadeSlideUp } from '@/lib/motion';
import { toast } from 'sonner';

interface LoginClientProps {
  callbackUrl: string;
}

export default function LoginClient({ callbackUrl }: LoginClientProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Please enter your username or email'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }

    setLoading(true);
    sound.playPop(480);

    try {
      const result = await signIn('credentials', {
        identifier: identifier.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        sound.playPop(300);
      } else {
        sound.playMatchChord();
        toast.success('Welcome back!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      sound.playPop(300);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    sound.playPop(480);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier: 'demo@phryvos.com',
        password: 'demo123456',
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Demo account doesn't exist, create it on the fly
        toast.error('Demo account not configured. Please sign up.');
      } else {
        sound.playMatchChord();
        toast.success('Welcome to Phryvos!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error('Demo mode not available. Please create an account.');
    } finally {
      setLoading(false);
    }
  };

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
        <Link href="/" className="flex items-center gap-2.5">
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
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Headline */}
          <motion.div variants={fadeSlideUp} className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
              Welcome back to{' '}
              <span className="phryvos-gradient-text">Phryvos</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Your people are waiting for you.
            </p>
          </motion.div>

          {/* Quick Demo — featured prominently */}
          <motion.button
            variants={fadeSlideUp}
            onClick={handleDemoSignIn}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mb-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-primary/25 hover:border-primary/50 hover:bg-gradient-to-r hover:from-indigo-500/15 hover:via-purple-500/15 hover:to-cyan-500/15 transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl phryvos-gradient flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-foreground">Try Instant Demo</p>
              <p className="text-xs text-muted-foreground">No signup needed — explore everything</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Divider */}
          <motion.div variants={fadeSlideUp} className="relative flex items-center justify-center my-4">
            <div className="border-t border-border/50 w-full" />
            <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider absolute">
              or sign in
            </span>
          </motion.div>

          {/* Login form */}
          <motion.div variants={fadeSlideUp} className="glass-panel rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Username or Email</label>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={() => sound.playPop(360)}
                  placeholder="e.g. alexrivera or alex@example.com"
                  className="bg-background border-border/70 rounded-xl h-11 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <Link href="/forgot-password" className="text-[11px] text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => sound.playPop(360)}
                    placeholder="••••••••"
                    className="bg-background border-border/70 rounded-xl h-11 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); sound.playPop(400); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive font-medium"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading}
                onClick={() => sound.playPop(480)}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-11 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                    />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>
          </motion.div>

          <motion.p variants={fadeSlideUp} className="text-center text-xs text-muted-foreground mt-5">
            New here?{' '}
            <Link href="/register" onClick={() => sound.playPop(480)} className="font-semibold text-primary hover:underline">
              Create your Phryvos account
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground py-4">
        © 2026 Phryvos — <span className="phryvos-gradient-text font-semibold">Where Strangers Become Stories.</span>
      </div>
    </div>
  );
}