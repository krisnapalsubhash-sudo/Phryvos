/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Zap,
  Radio,
  Sliders,
  Feather,
  Gamepad2,
  Mic,
  Moon,
  Clock,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useFeaturesStore } from '@/store/features';
import { validateUsername } from '@/lib/auth/validation';
import {
  DISCOVERY_SOURCES,
  FEATURE_INTROS,
  INTENT_OPTIONS,
  INTERESTS,
  AVATARS
} from './constants';
import { sound } from '@/lib/sound';
import { fadeSlideUp, staggerContainer } from '@/lib/motion';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const TOTAL_STEPS = 6;
const STEP_LABELS = ['Discovery', 'Orbit Mode', 'Intent', 'Identity', 'Interests', 'Avatar'];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();
  const {
    flags,
    toggleFlag,
    applyPreset,
    setMinimalistMode,
    setSurveyData
  } = useFeaturesStore();

  const [step, setStep] = useState(0);

  // Step 0: Discovery survey
  const [discoverySource, setDiscoverySource] = useState(DISCOVERY_SOURCES[0].id);

  // Step 1: Experience preset
  const [selectedPreset, setSelectedPreset] = useState<'full' | 'minimalist' | 'custom'>('full');
  const [showCustomList, setShowCustomList] = useState(false);

  // Step 2: Intent
  const [intent, setIntent] = useState('');

  // Step 3: Identity
  const [username, setUsername] = useState('');

  // Step 4: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 5: Avatar
  const [selectedAvatar, setSelectedAvatar] = useState('😊');
  const [isCompleting, setIsCompleting] = useState(false);

  // Username availability tracking (mirrors register page pattern)
  type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameStatusReason, setUsernameStatusReason] = useState<string>('');
  const usernameCheckSeqRef = React.useRef<number>(0);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const canProceedStep0 = discoverySource !== '';
  const canProceedStep1 = true;
  const canProceedStep2 = intent !== '';
  const canProceedStep3 = username.length >= 3;
  const canProceedStep4 = selectedInterests.length >= 1;

  const canProceed = [
    canProceedStep0,
    canProceedStep1,
    canProceedStep2,
    canProceedStep3,
    canProceedStep4,
    true,
  ][step];

  const goNext = () => {
    if (!canProceed) return;
    sound.playPop(440 + step * 30);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    sound.playPop(360);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSelectPreset = (p: 'full' | 'minimalist' | 'custom') => {
    setSelectedPreset(p);
    if (p === 'minimalist') {
      setMinimalistMode(true);
      setShowCustomList(false);
      sound.playPop(340);
    } else if (p === 'full') {
      setMinimalistMode(false);
      applyPreset('full');
      setShowCustomList(false);
      sound.playPop(560);
    } else {
      setShowCustomList(true);
      sound.playPop(480);
    }
  };

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) => {
      const has = prev.includes(label);
      if (has) {
        sound.playPop(300);
        return prev.filter((i) => i !== label);
      }
      if (prev.length >= 8) return prev;
      sound.playPop(540);
      return [...prev, label];
    });
  };

  // Debounced availability check (mirrors register page pattern)
  const checkAvailability = React.useCallback(async (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus('idle');
      setUsernameStatusReason('');
      return;
    }

    const localValidation = validateUsername(trimmed);
    if (!localValidation.valid) {
      setUsernameStatus('invalid');
      setUsernameStatusReason(localValidation.error || 'Invalid username');
      return;
    }

    const currentSeq = ++usernameCheckSeqRef.current;
    setUsernameStatus('checking');
    setUsernameStatusReason('');

    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (currentSeq !== usernameCheckSeqRef.current) return;

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

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleUsernameChange = (raw: string) => {
    const clean = raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(clean);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (clean.length < 3) {
      setUsernameStatus('idle');
      setUsernameStatusReason('');
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      checkAvailability(clean);
    }, 350);
  };

  const handleComplete = async () => {
    if (isCompleting) return;

    // Final client-side validation before API call
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid || !usernameValidation.normalized) {
      toast.error(usernameValidation.error || 'Invalid username');
      return;
    }
    if (usernameStatus === 'taken') {
      toast.error('Username is already taken. Please choose another.');
      return;
    }

    setIsCompleting(true);
    sound.playMatchChord();

    // Save survey data
    setSurveyData({
      discoverySource,
      presetChosen: selectedPreset,
      completedAt: new Date().toISOString(),
    });

    await new Promise((r) => setTimeout(r, 700));

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameValidation.normalized,
          displayName: usernameValidation.normalized,
          avatar: selectedAvatar,
          interests: selectedInterests,
          discoverySource,
          presetChosen: selectedPreset,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Onboarding failed');
      }

      updateProfile({
        username: data.user.username,
        displayName: data.user.displayName,
        avatar: data.user.avatar,
        interests: data.user.interests,
      });

      toast.success('Welcome to Phryvos! Your universe is customized ✨');
      router.push('/feed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Onboarding failed');
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Ambient background glow orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/14 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-600/12 blur-[90px]"
        />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-white/10">
            <img src="/brand/logo-icon-512.png" alt="Phryvos" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-none tracking-tight phryvos-gradient-text">Phryvos</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Orbit Setup</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Progress Stepper */}
      <div className="px-6 pt-1 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-1.5 mb-1.5">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className="h-1 rounded-full overflow-hidden bg-border/60">
                <motion.div
                  className="h-full phryvos-gradient"
                  initial={{ width: i < step ? '100%' : '0%' }}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
              <span
                className={`text-[8.5px] font-semibold tracking-wider uppercase transition-colors truncate ${
                  i === step ? 'text-primary' : i < step ? 'text-muted-foreground' : 'text-muted-foreground/40'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ─────────── STEP 0: Discovery Survey ─────────── */}
            {step === 0 && (
              <motion.div
                key="step-discovery"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                    <Compass className="w-3 h-3" />
                    <span>Step 1 of 6 — Quick Survey</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5">
                    How did you discover <span className="phryvos-gradient-text">Phryvos</span>?
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
                    Helps us understand how strangers find their way to our orbit.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DISCOVERY_SOURCES.map((source, idx) => {
                    const isSelected = discoverySource === source.id;
                    return (
                      <motion.button
                        key={source.id}
                        variants={fadeSlideUp}
                        custom={idx}
                        onClick={() => {
                          setDiscoverySource(source.id);
                          sound.playPop(420 + idx * 25);
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40'
                            : 'bg-card border-border/60 hover:border-border hover:bg-secondary/40'
                        }`}
                      >
                        <span className="text-2xl">{source.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground leading-tight">{source.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{source.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  variants={fadeSlideUp}
                  onClick={goNext}
                  className="mt-6 w-full py-3.5 rounded-2xl phryvos-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ─────────── STEP 1: Experience Preset & Feature Intro ─────────── */}
            {step === 1 && (
              <motion.div
                key="step-preset"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2.5">
                    <Sliders className="w-3 h-3" />
                    <span>Step 2 of 6 — Tailor Your Orbit</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5">
                    Choose Your <span className="phryvos-gradient-text">Experience</span>
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
                    You have 100% control. Turn off any feature you don't want, or keep it ultra-minimalist.
                  </p>
                </motion.div>

                {/* 3 Main Presets */}
                <div className="space-y-2.5 mb-4">
                  {/* Preset A: Full Cosmic Orbit */}
                  <button
                    onClick={() => handleSelectPreset('full')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                      selectedPreset === 'full'
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/70 hover:border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center text-lg shadow-sm">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground">Full Cosmic Orbit</p>
                          <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.2 rounded-full">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Games, voice drops, midnight cards & ambient radio all turned on.
                        </p>
                      </div>
                    </div>
                    {selectedPreset === 'full' && <Check className="w-4 h-4 text-primary" />}
                  </button>

                  {/* Preset B: Minimalist Pure Social */}
                  <button
                    onClick={() => handleSelectPreset('minimalist')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                      selectedPreset === 'minimalist'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                        : 'border-border/70 hover:border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                        <Feather className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground">Minimalist Pure Social</p>
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 rounded-full">
                            Zero Noise
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Pure text & photo feed, simple private DMs. No games or extra widgets.
                        </p>
                      </div>
                    </div>
                    {selectedPreset === 'minimalist' && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>

                  {/* Preset C: Custom Tailored */}
                  <button
                    onClick={() => handleSelectPreset('custom')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                      selectedPreset === 'custom'
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                        : 'border-border/70 hover:border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
                        🛠️
                      </div>
                      <div>
                        <p className="font-bold text-xs text-foreground">Custom Modular Setup</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Toggle each feature individually (radio, voice, midnight cards).
                        </p>
                      </div>
                    </div>
                    {selectedPreset === 'custom' && <Check className="w-4 h-4 text-purple-500" />}
                  </button>
                </div>

                {/* Modular Feature Intro List if Custom selected */}
                {showCustomList && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-secondary/30 border border-border/60 mb-3"
                  >
                    {FEATURE_INTROS.map((f) => {
                      const isOn = flags[f.key];
                      return (
                        <div
                          key={f.key}
                          className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span>{f.emoji}</span>
                            <div>
                              <p className="font-semibold text-foreground text-[11px]">{f.name}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{f.desc}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              toggleFlag(f.key);
                              sound.playPop(isOn ? 320 : 520);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              isOn ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {isOn ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                <motion.div variants={fadeSlideUp} className="flex gap-2.5 mt-5">
                  <button
                    onClick={goBack}
                    className="py-3 px-4 rounded-2xl border border-border/70 bg-card text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 rounded-2xl phryvos-gradient text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <span>Continue to Intent</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────── STEP 2: Intent ─────────── */}
            {step === 2 && (
              <motion.div
                key="step-intent"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2.5">
                    <Zap className="w-3 h-3" />
                    <span>Step 3 of 6 — Your Intent</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5">
                    What brings you to <span className="phryvos-gradient-text">Phryvos</span>?
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
                    No wrong answers. You decide what Phryvos is for you.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INTENT_OPTIONS.map((option, idx) => {
                    const isSelected = intent === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        variants={fadeSlideUp}
                        custom={idx}
                        onClick={() => {
                          setIntent(option.id);
                          sound.playPop(440 + idx * 20);
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? `bg-gradient-to-br ${option.color} ${option.border} shadow-sm ring-1 ring-primary/30`
                            : 'bg-card border-border/60 hover:border-border hover:bg-secondary/30'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground leading-tight">{option.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{option.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 ml-auto">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div variants={fadeSlideUp} className="flex gap-2.5 mt-5">
                  <button
                    onClick={goBack}
                    className="py-3 px-4 rounded-2xl border border-border/70 bg-card text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedStep2}
                    className="flex-1 py-3 rounded-2xl phryvos-gradient text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────── STEP 3: Username & Identity ─────────── */}
            {step === 3 && (
              <motion.div
                key="step-identity"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2.5">
                    <Zap className="w-3 h-3" />
                    <span>Step 4 of 6 — Identity</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5">
                    What should we <span className="phryvos-gradient-text">call you</span>?
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Pick a handle for discovery. You can change it anytime.
                  </p>
                </motion.div>

                <motion.div variants={fadeSlideUp} className="glass-panel rounded-2xl p-5 mb-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full phryvos-gradient flex items-center justify-center text-3xl shadow-lg">
                        {selectedAvatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                  </div>

                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="yourhandle"
                      maxLength={20}
                      autoFocus
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 text-sm font-semibold outline-none transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                      {usernameStatus === 'checking' && (
                        <span className="text-muted-foreground animate-pulse">Checking...</span>
                      )}
                      {usernameStatus === 'available' && (
                        <span className="text-emerald-500 font-medium">✓</span>
                      )}
                      {usernameStatus === 'taken' && (
                        <span className="text-destructive font-medium">✗</span>
                      )}
                      {usernameStatus === 'invalid' && (
                        <span className="text-destructive font-medium">✗</span>
                      )}
                    </div>
                  </div>
                  {username.length > 0 && username.length < 3 && (
                    <p className="text-xs text-destructive mt-1.5 ml-1">At least 3 characters needed</p>
                  )}
                  {usernameStatusReason && usernameStatus !== 'available' && usernameStatus !== 'checking' && (
                    <p className={`text-xs mt-1.5 ml-1 ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-destructive' : 'text-amber-500'}`}>
                      {usernameStatusReason}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={fadeSlideUp} className="flex gap-2.5">
                  <button
                    onClick={goBack}
                    className="py-3 px-4 rounded-2xl border border-border/70 bg-card text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedStep3}
                    className="flex-1 py-3 rounded-2xl phryvos-gradient text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────── STEP 4: Interests ─────────── */}
            {step === 4 && (
              <motion.div
                key="step-interests"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
                    <Zap className="w-3 h-3" />
                    <span>Step 5 of 6 — Your Vibe</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
                    What are you <span className="phryvos-gradient-text">into</span>?
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    Pick up to 8 interests to match with relevant strangers.
                  </p>
                  <div className="mt-1.5 text-xs font-semibold text-primary">
                    {selectedInterests.length}/8 selected
                  </div>
                </motion.div>

                <motion.div variants={fadeSlideUp} className="flex flex-wrap gap-2 justify-center mb-5 max-h-56 overflow-y-auto p-1">
                  {INTERESTS.map((item) => {
                    const isSelected = selectedInterests.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        onClick={() => toggleInterest(item.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'phryvos-gradient text-white border-transparent shadow-xs scale-105'
                            : 'bg-card border-border/70 hover:border-border text-foreground hover:bg-secondary/40'
                        }`}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </motion.div>

                <motion.div variants={fadeSlideUp} className="flex gap-2.5">
                  <button
                    onClick={goBack}
                    className="py-3 px-4 rounded-2xl border border-border/70 bg-card text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedStep4}
                    className="flex-1 py-3 rounded-2xl phryvos-gradient text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────── STEP 5: Avatar & Launch ─────────── */}
            {step === 5 && (
              <motion.div
                key="step-avatar"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={fadeSlideUp} className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Final Step — Your Face in the Stars</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
                    Pick your <span className="phryvos-gradient-text">Avatar</span>
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    Choose an avatar that feels like your vibe.
                  </p>
                </motion.div>

                <motion.div variants={fadeSlideUp} className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full phryvos-gradient flex items-center justify-center text-4xl shadow-xl ring-4 ring-primary/20">
                    {selectedAvatar}
                  </div>
                </motion.div>

                <motion.div variants={fadeSlideUp} className="grid grid-cols-6 gap-2 mb-5 max-h-48 overflow-y-auto p-1">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setSelectedAvatar(emoji);
                        sound.playPop(520);
                      }}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-primary/20 border-2 border-primary scale-110 shadow-xs'
                          : 'bg-card border border-border/60 hover:bg-secondary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>

                <motion.div variants={fadeSlideUp} className="flex gap-2.5">
                  <button
                    onClick={goBack}
                    className="py-3 px-4 rounded-2xl border border-border/70 bg-card text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="flex-1 py-3 rounded-2xl phryvos-gradient text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isCompleting ? 'Launching Orbit...' : 'Enter Phryvos ✨'}</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
