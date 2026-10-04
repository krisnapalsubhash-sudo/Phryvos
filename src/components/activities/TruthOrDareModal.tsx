'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, RotateCcw, Send, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';
import { sound } from '@/lib/sound';

interface TruthOrDareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPTS = [
  { type: 'truth', text: 'What is the biggest lie you ever told to get out of hanging out with someone?' },
  { type: 'dare', text: 'Voice note challenge: Describe your day in the voice of an animated cartoon villain.' },
  { type: 'truth', text: 'What is one secret dream you have never told anyone because you thought they’d laugh?' },
  { type: 'dare', text: 'Send an anonymous compliment to a stranger in your radar right now.' },
  { type: 'truth', text: 'Have you ever stalked someone online and accidentally liked a photo from 3 years ago?' },
  { type: 'dare', text: 'Change your status bio to "Practicing telepathy with strangers" for 10 minutes.' },
  { type: 'truth', text: 'If you had to trade lives with one person you know in real life, who would it be?' },
  { type: 'truth', text: 'What is something you pretend to dislike just because everyone else hates it?' },
];

export function TruthOrDareModal({ isOpen, onClose }: TruthOrDareModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [communityConfessions, setCommunityConfessions] = useState([
    { id: 1, text: 'I told my friend I had food poisoning just so I could stay home and eat pizza alone.', user: 'Ghost in Delhi', time: '12m ago' },
    { id: 2, text: 'I still listen to teenage pop songs with noise-canceling headphones so my roommates don’t hear.', user: 'Wanderer in Tokyo', time: '45m ago' },
  ]);

  if (!isOpen) return null;

  const spinBottle = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsSubmitted(false);
    setUserAnswer('');

    sound.playSpinTick();
    const interval = setInterval(() => {
      sound.playSpinTick();
    }, 120);

    const randomRotations = 1080 + Math.floor(Math.random() * 720);
    const nextRot = rotation + randomRotations;
    setRotation(nextRot);

    setTimeout(() => {
      clearInterval(interval);
      sound.playMatchChord();
      setIsSpinning(false);
      const nextPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      setCurrentPrompt(nextPrompt);
    }, 1300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    sound.playWinFanfare();
    setIsSubmitted(true);
    setCommunityConfessions((prev) => [
      { id: Date.now(), text: userAnswer.trim(), user: 'You (Anonymous)', time: 'Just now' },
      ...prev,
    ]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop(340);
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-rose-500/40 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.25)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xl">
                🔥
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Truth or Dare & Confessions</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                    Spicy
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Spin the bottle & reveal unfiltered truths.</p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop(340);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Bottle Spinner Stage */}
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 1.3, ease: [0.2, 0.8, 0.2, 1] }}
                onClick={spinBottle}
                className="text-6xl select-none cursor-pointer filter drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] hover:scale-110 active:scale-95 transition-transform"
              >
                🍾
              </motion.div>

              <button
                onClick={spinBottle}
                disabled={isSpinning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all disabled:opacity-60"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Spinning Bottle...' : 'Spin the Bottle 🍾'}</span>
              </button>
            </div>

            {/* Prompt Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    currentPrompt.type === 'truth'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentPrompt.type}
                </span>
                <span className="text-[11px] text-zinc-500 font-semibold">100% Anonymous</span>
              </div>

              <p className="text-sm font-bold text-white leading-snug">
                &ldquo;{currentPrompt.text}&rdquo;
              </p>

              {isSubmitted ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confession posted anonymously! 🎉</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Drop your anonymous truth here..."
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={!userAnswer.trim()}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </form>
              )}
            </div>

            {/* Community Stream */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Live Stranger Confessions:</span>
              </h4>

              <div className="space-y-2">
                {communityConfessions.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
                    <p className="text-xs text-zinc-300 font-medium">&ldquo;{c.text}&rdquo;</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{c.user}</span>
                      <span>{c.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
