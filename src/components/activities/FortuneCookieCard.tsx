'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { sound } from '@/lib/sound';

const FORTUNES = [
  'A stranger whose username starts with the same letter as yours will have an unexpected insight for you tonight.',
  'Your next midnight conversation will cure a doubt you have carried for three weeks.',
  'The connection you are looking for is hiding inside a room you almost didn’t enter.',
  'Someone is currently smiling at a message you sent earlier today.',
  'An accidental encounter in the Solar Radar will become a story you tell for years.',
  'You do not need to explain yourself to everyone. Just talk to the one person who gets your humor.',
];

export function FortuneCookieCard() {
  const [isCracked, setIsCracked] = useState(false);
  const [fortune, setFortune] = useState(FORTUNES[0]);

  const crackCookie = () => {
    if (isCracked) return;
    sound.playWinFanfare();
    const random = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    setFortune(random);
    setIsCracked(true);
  };

  const resetCookie = () => {
    sound.playPop(440);
    setIsCracked(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-500/15 via-zinc-950 to-card border border-amber-500/30 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥠</span>
          <div>
            <h3 className="text-xs font-black text-foreground tracking-tight flex items-center gap-1.5">
              <span>Daily Cosmic Fortune</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400">
                Prophecy
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Crack open to reveal today&apos;s connection destiny.</p>
          </div>
        </div>

        {isCracked && (
          <button
            onClick={resetCookie}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
            aria-label="Crack another"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!isCracked ? (
        <div
          onClick={crackCookie}
          className="p-4 rounded-2xl bg-secondary/40 border border-border/80 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer transition-all flex items-center justify-center gap-3 group text-center"
        >
          <motion.span
            whileHover={{ scale: 1.2, rotate: [-5, 5, -5] }}
            className="text-3xl select-none"
          >
            🥠
          </motion.span>
          <div>
            <p className="text-xs font-black text-foreground group-hover:text-amber-400 transition-colors">
              Click to Crack Open Cookie
            </p>
            <p className="text-[10px] text-muted-foreground">Unseal your daily stranger prophecy</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-center"
        >
          <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today&apos;s Prophecy:</span>
          </div>
          <p className="text-xs italic font-serif text-foreground/90 leading-relaxed">
            &ldquo;{fortune}&rdquo;
          </p>
        </motion.div>
      )}
    </div>
  );
}
