'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';
import { fadeSlideUp } from '@/lib/motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    sound.playPop(480);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        sound.playPop(300);
        return;
      }

      sound.playMatchChord();
      setSent(true);
      toast.success('If an account exists, a reset link has been sent');
    } catch {
      setError('Something went wrong. Please try again.');
      sound.playPop(300);
    } finally {
      setLoading(false);
    }
  };

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
          {!sent ? (
            <>
              <motion.div variants={fadeSlideUp} className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                  <Mail className="w-3 h-3" />
                  <span>Reset Password</span>
                </div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
                  Forgot your password?
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="name@example.com"
                    className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10"
                    autoFocus
                  />
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
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </Button>
              </form>

              <motion.p variants={fadeSlideUp} className="text-center text-xs text-muted-foreground mt-6">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </motion.p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Check your inbox</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">
                  resend
                </button>
              </p>
              <Link href="/login" onClick={() => sound.playPop(480)}>
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-10 shadow-sm">
                  Back to Sign In
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground relative z-10 py-2">
        © 2026 Phryvos — <span className="phryvos-gradient-text font-semibold">Where Strangers Become Stories.</span>
      </div>
    </div>
  );
}