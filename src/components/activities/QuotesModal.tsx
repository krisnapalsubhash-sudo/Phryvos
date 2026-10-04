'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Quote, Bookmark, Heart, Share2, Plus, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sound';

interface QuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuoteCard {
  id: string;
  quote: string;
  author: string;
  category: string;
  likes: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
}

export function QuotesModal({ isOpen, onClose }: QuotesModalProps) {
  const [quotes, setQuotes] = useState<QuoteCard[]>([
    {
      id: 'q1',
      quote: 'Nobody is really a stranger. We just haven’t heard each other’s stories yet.',
      author: 'Phryvos Community',
      category: 'Philosophy',
      likes: 124,
    },
    {
      id: 'q2',
      quote: 'A 10-minute midnight conversation with an unknown soul can heal what a month of silence couldn’t.',
      author: 'Stranger #4829',
      category: 'Connection',
      likes: 245,
    },
    {
      id: 'q3',
      quote: 'We cross paths with thousands of people every day, unaware that any one of them could change our lives forever.',
      author: 'Traveler in Berlin',
      category: 'Destiny',
      likes: 98,
    },
    {
      id: 'q4',
      quote: 'You do not need to be understood by everyone. You just need to be real with the ones who listen.',
      author: 'Night Owl in Kyoto',
      category: 'Self',
      likes: 182,
    },
  ]);

  if (!isOpen) return null;

  const handleLike = (id: string) => {
    sound.playHeart();
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, likes: q.isLiked ? q.likes - 1 : q.likes + 1, isLiked: !q.isLiked }
          : q
      )
    );
  };

  const handleBookmark = (id: string) => {
    sound.playPop(520);
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q))
    );
  };

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
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Dialog */}
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
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg border border-amber-500/20 shadow-xs">
                💬
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <span>Quotes & Micro-Stories</span>
                </h2>
                <p className="text-[11px] text-muted-foreground">Relatable lines and stranger wisdom</p>
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {quotes.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-secondary/30 hover:bg-secondary/50 border border-border/70 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.category}
                  </span>
                  <Quote className="w-5 h-5 text-primary/40" />
                </div>

                <p className="text-sm sm:text-base font-serif italic text-foreground leading-relaxed">
                  « {item.quote} »
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground font-semibold">
                    — {item.author}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        item.isLiked
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                          : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-rose-500' : ''}`}
                      />
                      <span>{item.likes}</span>
                    </button>

                    <button
                      onClick={() => handleBookmark(item.id)}
                      className={`btn-icon w-7 h-7 rounded-full ${
                        item.isBookmarked
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
