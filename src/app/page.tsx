'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  Heart,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LandingPage() {
  const features = [
    {
      icon: Compass,
      title: 'Radar Discovery',
      desc: 'Explore a visual social map in real-time. See active creators orbiting your interests.',
      tag: 'Core Engine',
      gradient: 'from-indigo-500/20 to-purple-500/10',
    },
    {
      icon: MessageSquare,
      title: 'Instant Fluid Chat',
      desc: 'Connect with people globally with zero latency. Seamless private and community messaging.',
      tag: 'Real-time',
      gradient: 'from-cyan-500/20 to-blue-500/10',
    },
    {
      icon: Zap,
      title: 'Noise-Free Feed',
      desc: 'A chronological, high-signal feed. Beautiful media cards, rich interactions, no rage-bait algorithms.',
      tag: 'Curated',
      gradient: 'from-amber-500/20 to-rose-500/10',
    },
    {
      icon: Globe,
      title: 'Borderless Community',
      desc: 'Meet creative minds across 180+ countries with automatic translation and cultural discovery.',
      tag: 'Global',
      gradient: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      icon: Shield,
      title: 'Privacy & Control',
      desc: 'Your data stays yours. Granular controls over your visibility, presence status, and digital footprint.',
      tag: 'Secure',
      gradient: 'from-violet-500/20 to-indigo-500/10',
    },
    {
      icon: Sparkles,
      title: 'Adaptive Dual Theme',
      desc: 'Crafted for visual comfort with refined Light and Dark themes, smooth animations, and high contrast.',
      tag: 'Design System',
      gradient: 'from-pink-500/20 to-rose-500/10',
    },
  ];

  const stats = [
    { value: 'Beta', label: 'Current Phase' },
    { value: 'Local', label: 'Running Locally' },
    { value: 'SSE', label: 'Realtime Engine' },
    { value: 'Mock', label: 'Data Status' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors overflow-x-hidden relative">
      {/* Background Ambient Glow */}
      <div className="hero-glow-mesh" />

      {/* Modern Sticky Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl phryvos-gradient flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Phryvos
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link href="/feed" className="hover:text-foreground transition-colors">Live Feed</Link>
            <Link href="/radar" className="hover:text-foreground transition-colors">Radar</Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">Chat</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="pill" />

            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold px-4">
                Sign In
              </Button>
            </Link>

            <Link href="/feed">
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4.5 shadow-sm hover:shadow-glow-sm transition-all gap-1.5">
                <span>Open App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Release Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phryvos 2.0 is live with adaptive dual themes</span>
          <ArrowRight className="w-3 h-3" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]"
        >
          Social connection,{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            elevated & authentic.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Discover creators nearby on the live radar, converse without awkwardness, and engage in high-signal discussions in a clean, distraction-free environment.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/feed">
            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-7 shadow-md hover:shadow-glow-md transition-all gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/radar">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-border/80 hover:bg-secondary text-foreground font-semibold px-7 backdrop-blur-md gap-2"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Explore Radar</span>
            </Button>
          </Link>
        </motion.div>

        {/* Live UI Mockup Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 md:mt-24 relative max-w-5xl mx-auto"
        >
          {/* Outer glow container */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-xl opacity-70" />

          <div className="relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xl overflow-hidden text-left">
            {/* Window titlebar */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400/80" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="text-xs font-mono text-muted-foreground ml-2">phryvos.app/feed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Mock UI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Mini Widget: Radar Orbit */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold text-foreground">Proximity Radar</h3>
                  </div>
                  <div className="relative h-44 rounded-lg bg-background/50 border border-border/50 flex items-center justify-center overflow-hidden">
                    <div className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping opacity-30" />
                    <div className="absolute w-24 h-24 rounded-full border border-primary/30" />
                    <div className="absolute w-14 h-14 rounded-full border border-cyan-400/30" />
                    <div className="w-8 h-8 rounded-full phryvos-gradient flex items-center justify-center text-white text-xs font-bold shadow-md z-10">
                      You
                    </div>
                    {/* Surrounding mock nodes */}
                    <div className="absolute top-4 left-6 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px]">
                      🚀
                    </div>
                    <div className="absolute bottom-6 right-8 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px]">
                      🎨
                    </div>
                    <div className="absolute top-8 right-6 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px]">
                      ⚡
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">Start matchmaking to discover nearby peers</p>
              </div>

              {/* Center Widget: Live Post Preview */}
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full phryvos-gradient flex items-center justify-center text-white text-xs font-bold">
                        A
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Alex Rivera</p>
                        <p className="text-[10px] text-muted-foreground">Product Designer • 12m ago</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                      #Design
                    </span>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed mb-3">
                    Just redesigned our entire social canvas. The minimalist dual-theme aesthetic feels 10x faster and cleaner! ✨
                  </p>

                  <div className="rounded-lg bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-primary/20 h-28 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">Interactive Preview Canvas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground mt-3">
                  <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>248</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>42</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>18</span>
                  </div>
                </div>
              </div>

              {/* Right Widget: Real-time Chat Snippet */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-semibold text-foreground">Active Discussion</h3>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl rounded-tl-none bg-card border border-border/60 text-xs text-foreground/90">
                      <p className="text-[10px] font-bold text-primary mb-0.5">Maya Chen</p>
                      Has anyone tested the new live radar matching?
                    </div>

                    <div className="p-2.5 rounded-xl rounded-tr-none bg-primary text-white text-xs ml-auto max-w-[85%] shadow-xs">
                      Yes! Matched with 3 developers in Tokyo within seconds ⚡
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <input
                      disabled
                      placeholder="Type a message..."
                      className="flex-1 bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs text-muted-foreground outline-none"
                    />
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Counter Strip */}
      <section className="border-y border-border/60 bg-card/60 backdrop-blur-md py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Engineered For Creators</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mt-2">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-4">
            Designed from the ground up with modern aesthetics, lightning-fast rendering, and human-centric interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/60">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 text-center border border-primary/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 shadow-xl">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight max-w-2xl mx-auto">
            Ready to experience social media the way it was meant to be?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-4 max-w-xl mx-auto">
            Step into Phryvos today. Available directly in your browser on desktop, tablet, and mobile.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/feed">
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-8 shadow-md gap-2">
                <span>Launch Phryvos Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Modern Footer */}
      <footer className="border-t border-border/60 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg phryvos-gradient flex items-center justify-center text-white text-[10px] font-bold">
              I
            </div>
            <span className="font-semibold text-foreground">Phryvos</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/feed" className="hover:text-foreground transition-colors">Feed</Link>
            <Link href="/radar" className="hover:text-foreground transition-colors">Radar</Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">Chat</Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
