'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Eye, EyeOff, Lock, Check } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';
import { fadeSlideUp } from '@/lib/motion';

interface ResetPasswordClientProps {
  token?: string;
}

export default function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const router = useRouter();
  const clientToken = token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<null | boolean>(null);

  useEffect(() => {
    if (!clientToken) {
      setValidToken(false);
      return;
    }

    // Validate token format
    if (clientToken.length < 10) {
      setValidToken(false);
      return;
    }

    setValidToken(true);
  }, [clientToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) { setError('Please enter a password'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number'); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain at least one special character'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    if (!validToken) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    sound.playPop(480);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: clientToken, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        sound.playPop(300);
        return;
      }

      sound.playMatchChord();
      toast.success('Password has been reset! You can now sign in.');
      router.push('/login?reset=true');
    } catch {
      setError('Something went wrong. Please try again.');
      sound.playPop(300);
    } finally {
      setLoading(false);
    }
  };

  if (!clientToken || validToken === false) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-background text-foreground relative overflow-hidden transition-colors">
        <div className="hero-glow-mesh" />
        <div className="w-full max-w-md mx-auto my-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This password reset link is invalid or has expired.
              Please request a new one.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-10 shadow-sm">
                Request New Link
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="text-center text-[11px] text-muted-foreground py-2">
          © 2026 Phryvos
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-background text-foreground relative overflow-hidden transition-colors">
      <div className="hero-glow-mesh" />

      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto relative z-10">
        <Link href="/login" onClick={() => sound.playPop(340)} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          <span className="font-semibold text-sm text-foreground">Back to Sign In</span>
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      {/* Reset Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          <motion.div variants={fadeSlideUp} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
              <Lock className="w-3 h-3" />
              <span>Set New Password</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
              Set your new password
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Make it strong and memorable.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars: upper, lower, number, special"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); sound.playPop(400); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> At least 8 characters
                </p>
                <p className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> One uppercase letter
                </p>
                <p className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> One lowercase letter
                </p>
                <p className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> One number
                </p>
                <p className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> One special character
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); sound.playPop(400); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive mt-1.5">Passwords do not match</p>
              )}
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm h-10 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                  />
                  Resetting...
                </span>
              ) : 'Reset Password'}
            </Button>
          </form>

          <motion.p variants={fadeSlideUp} className="text-center text-xs text-muted-foreground mt-6">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground relative z-10 py-2">
        © 2026 Phryvos — <span className="phryvos-gradient-text font-semibold">Where Strangers Become Stories.</span>
      </div>
    </div>
  );
}