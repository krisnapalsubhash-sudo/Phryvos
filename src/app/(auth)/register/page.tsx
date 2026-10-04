'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2, Check } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value.toLowerCase())}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!username.trim()) { setError('Please enter a username'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      setError('Username must start with a letter and contain only letters, numbers, and underscores');
      return;
    }
    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password.trim()) { setError('Please enter a password'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number'); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain at least one special character'); return; }

    setLoading(true);
    sound.playPop(480);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        sound.playPop(300);
        return;
      }

      sound.playMatchChord();
      toast.success('Account created! Please verify your email to continue.');
      router.push('/login?registered=true');
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
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs border border-white/10">
            <img src="/brand/logo-icon-512.png" alt="Phryvos" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Phryvos
          </span>
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create your account</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Join thousands of creators connecting on Phryvos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">@</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    setUsername(value);
                    checkUsernameAvailability(value);
                  }}
                  placeholder="Choose a username"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pl-8"
                  autoFocus
                  maxLength={20}
                />
                {username.length >= 3 && usernameAvailable !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs">
                    {usernameAvailable ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="text-destructive">Taken</span>
                    )}
                  </div>
                )}
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-xs text-destructive mt-1.5">At least 3 characters</p>
              )}
              {username.length > 0 && !/^[a-zA-Z]/.test(username) && (
                <p className="text-xs text-destructive mt-1.5">Must start with a letter</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="name@example.com"
                className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars: upper, lower, number, special"
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
                  Creating account...
                </span>
              ) : (
                'Get Started'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground relative z-10 py-2">
        <span>By signing up, you agree to our Terms of Service & Privacy Policy.</span>
      </div>
    </div>
  );
}