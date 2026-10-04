'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles, CheckCircle2, RotateCcw, Lightbulb } from 'lucide-react';
import { sound } from '@/lib/sound';

interface WordMysteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
}

const MYSTERY_WORDS = [
  { word: 'COFFEE', category: 'Drink / Daily Habit', hint: 'Keeps people awake, smells heavenly.' },
  { word: 'GUITAR', category: 'Music Instrument', hint: 'Has 6 strings and tells acoustic stories.' },
  { word: 'AURORA', category: 'Natural Wonder', hint: 'Dancing emerald lights in the polar sky.' },
  { word: 'PIZZA', category: 'Universal Food', hint: 'Round, warm, cheesy, and universally loved.' },
  { word: 'SUNSET', category: 'Everyday Magic', hint: 'Golden hour when day kisses the night.' },
  { word: 'HEADPHONES', category: 'Tech Gadget', hint: 'Worn over ears to tune out the world.' },
  { word: 'PASSPORT', category: 'Travel Essential', hint: 'Small booklet that opens global borders.' },
  { word: 'MOONLIGHT', category: 'Night Sky', hint: 'Gentle silver glow on a quiet midnight walk.' },
];

export function WordMysteryModal({ isOpen, onClose, partnerName }: WordMysteryModalProps) {
  const [currentRound, setCurrentRound] = useState(() => Math.floor(Math.random() * MYSTERY_WORDS.length));
  const [showHint, setShowHint] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(20);

  if (!isOpen) return null;

  const currentSecret = MYSTERY_WORDS[currentRound];

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGuess.trim() || isRevealed) return;

    if (userGuess.trim().toUpperCase() === currentSecret.word) {
      sound.playWinFanfare();
      setIsCorrect(true);
      setIsRevealed(true);
    } else {
      sound.playPop(300);
      setQuestionsLeft((prev) => Math.max(0, prev - 1));
      setUserGuess('');
    }
  };

  const handleNextWord = () => {
    sound.playPop(440);
    setCurrentRound((prev) => (prev + 1) % MYSTERY_WORDS.length);
    setShowHint(false);
    setUserGuess('');
    setIsRevealed(false);
    setIsCorrect(false);
    setQuestionsLeft(20);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative w-full max-w-xs sm:max-w-sm bg-card border border-border/80 rounded-3xl p-5 shadow-2xl z-10 overflow-hidden flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">20 Questions: Guess The Word</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Badge & Remaining Guesses */}
          <div className="w-full flex items-center justify-between py-2 px-3 my-3 rounded-2xl bg-secondary/40 border border-border/40 text-xs">
            <span className="text-muted-foreground">
              Category: <strong className="text-foreground">{currentSecret.category}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              {questionsLeft} Guesses Left
            </span>
          </div>

          {/* Secret Word Display Area */}
          <div className="w-full py-6 px-4 rounded-2xl bg-background border border-border/80 text-center my-1 flex flex-col items-center justify-center min-h-[110px]">
            {isRevealed ? (
              <div className="space-y-1 animate-in zoom-in-95">
                <span className="text-2xl sm:text-3xl font-black text-primary tracking-widest">
                  {currentSecret.word}
                </span>
                <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Word Solved with {partnerName}!
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 tracking-widest text-2xl font-mono font-bold text-muted-foreground">
                {currentSecret.word.split('').map((_, i) => (
                  <span
                    key={i}
                    className="w-7 h-9 rounded-md bg-secondary/70 border border-border/60 flex items-center justify-center text-foreground"
                  >
                    _
                  </span>
                ))}
              </div>
            )}

            {/* Hint reveal */}
            {showHint && !isRevealed && (
              <p className="text-xs text-amber-400/90 italic mt-3 animate-in fade-in flex items-center gap-1.5 px-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{currentSecret.hint}</span>
              </p>
            )}
          </div>

          {/* Action Row: Hint & Reveal */}
          {!isRevealed && (
            <div className="w-full flex items-center justify-between py-2">
              <button
                type="button"
                onClick={() => {
                  sound.playPop(520);
                  setShowHint(true);
                }}
                disabled={showHint}
                className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hint Active' : 'Reveal Clue / Hint'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop(340);
                  setIsRevealed(true);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Give up & show word
              </button>
            </div>
          )}

          {/* Guess Input Form */}
          {!isRevealed ? (
            <form onSubmit={handleGuessSubmit} className="w-full flex items-center gap-2 mt-2">
              <input
                type="text"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                placeholder="Type your guess..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-secondary/60 border border-border/60 focus:border-primary/50 text-xs sm:text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!userGuess.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs disabled:opacity-40 transition-all active:scale-95"
              >
                Guess
              </button>
            </form>
          ) : (
            <button
              onClick={handleNextWord}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 mt-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Next Word Mystery</span>
            </button>
          )}

          {/* Footer note */}
          <div className="w-full flex items-center justify-between pt-3 mt-2 border-t border-border/40 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Ask yes/no in chat to solve!
            </span>
            <span>Word #{currentRound + 1}/{MYSTERY_WORDS.length}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
