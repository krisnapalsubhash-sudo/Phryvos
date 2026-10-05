'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';
import { validateUsername, validateEmail } from '@/lib/auth/validation';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Username status tracking with race-condition protection
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameStatusReason, setUsernameStatusReason] = useState<string>('');
  const usernameCheckSeqRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(async (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus('idle');
      setUsernameStatusReason('');
      return;
    }

    // Client-side syntax & reserved name validation first
    const localValidation = validateUsername(trimmed);
    if (!localValidation.valid) {
      setUsernameStatus('invalid');
      setUsernameStatusReason(localValidation.error || 'Invalid username');
      return;
    }

    // Increment request ID to ignore stale / out-of-order responses
    const currentSeq = ++usernameCheckSeqRef.current;
    setUsernameStatus('checking');
    setUsernameStatusReason('');

    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      // Discard if a newer request was dispatched
      if (currentSeq !== usernameCheckSeqRef.current) {
        return;
      }

      if (res.ok && data.available) {
        setUsernameStatus('available');
        setUsernameStatusReason('Available');
      } else if (data.error === 'USERNAME_TAKEN' || !data.available) {
        setUsernameStatus('taken');
        setUsernameStatusReason(data.reason || 'Username is already taken');
      } else {
        setUsernameStatus('error');
        setUsernameStatusReason(data.message || 'Unable to check availability');
      }
    } catch {
      if (currentSeq === usernameCheckSeqRef.current) {
        setUsernameStatus('error');
        setUsernameStatusReason('Network error checking availability');
      }
    }
  }, []);

  const handleUsernameChange = (raw: string) => {
    // Only allow alphanumeric and underscore characters
    const clean = raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(clean);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (clean.length < 3) {
      setUsernameStatus('idle');
      setUsernameStatusReason('');
      return;
    }

    // Debounce the network request by 350ms
    debounceTimerRef.current = setTimeout(() => {
      checkAvailability(clean);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Username validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid || !usernameValidation.normalized) {
      setError(usernameValidation.error || 'Please enter a valid username');
      sound.playPop(300);
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose another.');
      sound.playPop(300);
      return;
    }

    // 2. Email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      setError(emailValidation.error || 'Please enter a valid email address');
      sound.playPop(300);
      return;
    }

    // 3. Password validation
    if (!password) {
      setError('Please enter a password');
      sound.playPop(300);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      sound.playPop(300);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      sound.playPop(300);
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      sound.playPop(300);
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      sound.playPop(300);
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      sound.playPop(300);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      sound.playPop(300);
      return;
    }

    setLoading(true);
    sound.playPop(480);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameValidation.normalized,
          email: emailValidation.normalized,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'USERNAME_TAKEN') {
          setError('This username is already registered. Please choose another.');
          setUsernameStatus('taken');
        } else if (data.code === 'EMAIL_ALREADY_EXISTS') {
          setError('An account with this email already exists. Try signing in.');
        } else if (data.code === 'RATE_LIMITED') {
          setError('Too many registration attempts. Please wait a moment and try again.');
        } else if (data.code === 'VALIDATION_ERROR' && data.details) {
          const firstField = Object.keys(data.details)[0];
          setError(data.details[firstField]?.[0] || 'Please review your input fields.');
        } else {
          setError(data.error || 'Registration could not be completed. Please try again.');
        }
        sound.playPop(300);
        return;
      }

      sound.playMatchChord();
      toast.success(
        data.emailSent
          ? 'Account created! Please check your email to verify your account.'
          : 'Account created! Please verify your email before logging in.'
      );
      router.push(`/login?registered=true&email=${encodeURIComponent(emailValidation.normalized)}`);
    } catch {
      setError('Network connection error. Please check your internet connection and try again.');
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
            {/* Username Input with Debounced Realtime Verification */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">@</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose a username"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pl-8 pr-28"
                  autoFocus
                  maxLength={20}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs">
                  {usernameStatus === 'checking' && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-emerald-500 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-destructive flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Taken
                    </span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="text-destructive flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Invalid
                    </span>
                  )}
                  {usernameStatus === 'error' && (
                    <span className="text-amber-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Error
                    </span>
                  )}
                </div>
              </div>
              {usernameStatusReason && usernameStatus !== 'available' && usernameStatus !== 'checking' && (
                <p className="text-[11px] text-destructive mt-1">{usernameStatusReason}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="name@example.com"
                className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10"
                disabled={loading}
                maxLength={254}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars: upper, lower, number, special"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pr-10"
                  disabled={loading}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); sound.playPop(400); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1.5">
                <p className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-500 font-medium' : ''}`}>
                  <Check className="w-3 h-3" /> At least 8 characters
                </p>
                <p className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-500 font-medium' : ''}`}>
                  <Check className="w-3 h-3" /> One uppercase letter
                </p>
                <p className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-emerald-500 font-medium' : ''}`}>
                  <Check className="w-3 h-3" /> One lowercase letter
                </p>
                <p className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-500 font-medium' : ''}`}>
                  <Check className="w-3 h-3" /> One number
                </p>
                <p className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500 font-medium' : ''}`}>
                  <Check className="w-3 h-3" /> One special character
                </p>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl h-10 pr-10"
                  disabled={loading}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => { setShowConfirmPassword(!showConfirmPassword); sound.playPop(400); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[10px] mt-1 ${confirmPassword === password ? 'text-emerald-500 font-medium' : 'text-destructive'}`}>
                  {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm h-10 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
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