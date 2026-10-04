'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Check, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sound';

export function DilemmaCard() {
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [stats, setStats] = useState({
    votesA: 2680,
    votesB: 1240,
  });

  const optionA = 'Be able to read unfiltered thoughts of any stranger for 24 hours 🧠';
  const optionB = 'Teleport anywhere on Earth instantly, but you can only stay for 10 minutes ⚡';

  const total = stats.votesA + stats.votesB + (selectedChoice ? 1 : 0);
  const pctA = Math.round(((stats.votesA + (selectedChoice === 'A' ? 1 : 0)) / total) * 100);
  const pctB = 100 - pctA;

  const handleVote = (choice: 'A' | 'B') => {
    if (selectedChoice) return;
    sound.playMatchChord();
    setSelectedChoice(choice);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-500/15 via-zinc-950 to-card border border-indigo-500/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-1.5">
              <span>Live Social Dilemma: Would You Rather?</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                Poll
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Vote to see how other wandering minds think.
            </p>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{total.toLocaleString()} votes</span>
        </span>
      </div>

      {/* Dilemma Choice Options */}
      <div className="space-y-3 pt-1">
        {/* Option A */}
        <button
          onClick={() => handleVote('A')}
          className={`w-full text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
            selectedChoice === 'A'
              ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/30'
              : 'border-border/80 bg-secondary/50 hover:bg-secondary/80'
          }`}
        >
          {selectedChoice && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 bg-indigo-500/20 -z-0"
            />
          )}

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/30 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                A
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{optionA}</span>
            </div>

            {selectedChoice && (
              <span className="text-sm font-black text-indigo-400 shrink-0">
                {pctA}%
              </span>
            )}
          </div>
        </button>

        {/* Option B */}
        <button
          onClick={() => handleVote('B')}
          className={`w-full text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
            selectedChoice === 'B'
              ? 'border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-500/30'
              : 'border-border/80 bg-secondary/50 hover:bg-secondary/80'
          }`}
        >
          {selectedChoice && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 bg-cyan-500/20 -z-0"
            />
          )}

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/30 text-cyan-300 text-xs font-black flex items-center justify-center shrink-0">
                B
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{optionB}</span>
            </div>

            {selectedChoice && (
              <span className="text-sm font-black text-cyan-400 shrink-0">
                {pctB}%
              </span>
            )}
          </div>
        </button>
      </div>

      {selectedChoice && (
        <p className="text-[11px] text-muted-foreground text-center font-medium">
          {selectedChoice === 'A' ? (
            <span>You voted with the majority (🧠 Mind Readers Squad)!</span>
          ) : (
            <span>You voted with the free-spirited explorers (⚡ Instant Teleporters)!</span>
          )}
        </p>
      )}
    </div>
  );
}
