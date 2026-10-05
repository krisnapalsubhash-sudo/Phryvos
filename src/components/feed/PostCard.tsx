/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  CheckCircle2,
  Send,
  Play,
  Pause,
  Volume2,
  Mic,
  Moon,
  Clock,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Ghost
} from 'lucide-react';
import { usePostsStore } from '@/store/posts';
import { useAuthStore } from '@/store/auth';
import { useFeaturesStore } from '@/store/features';
import type { Post } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sound } from '@/lib/sound';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { toggleLike } = usePostsStore();
  const { user: authUser } = useAuthStore();
  const currentUser = authUser;
  const { flags } = useFeaturesStore();
  const isMinimalist = flags.minimalistMode;

  const [liked, setLiked] = useState(post.isLiked);
  const [bookmarked, setBookmarked] = useState(post.isSaved || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [showWhisperBox, setShowWhisperBox] = useState(false);
  const [whisperDraft, setWhisperDraft] = useState('');
  const [whisperSentNotice, setWhisperSentNotice] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopyNotice, setShowCopyNotice] = useState(false);

  // Double-tap heart animation state
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Audio player state for Voice Drops
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioDuration = post.audioDuration || 20;
  const synthAudioRef = useRef<(() => void) | null>(null);

  const startSynthTone = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
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
          }, 100);
        } catch {}
      };
    } catch {}
  }, []);

  const stopSynthTone = useCallback(() => {
    if (synthAudioRef.current) {
      synthAudioRef.current();
      synthAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      startSynthTone();
      interval = setInterval(() => {
        setAudioCurrentTime((prev) => {
          if (prev >= audioDuration) {
            setIsPlayingAudio(false);
            stopSynthTone();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      stopSynthTone();
    }
    return () => {
      clearInterval(interval);
      stopSynthTone();
    };
  }, [isPlayingAudio, audioDuration, startSynthTone, stopSynthTone]);

  const toggleAudioPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlayingAudio) {
      setIsPlayingAudio(true);
      sound.playPop(540);
    } else {
      setIsPlayingAudio(false);
      sound.playPop(340);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap registered!
      setShowDoubleTapHeart(true);
      sound.playHeart();
      if (!liked) {
        setLiked(true);
        setLikeCount((c) => c + 1);
        toggleLike(post.id);
      }
      setTimeout(() => setShowDoubleTapHeart(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const willLike = !liked;
    setLiked(willLike);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    toggleLike(post.id);
    if (willLike) {
      sound.playHeart();
    } else {
      sound.playPop(300);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    sound.playPop(next ? 540 : 320);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentsList((prev) => [...prev, commentText.trim()]);
    setCommentText('');
    sound.playMessageSent();
  };

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperDraft.trim()) return;
    sound.playMessageSent();
    setWhisperSentNotice(true);
    setWhisperDraft('');
    setTimeout(() => {
      setWhisperSentNotice(false);
      setShowWhisperBox(false);
    }, 2400);
  };

  const handleShare = () => {
    sound.playPop(480);
    setShowCopyNotice(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://phryvos.in/post/${post.id}`).catch(() => {});
    }
    setTimeout(() => setShowCopyNotice(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleDoubleTap}
      className="relative bg-card border border-border/80 rounded-3xl mb-5 overflow-hidden shadow-xs hover:border-border transition-all select-none group"
    >
      {/* Explosive Double-Tap Heart Overlay */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.6)]" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="w-12 h-12 text-amber-300" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            {post.isAnonymous ? (
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-lg">
                🎭
              </div>
            ) : (
              <>
                <Avatar size="md" fallback={post.author.avatar} className="ring-2 ring-border/50" />
                {post.author.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                {post.isAnonymous ? 'Anonymous Stranger' : post.author.displayName}
              </span>
              {!post.isAnonymous && <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />}
              <span className="text-xs text-muted-foreground">
                {post.isAnonymous ? '@stranger' : `@${post.author.username}`}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <time className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</time>
            </div>

            {/* Vibe / Format Tag Badge */}
            <div className="flex items-center gap-2 mt-0.5">
              {post.vibe && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {post.vibe}
                </span>
              )}
              {post.readingTime && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{post.readingTime}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="btn-icon w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground" aria-label="More options">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Format: MIDNIGHT DROP (Dark gradient typography card) */}
      {!isMinimalist && flags.midnightDrops && post.format === 'midnight' && (
        <div
          className={`mx-4 mb-3 p-6 rounded-2xl bg-gradient-to-br ${
            post.midnightGradient || 'from-purple-950 via-slate-900 to-indigo-950'
          } border border-purple-500/20 shadow-inner relative overflow-hidden`}
        >
          <div className="flex items-center justify-between text-xs text-purple-300/80 mb-3">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Midnight Reflection</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">Unfiltered</span>
          </div>

          <p className="text-white text-base md:text-lg font-serif italic leading-relaxed py-1">
            "{post.content}"
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags?.map((t) => (
              <span key={t} className="text-[10px] text-purple-300/60 font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Format: VOICE DROP (Interactive Waveform Player Card) */}
      {!isMinimalist && flags.voiceDrops && post.format === 'voice' && (
        <div className="px-5 pb-3">
          <p className="text-sm leading-relaxed text-foreground mb-3">{post.content}</p>

          <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={toggleAudioPlay}
                aria-label={isPlayingAudio ? 'Pause voice drop' : 'Play voice drop'}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Waveform Equalizer */}
              <div className="flex-1 flex items-center gap-1 h-10 px-1 overflow-hidden">
                {(post.voiceWaveform || [40, 60, 80, 50, 90, 70, 40, 85, 95, 60, 30, 75, 50, 90, 65, 45, 80]).map((h, i) => {
                  const percentActive = (audioCurrentTime / audioDuration) * 100;
                  const barPercent = (i / (post.voiceWaveform?.length || 17)) * 100;
                  const isPassed = barPercent <= percentActive;

                  return (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full transition-colors ${
                        isPassed ? 'bg-cyan-500' : 'bg-muted-foreground/30'
                      }`}
                      style={{ height: `${h}%` }}
                      animate={
                        isPlayingAudio
                          ? {
                              scaleY: [1, 1.3, 0.8, 1],
                            }
                          : { scaleY: 1 }
                      }
                      transition={{
                        repeat: isPlayingAudio ? Infinity : 0,
                        duration: 0.6 + (i % 3) * 0.2,
                      }}
                    />
                  );
                })}
              </div>

              {/* Time display */}
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {formatSeconds(audioCurrentTime)} / {formatSeconds(audioDuration)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-500" />
                <span>Audio drop recorded with ambient sound</span>
              </span>
              <span className="text-[10px] text-cyan-500 font-medium">Headphones recommended 🎧</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Format: RAW STORY (Memoirs & Stranger Encounters) */}
      {!isMinimalist && post.format === 'raw' && (
        <div className="px-5 pb-3">
          <div className="relative">
            <p
              className={`text-sm leading-relaxed text-foreground whitespace-pre-line ${
                !isExpanded ? 'line-clamp-4' : ''
              }`}
            >
              {post.content}
            </p>

            {/* Read full / Show less button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
                sound.playPop(420);
              }}
              className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{isExpanded ? 'Show less' : 'Read full memoir...'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags?.map((tag) => (
              <span key={tag} className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Format: STANDARD POST OR FALLBACK */}
      {(isMinimalist ||
        !post.format ||
        post.format === 'standard' ||
        (!flags.midnightDrops && post.format === 'midnight') ||
        (!flags.voiceDrops && post.format === 'voice')) && (
        <>
          <div className="px-5 pb-3">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{post.content}</p>
          </div>

          {post.image && (
            <div className="relative aspect-[16/10] overflow-hidden bg-secondary/40 border-y border-border/60">
              <img
                src={post.image}
                alt="Post media"
                className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
        </>
      )}

      {/* Interactions Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            onClick={handleLike}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-xl hover:bg-secondary/60 transition-colors ${
              liked ? 'text-rose-500 font-semibold' : 'hover:text-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform active:scale-125 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{formatNumber(likeCount)}</span>
          </button>

          {/* Comments Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
              sound.playPop(400);
            }}
            aria-label={`Comments (${post.comments + commentsList.length})`}
            className="flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-xl hover:bg-secondary/60 hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{formatNumber(post.comments + commentsList.length)}</span>
          </button>

          {/* Whisper to Author Button (🤫) */}
          {!isMinimalist && flags.whisperToStranger && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWhisperBox(!showWhisperBox);
                sound.playPop(460);
              }}
              aria-label="Send private whisper to author"
              className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-xl transition-all ${
                showWhisperBox
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'hover:bg-secondary/60 hover:text-purple-400 text-muted-foreground'
              }`}
              title="Send private whisper to author"
            >
              <span>🤫</span>
              <span className="hidden sm:inline">Whisper</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            aria-label="Share post"
            className="flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-xl hover:bg-secondary/60 hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`py-1 px-2.5 rounded-xl hover:bg-secondary/60 transition-colors ${
            bookmarked ? 'text-primary' : 'hover:text-foreground'
          }`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>

      {/* Copy link feedback notice */}
      <AnimatePresence>
        {showCopyNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/10 text-primary text-xs py-1.5 px-4 text-center font-medium border-t border-primary/20"
          >
            ✨ Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret Whisper to Author Drawer */}
      <AnimatePresence>
        {showWhisperBox && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-purple-500/30 bg-purple-950/20 px-5 py-3 space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
              <span className="flex items-center gap-1">
                <span>🤫 Secret Whisper to</span>
                <span className="font-bold underline">{post.isAnonymous ? 'Anonymous Stranger' : post.author.displayName}</span>
              </span>
              <span className="text-[10px] text-purple-400/80">Only they will see this in DM</span>
            </div>

            <form onSubmit={handleSendWhisper} className="flex items-center gap-2">
              <Input
                type="text"
                value={whisperDraft}
                onChange={(e) => setWhisperDraft(e.target.value)}
                placeholder="What touched you about this story? Write softly..."
                className="h-9 text-xs rounded-xl bg-card border-purple-500/40 focus:ring-1 focus:ring-purple-400 placeholder:text-muted-foreground/60"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!whisperDraft.trim()}
                className="h-9 rounded-xl px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 shadow-sm shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Whisper</span>
              </Button>
            </form>

            {whisperSentNotice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-emerald-400 font-medium text-center py-1 flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Whisper secretly delivered into author's inbox!</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/60 bg-secondary/20 px-5 py-3.5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {commentsList.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs">
                <Avatar size="xs" fallback={currentUser?.avatar || '😊'} />
                <div className="bg-card border border-border/70 rounded-xl px-3.5 py-2 flex-1 shadow-xs">
                  <span className="font-semibold text-foreground mr-1.5">{currentUser?.displayName || 'You'}</span>
                  <span className="text-muted-foreground">{c}</span>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <Input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thought with this stranger..."
                className="h-9 text-xs rounded-xl bg-card border-border/70 focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim()}
                className="h-9 rounded-xl px-3.5 bg-primary text-white text-xs gap-1 shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Reply</span>
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
