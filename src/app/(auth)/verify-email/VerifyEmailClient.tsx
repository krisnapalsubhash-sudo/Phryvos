'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';
import { fadeSlideUp } from '@/lib/motion';

interface VerifyEmailClientProps {
  token?: string;
}

export default function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const router = useRouter();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid or missing verification token');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setError(data.error || 'Verification failed');
          return;
        }

        setStatus('success');
        sound.playMatchChord();
        toast.success('Email verified successfully!');
      } catch {
        setStatus('error');
        setError('Something went wrong. Please try again.');
      }
    };

    verify();
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-background text-foreground relative overflow-hidden transition-colors">
        <div className="hero-glow-mesh" />
        <div className="w-full max-w-md mx-auto my-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary border-t-transparent flex items-center justify-center mx-auto mb-4"
            >
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">Verifying your email...</h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we verify your email address.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
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
            <h2 className="text-xl font-bold text-foreground mb-2">Verification Failed</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {error || 'This verification link is invalid or has expired.'}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              The link may have expired (links expire after 24 hours) or already been used.
            </p>
            <Link href="/register">
              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-10 shadow-sm">
                Create New Account
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
          <span className="font-semibold text-sm text-foreground">Back to Sign In</span>
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      {/* Success Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">Email Verified!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your email has been verified successfully. You can now sign in to Phryvos.
          </p>
          <Link href="/login">
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-10 shadow-sm">
              Sign In Now
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground py-2">
        © 2026 Phryvos — <span className="phryvos-gradient-text font-semibold">Where Strangers Become Stories.</span>
      </div>
    </div>
  );
}