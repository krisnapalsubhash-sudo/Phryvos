'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  User,
  Palette,
  LogOut,
  Save,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Radio,
  Gamepad2,
  Mic,
  Volume2,
  Clock,
  RotateCcw,
  Feather,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { useFeaturesStore } from '@/store/features';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { setTheme: setNextTheme } = useTheme();
  const { theme, setTheme: setStoreTheme } = useThemeStore();
  const { user, logout, updateProfile } = useAuthStore();
  const { flags, toggleFlag, setMinimalistMode, applyPreset, resetToDefaults } = useFeaturesStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saved, setSaved] = useState(false);
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  const handleSelectTheme = (t: 'light' | 'dark' | 'system') => {
    setStoreTheme(t);
    setNextTheme(t);
    sound.playPop(420);
  };

  const handleSave = () => {
    updateProfile({ displayName, bio });
    setSaved(true);
    sound.playMessageSent();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleMinimalist = () => {
    const next = !flags.minimalistMode;
    setMinimalistMode(next);
    sound.playPop(next ? 320 : 540);
    setPresetNotice(next ? '🧘 Minimalist Pure Social Mode Activated' : '⚡ Full Cosmic Features Restored');
    setTimeout(() => setPresetNotice(null), 2500);
  };

  const handleApplyPreset = (p: 'full' | 'minimalist') => {
    applyPreset(p);
    sound.playPop(p === 'full' ? 580 : 380);
    setPresetNotice(p === 'full' ? '⚡ Full Cosmic Orbit Experience Loaded' : '🧘 Minimalist Mode Loaded');
    setTimeout(() => setPresetNotice(null), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-24 md:pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Preferences & Customization</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Control every feature or enable Minimalist Mode</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Preset Feedback Banner */}
        {presetNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-primary/10 border border-primary/30 rounded-2xl text-xs font-semibold text-primary text-center flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{presetNotice}</span>
          </motion.div>
        )}

        {/* 1. MASTER FEATURE CONTROL CENTER & MINIMALIST MODE */}
        <section className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Feature Control Center
              </h2>
            </div>

            <button
              onClick={() => {
                resetToDefaults();
                sound.playPop(340);
                setPresetNotice('Reset to Default Experience ✨');
                setTimeout(() => setPresetNotice(null), 2000);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Minimalist Mode Master Card */}
          <div
            onClick={handleToggleMinimalist}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer mb-5 flex items-center justify-between ${
              flags.minimalistMode
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                : 'bg-secondary/30 border-border/70 hover:border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                  flags.minimalistMode ? 'bg-emerald-500 text-white shadow-md' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Minimalist Pure Social Mode</h3>
                  {flags.minimalistMode && (
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                  Turns off all games, ambient radio, voice waveforms, and extra widgets. Enjoy a 100% clean, silent text & photo feed with simple private messaging.
                </p>
              </div>
            </div>

            <div className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={flags.minimalistMode}
                onChange={handleToggleMinimalist}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-semibold text-muted-foreground">Quick Presets:</span>
            <button
              onClick={() => handleApplyPreset('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !flags.minimalistMode
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚡ Full Cosmic
            </button>
            <button
              onClick={() => handleApplyPreset('minimalist')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                flags.minimalistMode
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              🧘 Minimalist Pure
            </button>
          </div>

          {/* Individual Feature Toggles */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <p className="text-xs font-bold text-foreground mb-2">Individual Modular Features:</p>

            {[
              {
                id: 'cosmicRadio' as const,
                icon: Radio,
                label: 'Cosmic Ambient Radio',
                desc: 'Floating bottom dock with 4 live ambient lo-fi / rain frequencies and co-listeners counter',
              },
              {
                id: 'gamesAndActivities' as const,
                icon: Gamepad2,
                label: 'Games & Activities Hub',
                desc: 'Chess Blitz, Ludo Stadium, Trivia Orbit, Truth or Dare, and Daily Dilemmas in Search',
              },
              {
                id: 'storiesAndFleeting' as const,
                icon: Clock,
                label: '24h Stories & Fleeting Hub',
                desc: 'Full-screen kinetic story viewer, animated glowing story rings, and story composer',
              },
              {
                id: 'voiceDrops' as const,
                icon: Mic,
                label: 'Voice Drops & Waveforms',
                desc: '15-second audio snippets, simulated waveforms, and sound previews in feed',
              },
              {
                id: 'midnightDrops' as const,
                icon: Moon,
                label: 'Midnight Confession Cards',
                desc: 'Dark velvet gradient typography cards for unfiltered late-night thoughts',
              },
              {
                id: 'whisperToStranger' as const,
                icon: Send,
                label: 'Secret Whisper to Stranger',
                desc: 'Direct inline quote and private whisper buttons on stories and posts',
              },
              {
                id: 'soundEffects' as const,
                icon: Volume2,
                label: 'Web Audio Sound Chords',
                desc: 'Instant micro-tones on hearts, button taps, and game interactions',
              },
            ].map(({ id, icon: Icon, label, desc }) => {
              const isEnabled = flags[id];
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>

                  <div className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {
                        toggleFlag(id);
                        sound.playPop(isEnabled ? 320 : 520);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Appearance & Theme Selector */}
        <section className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interface Theme</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light' as const, icon: Sun, label: 'Light Mode', desc: 'Crisp & Clean' },
              { id: 'dark' as const, icon: Moon, label: 'Dark Mode', desc: 'Obsidian Glow' },
              { id: 'system' as const, icon: Monitor, label: 'System', desc: 'Auto match' },
            ].map(({ id, icon: Icon, label, desc }) => {
              const isSelected = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectTheme(id)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-border/80 hover:border-primary/40 bg-secondary/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Profile Information */}
        <section className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Information</h2>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl phryvos-gradient flex items-center justify-center text-2xl text-white shadow-sm ring-2 ring-card">
              {user?.avatar || '😊'}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{user?.displayName || 'Creator'}</p>
              <p className="text-xs text-muted-foreground">@{user?.username || 'handle'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your public name"
                className="bg-secondary/40 border-border/70 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Tell the community about yourself..."
                className="w-full bg-secondary/40 border border-border/70 text-xs sm:text-sm rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <Button
              onClick={handleSave}
              size="sm"
              className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs px-5 gap-1.5 h-8.5 shadow-xs"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </section>

        {/* 4. Push & Notifications */}
        <section className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</h2>
          </div>

          <div className="divide-y divide-border/50">
            {[
              { label: 'Direct Whispers & Messages', desc: 'Instant alerts when people whisper to you', defaultOn: true },
              { label: 'Radar Proximity Waves', desc: 'Notify when interesting creators orbit near you', defaultOn: true },
              { label: 'Story Reactions', desc: 'Floating emoji reactions on your 24h stories', defaultOn: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={item.defaultOn}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. Account & Logout */}
        <section className="bg-card border border-red-500/20 rounded-3xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Sign Out of Session</p>
              <p className="text-[11px] text-muted-foreground">Log back in anytime with your credentials</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs gap-1.5 h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
