'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Heart, Send, Sparkles, Flame, MessageCircle, Lock } from 'lucide-react';
import { sound } from '@/lib/sound';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnswerItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  timeAgo: string;
}

export function QuestionModal({ isOpen, onClose }: QuestionModalProps) {
  const [myAnswer, setMyAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnswerItem[]>([
    {
      id: 'a1',
      author: 'Wanderer from Berlin',
      avatar: '🦊',
      text: 'I secretly wish I could pack one suitcase, sell everything, and open a tiny book café in rural Kyoto.',
      likes: 42,
      timeAgo: '1h ago',
    },
    {
      id: 'a2',
      author: 'Night Owl in Mumbai',
      avatar: '🌙',
      text: 'That I actually care way too much about what people think, even though I pretend not to care at all.',
      likes: 89,
      timeAgo: '3h ago',
    },
    {
      id: 'a3',
      author: 'Coder in Tokyo',
      avatar: '💻',
      text: 'I write letters to people that I never end up sending. There are over 50 unsent drafts in my notes app.',
      likes: 67,
      timeAgo: '5h ago',
    },
  ]);

  if (!isOpen) return null;

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    sound.playMatchChord();
    const newEntry: AnswerItem = {
      id: Date.now().toString(),
      author: 'You (Anonymous Stranger)',
      avatar: '✨',
      text: myAnswer.trim(),
      likes: 1,
      isLiked: true,
      timeAgo: 'Just now',
    };

    setAnswers([newEntry, ...answers]);
    setMyAnswer('');
    setSubmitted(true);
  };

  const handleLike = (id: string) => {
    sound.playHeart();
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, likes: a.isLiked ? a.likes - 1 : a.likes + 1, isLiked: !a.isLiked }
          : a
      )
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
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-lg border border-cyan-500/20 shadow-xs">
                ❓
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <span>Question Chamber</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                    Daily Dilemma
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">Anonymous thoughts from strangers worldwide</p>
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

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Featured Question of the Day */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-primary/30 text-center space-y-2 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Today&apos;s Deep Question
              </span>
              <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
                « What is a secret dream or thought you have never told your real-life friends? »
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Your answer is 100% anonymous · Speak without judgment
              </p>
            </div>

            {/* Answer Input Box */}
            <form onSubmit={handleSubmitAnswer} className="space-y-2">
              <div className="relative">
                <textarea
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  placeholder="Write your raw, anonymous thought here..."
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-secondary/60 hover:bg-secondary/80 focus:bg-background border border-border/70 focus:border-primary/50 text-xs sm:text-sm text-foreground outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Posted as Anonymous Stranger</span>
                </span>

                <button
                  type="submit"
                  disabled={!myAnswer.trim()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Drop Thought</span>
                </button>
              </div>
            </form>

            {/* Feed of Strangers' Answers */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thoughts from the Cosmos ({answers.length})
              </h4>

              {answers.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 hover:border-border transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.avatar}</span>
                      <span className="font-semibold text-foreground">{item.author}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.timeAgo}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif italic">
                    « {item.text} »
                  </p>

                  <div className="flex items-center justify-between pt-1">
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
                      onClick={() => sound.playPop(480)}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      Reply to Stranger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
