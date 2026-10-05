'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Smile,
  Sparkles,
  Send,
  Flame,
  Clock,
  Mic,
  Moon,
  BookOpen,
  Ghost,
  Radio,
  Filter,
  Check,
  Compass,
  Feather,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePostsStore } from '@/store/posts';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import { useFeaturesStore } from '@/store/features';
import { CURRENT_USER } from '@/lib/mock';
import { PostCard } from '@/components/feed/PostCard';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { Button } from '@/components/ui/button';

const StoryViewerModal = dynamic(
  () => import('@/components/feed/StoryViewerModal').then((m) => m.StoryViewerModal),
  { ssr: false }
);
import { Avatar } from '@/components/ui/avatar';
import { sound } from '@/lib/sound';
import type { Post, PostFormat } from '@/types';

type FeedFilter = 'all' | 'raw' | 'voice' | 'midnight';

const VIBE_OPTIONS = [
  '💭 Midnight Epiphany',
  '🚅 Stranger Encounter',
  '🌧️ Rainy Reflection',
  '☕ Casual Chit-Chat',
  '🎨 Creative Journal',
  '🧭 Life Dilemma',
];

const GRADIENT_PRESETS = [
  { name: 'Velvet Violet', class: 'from-purple-950 via-slate-900 to-indigo-950' },
  { name: 'Midnight Nebula', class: 'from-indigo-950 via-slate-900 to-black' },
  { name: 'Cyber Cyan', class: 'from-cyan-950 via-slate-900 to-black' },
  { name: 'Obsidian Flame', class: 'from-amber-950 via-rose-950 to-black' },
];

export default function FeedPage() {
  const posts = usePostsStore((state) => state.posts);
  const addPost = usePostsStore((state) => state.addPost);
  const { user } = useAuthStore();
  const currentUser = user || CURRENT_USER;
  const { flags } = useFeaturesStore();

  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  // Composer states
  const [composerFormat, setComposerFormat] = useState<PostFormat>('standard');
  const [postDraft, setPostDraft] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(VIBE_OPTIONS[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);

  // Voice recording state in composer
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordedDuration((prev) => {
          if (prev >= 15) {
            setIsRecordingVoice(false);
            sound.playPop(300);
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setRecordedDuration(0);
      setIsRecordingVoice(true);
      sound.playPop(520);
    } else {
      setIsRecordingVoice(false);
      sound.playPop(380);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postDraft.trim()) return;

    let readingTime = '1 min read';
    if (composerFormat === 'raw') {
      const words = postDraft.trim().split(/\s+/).length;
      readingTime = `${Math.max(1, Math.ceil(words / 120))} min read`;
    }

    const effectiveFormat = flags.minimalistMode ? 'standard' : composerFormat;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: isAnonymous && !flags.minimalistMode
        ? {
            id: `anon-${Date.now()}`,
            username: 'stranger',
            displayName: 'Anonymous Stranger',
            bio: 'Just passing through',
            avatar: '🎭',
            interests: ['Secret thoughts'],
            location: 'Somewhere in the dark',
            followers: 0,
            following: 0,
            postsCount: 1,
            isConnected: false,
            isOnline: true,
            createdAt: new Date().toISOString(),
          }
        : currentUser,
      content: postDraft.trim(),
      format: effectiveFormat,
      likes: 1,
      comments: 0,
      shares: 0,
      isLiked: true,
      isSaved: false,
      isAnonymous: !flags.minimalistMode && isAnonymous,
      vibe: selectedVibe,
      readingTime: effectiveFormat === 'raw' ? readingTime : undefined,
      audioDuration: effectiveFormat === 'voice' ? recordedDuration || 14 : undefined,
      voiceWaveform:
        effectiveFormat === 'voice'
          ? [35, 60, 85, 40, 75, 95, 65, 40, 80, 100, 70, 50, 85, 60, 40, 30]
          : undefined,
      midnightGradient: effectiveFormat === 'midnight' ? selectedGradient : undefined,
      tags: [selectedVibe.split(' ')[1] || '#Story', isAnonymous ? '#Anonymous' : '#Discovery'],
      createdAt: new Date().toISOString(),
    };

    addPost(newPost);
    sound.playMessageSent();
    setPostDraft('');
    setRecordedDuration(0);
    setIsRecordingVoice(false);
  };

  // Filter posts based on active filter and feature flags
  const filteredPosts = posts.filter((p) => {
    if (flags.minimalistMode) return true;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'raw') return p.format === 'raw';
    if (activeFilter === 'voice') return p.format === 'voice';
    if (activeFilter === 'midnight') return p.format === 'midnight';
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Minimalist Mode Notification Banner if Active */}
      {flags.minimalistMode && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
          <Feather className="w-3.5 h-3.5" />
          <span>Minimalist Pure Social Mode Active — Quiet, distraction-free feed</span>
          <Link href="/settings" className="underline hover:text-foreground font-semibold ml-1 flex items-center gap-0.5">
            <Settings className="w-3 h-3" />
            <span>Customize</span>
          </Link>
        </div>
      )}

      {/* Feed Filter Header (Only if not in Minimalist Mode) */}
      {!flags.minimalistMode && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 py-2.5 transition-all">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setActiveFilter('all');
                  sound.playPop(420);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                🌟 All Stories
              </button>

              <button
                onClick={() => {
                  setActiveFilter('raw');
                  sound.playPop(460);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeFilter === 'raw'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Raw Stories</span>
              </button>

              {flags.voiceDrops && (
                <button
                  onClick={() => {
                    setActiveFilter('voice');
                    sound.playPop(500);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                    activeFilter === 'voice'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voice Drops</span>
                </button>
              )}

              {flags.midnightDrops && (
                <button
                  onClick={() => {
                    setActiveFilter('midnight');
                    sound.playPop(540);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                    activeFilter === 'midnight'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Midnight Drops</span>
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Orbit</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5 pb-24">
        {/* 1. Stories Bar (Hidden in Minimalist Mode or if toggled off) */}
        {!flags.minimalistMode && flags.storiesAndFleeting && <StoriesBar />}

        {/* 2. Interactive Post Composer */}
        <div className="bg-card border border-border/80 rounded-3xl p-4 mb-6 shadow-xs transition-colors">
          {/* Format Selector Pills (Only if not in Minimalist Mode) */}
          {!flags.minimalistMode && (
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setComposerFormat('standard');
                    sound.playPop(380);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    composerFormat === 'standard' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  ✍️ Post
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComposerFormat('raw');
                    sound.playPop(420);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    composerFormat === 'raw' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  📖 Raw Story
                </button>

                {flags.voiceDrops && (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerFormat('voice');
                      sound.playPop(480);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      composerFormat === 'voice' ? 'bg-cyan-500/20 text-cyan-400 shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>Voice Drop</span>
                  </button>
                )}

                {flags.midnightDrops && (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerFormat('midnight');
                      sound.playPop(520);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      composerFormat === 'midnight' ? 'bg-purple-500/20 text-purple-400 shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Midnight</span>
                  </button>
                )}
              </div>

              {/* Anonymous Mode Switcher */}
              <button
                type="button"
                onClick={() => {
                  setIsAnonymous((prev) => !prev);
                  sound.playPop(isAnonymous ? 340 : 540);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
                  isAnonymous
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground'
                }`}
                title="Toggle Anonymous Mode"
              >
                <Ghost className="w-3.5 h-3.5" />
                <span>{isAnonymous ? '100% Anonymous' : 'Post as You'}</span>
              </button>
            </div>
          )}

          <div className="flex items-start gap-3">
            {isAnonymous && !flags.minimalistMode ? (
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                🎭
              </div>
            ) : (
              <Avatar size="md" fallback={currentUser.avatar} className="ring-2 ring-border/50 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {/* Textarea */}
              <textarea
                value={postDraft}
                onChange={(e) => setPostDraft(e.target.value)}
                placeholder={
                  flags.minimalistMode
                    ? 'Share a simple thought or update...'
                    : composerFormat === 'raw'
                    ? 'Write your unfiltered stranger encounter or personal memoir (2 min read)...'
                    : composerFormat === 'voice'
                    ? 'Describe your audio recording or ambient scenery...'
                    : composerFormat === 'midnight'
                    ? 'Type your 1-liner midnight thought or secret confession...'
                    : 'Share a story, discovery, or question with strangers...'
                }
                rows={composerFormat === 'raw' && !flags.minimalistMode ? 4 : 2}
                className="w-full bg-transparent border-0 resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />

              {/* Voice Recording Simulation Bar (Only in Voice Mode) */}
              {composerFormat === 'voice' && !flags.minimalistMode && (
                <div className="mt-2 p-3 rounded-2xl bg-secondary/30 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isRecordingVoice
                          ? 'bg-rose-500 text-white animate-pulse'
                          : recordedDuration > 0
                          ? 'bg-emerald-500 text-white'
                          : 'bg-cyan-600 text-white hover:bg-cyan-500'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-foreground font-medium">
                      {isRecordingVoice
                        ? `Recording 00:${String(recordedDuration).padStart(2, '0')} / 15s`
                        : recordedDuration > 0
                        ? `Audio ready (${recordedDuration}s)`
                        : 'Tap mic to record voice drop'}
                    </span>
                  </div>

                  {recordedDuration > 0 && (
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-mono">
                      Waveform Synthesized
                    </span>
                  )}
                </div>
              )}

              {/* Midnight Gradient Theme Selector (Only in Midnight Mode) */}
              {composerFormat === 'midnight' && !flags.minimalistMode && (
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-muted-foreground shrink-0">Theme:</span>
                  {GRADIENT_PRESETS.map((grad) => (
                    <button
                      key={grad.name}
                      type="button"
                      onClick={() => {
                        setSelectedGradient(grad.class);
                        sound.playPop(340);
                      }}
                      className={`h-6 px-2.5 rounded-lg bg-gradient-to-r ${grad.class} text-[10px] text-white flex items-center gap-1 border ${
                        selectedGradient === grad.class ? 'border-white ring-1 ring-white' : 'border-transparent'
                      }`}
                    >
                      {selectedGradient === grad.class && <Check className="w-2.5 h-2.5" />}
                      <span>{grad.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2 gap-2 flex-wrap">
                {/* Vibe Selector */}
                {!flags.minimalistMode && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedVibe}
                      onChange={(e) => setSelectedVibe(e.target.value)}
                      className="bg-secondary/50 text-foreground border border-border/60 rounded-xl px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {VIBE_OPTIONS.map((v) => (
                        <option key={v} value={v} className="bg-card text-foreground">
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit Post Button */}
                <Button
                  onClick={handleCreatePost}
                  disabled={!postDraft.trim()}
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs px-4 h-8 gap-1.5 shadow-xs ml-auto"
                >
                  <span>{flags.minimalistMode ? 'Post' : 'Share Story'}</span>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Posts Stream */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 px-4 bg-card/60 border border-border/70 rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">No stories in this orbit yet</h4>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                Be the first stranger to drop a story into the collective stream.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setComposerFormat('standard');
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="rounded-full bg-primary text-white text-xs px-4"
              >
                Drop First Story
              </Button>
            </div>
          )}
        </div>

        {/* Load More Indicator */}
        {filteredPosts.length > 0 && (
          <div className="text-center py-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sound.playPop(400)}
              className="rounded-full border-border/80 hover:bg-secondary text-foreground text-xs px-6 font-medium shadow-xs"
            >
              Catching up with recent orbits ✨
            </Button>
          </div>
        )}
      </main>

      {/* 4. Full-Screen Story Viewer Modal (Only when not in minimalist mode) */}
      {!flags.minimalistMode && flags.storiesAndFleeting && <StoryViewerModal />}
    </div>
  );
}
