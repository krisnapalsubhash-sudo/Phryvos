'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RotateCcw, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { sound } from '@/lib/sound';

const PROMPTS = [
  { type: 'truth', text: 'What is the biggest lie you ever told to get out of hanging out with someone?' },
  { type: 'dare', text: 'Voice note challenge: Describe your day in the voice of an animated cartoon villain.' },
  { type: 'truth', text: 'What is one secret dream you have never told anyone because you thought they’d laugh?' },
  { type: 'dare', text: 'Send an anonymous compliment to the 3rd person in your radar right now.' },
  { type: 'truth', text: 'Have you ever stalked someone online and accidentally liked a photo from 4 years ago?' },
  { type: 'dare', text: 'Change your status bio to "Practicing telepathy with strangers" for 10 minutes.' },
  { type: 'truth', text: 'If you had to trade lives with one person you know in real life, who would it be?' },
];

export function TruthOrDareCard() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const spinBottle = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsSubmitted(false);
    setUserAnswer('');

    // Play ratchet clicks
    sound.playSpinTick();
    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, 120);

    const randomExtraRotations = 1080 + Math.floor(Math.random() * 720);
    const nextRot = rotation + randomExtraRotations;
    setRotation(nextRot);

    setTimeout(() => {
      clearInterval(tickInterval);
      sound.playMatchChord();
      setIsSpinning(false);
      const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      setCurrentPrompt(randomPrompt);
    }, 1400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    sound.playWinFanfare();
    setIsSubmitted(true);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-rose-500/15 via-zinc-950 to-card border border-rose-500/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-lg">
            🔥
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-1.5">
              <span>Spin the Bottle: Truth or Dare</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                Spicy
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Spin to unlock wild, confidential confessions with strangers.
            </p>
          </div>
        </div>

        <button
          onClick={spinBottle}
          disabled={isSpinning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>Spin 🍾</span>
        </button>
      </div>

      {/* Bottle Animation Stage */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-5xl select-none cursor-pointer filter drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
          onClick={spinBottle}
        >
          🍾
        </motion.div>
        <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
          {isSpinning ? 'Bottle is spinning...' : 'Click bottle or Spin button'}
        </span>
      </div>

      {/* Result Card */}
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              currentPrompt.type === 'truth'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {currentPrompt.type}
          </span>
          <span className="text-[11px] text-muted-foreground">Confidential Prompt:</span>
        </div>

        <p className="text-sm font-bold text-foreground leading-snug">
          &ldquo;{currentPrompt.text}&rdquo;
        </p>

        {isSubmitted ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Anonymous confession recorded into the Secret Chamber! 🎉</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Drop your anonymous truth or reaction here..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-card border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
