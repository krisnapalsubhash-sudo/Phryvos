'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Send,
  Sparkles,
  MapPin,
  Mic,
  Moon,
  Clock,
  Heart,
  Share2
} from 'lucide-react';
import { useStoriesStore } from '@/store/stories';
import { useConnectionsStore } from '@/store/connections';
import { sound } from '@/lib/sound';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

export function StoryViewerModal() {
  const { stories, activeStoryId, closeStory, openStory, markSeen } = useStoriesStore();
  const { addConnection } = useConnectionsStore();

  const activeIndex = stories.findIndex((s) => s.id === activeStoryId);
  const currentStory = activeIndex !== -1 ? stories[activeIndex] : null;

  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [showWhisperSuccess, setShowWhisperSuccess] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const slides = currentStory?.slides || [
    {
      id: 'fallback-1',
      type: 'image' as const,
      mediaUrl: currentStory?.images?.[0] || 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
      caption: 'Memories captured in a fleeting moment.',
      tag: 'Phryvos Discover',
    },
  ];

  const currentSlide = slides[slideIndex] || slides[0];
  const slideDurationSec = currentSlide?.audioDuration || 5;

  // Mark story as seen when opened
  useEffect(() => {
    if (currentStory && !currentStory.hasSeen) {
      markSeen(currentStory.id);
    }
  }, [currentStory?.id]);

  // Reset slide index & progress when switching stories
  useEffect(() => {
    setSlideIndex(0);
    setProgress(0);
  }, [activeStoryId]);

  // Audio simulation for voice slides
  const synthAudioRef = useRef<(() => void) | null>(null);

  const startVoiceTone = useCallback(() => {
    if (typeof window === 'undefined' || isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      synthAudioRef.current = () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 120);
        } catch {}
      };
    } catch {}
  }, [isMuted]);

  const stopVoiceTone = useCallback(() => {
    if (synthAudioRef.current) {
      synthAudioRef.current();
      synthAudioRef.current = null;
    }
  }, []);

  // Timer loop for progress bar
  useEffect(() => {
    if (!currentStory || isPaused) return;

    if (currentSlide.type === 'voice' && !isMuted) {
      startVoiceTone();
    } else {
      stopVoiceTone();
    }

    const intervalMs = 50;
    const stepIncrement = (intervalMs / (slideDurationSec * 1000)) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      clearInterval(timer);
      stopVoiceTone();
    };
  }, [currentStory, slideIndex, isPaused, isMuted, slideDurationSec, startVoiceTone, stopVoiceTone]);

  // Keyboard navigation & ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') handleNextSlide();
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideIndex, activeIndex]);

  const handleNextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex((s) => s + 1);
      setProgress(0);
      sound.playPop(520);
    } else {
      // Go to next user's story
      if (activeIndex < stories.length - 1) {
        openStory(stories[activeIndex + 1].id);
        sound.playPop(480);
      } else {
        closeStory();
      }
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex((s) => s - 1);
      setProgress(0);
      sound.playPop(380);
    } else {
      // Go to prev user's story
      if (activeIndex > 0) {
        openStory(stories[activeIndex - 1].id);
        sound.playPop(420);
      }
    }
  };

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperText.trim() || !currentStory) return;

    sound.playMessageSent();
    // Phase 49: Story Replies directly drop into DMs (/chat)
    addConnection({
      id: currentStory.author.id,
      username: currentStory.author.username,
      displayName: currentStory.author.displayName,
      avatar: currentStory.author.avatar,
      location: currentStory.author.location,
      bio: currentStory.author.bio,
      interests: currentStory.author.interests,
    });

    setShowWhisperSuccess(true);
    setWhisperText('');
    setTimeout(() => {
      setShowWhisperSuccess(false);
    }, 2800);
  };

  const handleEmojiReaction = (emoji: string) => {
    if (emoji === '❤️') {
      sound.playHeart();
    } else {
      sound.playPop(620);
    }

    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: 30 + Math.random() * 40, // random percentage across center
    };

    setFloatingReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 1500);
  };

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
        {/* Floating Particles Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: '80vh', x: `${r.x}vw`, scale: 0.8 }}
              animate={{ opacity: 0, y: '20vh', scale: 1.8 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute text-4xl select-none"
            >
              {r.emoji}
            </motion.div>
          ))}
        </div>

        {/* Desktop Prev Button */}
        <button
          onClick={handlePrevSlide}
          disabled={activeIndex === 0 && slideIndex === 0}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none z-30"
          aria-label="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Desktop Next Button */}
        <button
          onClick={handleNextSlide}
          disabled={activeIndex === stories.length - 1 && slideIndex === slides.length - 1}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none z-30"
          aria-label="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Story Card Container */}
        <div
          className="relative w-full h-full md:h-[92vh] md:max-w-md md:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border md:border-white/10 select-none"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Top Progress Bars */}
          <div className="absolute top-0 inset-x-0 p-3 pt-4 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex gap-1.5 mb-2.5">
              {slides.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{
                      width:
                        idx < slideIndex
                          ? '100%'
                          : idx === slideIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" fallback={currentStory.author.avatar} className="ring-2 ring-primary/80" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-semibold truncate">
                      {currentStory.author.displayName}
                    </span>
                    <span className="text-white/60 text-[10px]">@{currentStory.author.username}</span>
                  </div>
                  {currentSlide.tag && (
                    <span className="text-[10px] text-cyan-300 font-medium truncate flex items-center gap-1">
                      {currentSlide.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={closeStory}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                  aria-label="Close story"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Touch Area for Left / Right Navigation */}
          <div className="absolute inset-0 z-20 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
            />
            <div
              className="w-2/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
            />
          </div>

          {/* Slide Content Area */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {/* 1. Image Slide */}
            {currentSlide.type === 'image' && currentSlide.mediaUrl && (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={currentSlide.mediaUrl}
                  alt={currentSlide.caption || 'Story media'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />
              </div>
            )}

            {/* 2. Voice Drop Slide */}
            {currentSlide.type === 'voice' && (
              <div
                className={`relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br ${
                  currentSlide.gradient || 'from-indigo-950 via-slate-900 to-black'
                }`}
              >
                {/* Pulsating Orbit Rings */}
                <div className="relative mb-6">
                  <motion.div
                    className="w-28 h-28 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                        <Mic className="w-7 h-7 text-white animate-pulse" />
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Animated Waveform Bars */}
                <div className="flex items-center gap-1.5 h-12 mb-5">
                  {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 60, 35, 80, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-cyan-400 to-indigo-300 rounded-full"
                      animate={{
                        height: isPaused ? '20%' : [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8 + (i % 4) * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>

                {/* Voice Duration Counter */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-mono mb-4 border border-white/10">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>
                    00:{String(Math.floor((progress / 100) * slideDurationSec)).padStart(2, '0')} / 00:
                    {String(slideDurationSec).padStart(2, '0')}
                  </span>
                </div>

                {/* Content Quote */}
                {currentSlide.content && (
                  <blockquote className="text-white text-base md:text-lg font-serif italic max-w-xs leading-relaxed px-2">
                    {currentSlide.content}
                  </blockquote>
                )}
              </div>
            )}

            {/* 3. Midnight Drop Slide */}
            {currentSlide.type === 'midnight' && (
              <div
                className={`relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br ${
                  currentSlide.gradient || 'from-purple-950 via-indigo-950 to-black'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mb-6 text-purple-300">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>

                <p className="text-white text-lg md:text-xl font-medium tracking-wide leading-relaxed font-serif max-w-xs">
                  "{currentSlide.content}"
                </p>

                <div className="mt-8 flex items-center gap-2 text-xs text-purple-300/80 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-400/20">
                  <Sparkles className="w-3 h-3" />
                  <span>Unfiltered Midnight Confession</span>
                </div>
              </div>
            )}

            {/* Caption & Location (Bottom overlay for all types) */}
            {currentSlide.caption && currentSlide.type !== 'voice' && (
              <div className="absolute bottom-24 inset-x-0 p-4 text-center z-25 pointer-events-none">
                <p className="text-white text-xs md:text-sm font-medium drop-shadow-md bg-black/40 backdrop-blur-md inline-block px-4 py-2 rounded-2xl border border-white/10 max-w-xs">
                  {currentSlide.caption}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Interactive Whisper & Floating Reactions Bar */}
          <div
            className="relative z-30 p-3 pb-4 bg-gradient-to-t from-black via-black/90 to-transparent space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Emoji Reaction Pill Buttons */}
            <div className="flex items-center justify-around px-2">
              {['❤️', '🔥', '🥺', '🌙', '🥂', '⚡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiReaction(emoji)}
                  className="text-xl p-1.5 hover:scale-125 active:scale-95 transition-transform"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Whisper to Stranger Input */}
            <form onSubmit={handleSendWhisper} className="flex items-center gap-2">
              <input
                type="text"
                value={whisperText}
                onChange={(e) => setWhisperText(e.target.value)}
                placeholder={`Whisper to ${currentStory.author.displayName.split(' ')[0]}... 🤫`}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-primary backdrop-blur-md"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!whisperText.trim()}
                className="rounded-full bg-primary hover:bg-primary/90 text-white h-8 px-3 text-xs gap-1 shadow-md"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>

            {/* Success Toast */}
            <AnimatePresence>
              {showWhisperSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="bg-emerald-500/90 text-white text-[11px] font-medium py-1.5 px-3 rounded-full text-center flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Whisper delivered to {currentStory.author.displayName}'s inbox!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
