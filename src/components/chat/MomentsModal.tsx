'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Flame, Clock, Heart, MessageSquare, ArrowRight, Zap, Trophy } from 'lucide-react';
import { sound } from '@/lib/sound';

interface MomentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat?: (username: string) => void;
}

interface MomentItem {
  id: string;
  type: 'encounter' | 'streak' | 'milestone' | 'reconnect';
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  title: string;
  description: string;
  tag?: string;
  timeAgo: string;
  badge?: string;
  badgeColor?: string;
}

const MOCK_MOMENTS: MomentItem[] = [
  {
    id: 'm1',
    type: 'encounter',
    user: { name: 'Sarah', username: 'sarah.travels', avatar: '🌸' },
    title: 'Radar Encounter',
    description: 'You had a 45-minute late night conversation under #Music. A true connection was formed!',
    tag: '#Music',
    timeAgo: 'Yesterday',
    badge: 'Deep Conversation 💫',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    id: 'm2',
    type: 'streak',
    user: { name: 'Kenji', username: 'kenji.dev', avatar: '⚡' },
    title: '7-Day Connection Streak',
    description: 'You and Kenji have talked every day this week. You unlocked the "Inner Circle" badge!',
    tag: '#Coding',
    timeAgo: '2 days ago',
    badge: '🔥 7-Day Streak',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'm3',
    type: 'milestone',
    user: { name: 'Priya', username: 'priya.codes', avatar: '💻' },
    title: 'Top Vibe Partner',
    description: 'You both share 85% taste in Sci-Fi movies and Tech. Spent over 3.5 hours chatting.',
    tag: '#Tech',
    timeAgo: '4 days ago',
    badge: 'Twin Frequency ✨',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 'm4',
    type: 'reconnect',
    user: { name: 'Alex', username: 'alex.games', avatar: '🔥' },
    title: 'Spark Fade Alert',
    description: 'You and Alex had great energy during a gaming match 5 days ago. Say hello again?',
    tag: '#Gaming',
    timeAgo: '5 days ago',
    badge: 'Reconnect 💬',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
];

export function MomentsModal({ isOpen, onClose, onSelectChat }: MomentsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop(340);
            onClose();
          }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 glass-panel">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
                  <span>Connection Moments</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                    Echoes
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Where strangers become stories · Your relationship timeline
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop(340);
                onClose();
              }}
              className="btn-icon rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Moments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-border/20">
            {MOCK_MOMENTS.map((item) => (
              <div
                key={item.id}
                className="pt-3.5 first:pt-0 group hover:bg-secondary/30 -mx-2 px-3 py-2.5 rounded-2xl transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-2xl border border-border shadow-xs">
                      {item.user.avatar}
                    </div>
                    {item.type === 'streak' && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white">
                        ⚡
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{item.user.name}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.timeAgo}</span>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed">{item.description}</p>

                    <div className="mt-2.5 flex items-center justify-between">
                      {item.tag && (
                        <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary/80 px-2 py-0.5 rounded-md">
                          {item.tag}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          sound.playPop(480);
                          onSelectChat?.(item.user.username);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors ml-auto group-hover:translate-x-0.5"
                      >
                        <span>Open Chat</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Quote */}
          <div className="p-3.5 bg-secondary/40 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground italic">
              « Every deep friendship started with a single conversation between two strangers. »
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
