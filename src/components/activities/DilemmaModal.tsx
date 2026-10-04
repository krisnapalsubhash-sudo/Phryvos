'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Users, Check, Sparkles, Trophy } from 'lucide-react';
import { sound } from '@/lib/sound';

interface DilemmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DilemmaItem {
  id: string;
  topic: string;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
  selected?: 'A' | 'B';
}

export function DilemmaModal({ isOpen, onClose }: DilemmaModalProps) {
  const [dilemmas, setDilemmas] = useState<DilemmaItem[]>([
    {
      id: 'd1',
      topic: 'Superpower Dilemma',
      optionA: 'Read unfiltered thoughts of any stranger for 24 hours 🧠',
      optionB: 'Teleport anywhere on Earth instantly, but you can only stay for 10 minutes ⚡',
      votesA: 3420,
      votesB: 1890,
    },
    {
      id: 'd2',
      topic: 'Life Dilemma',
      optionA: 'Never have to sleep again with 100% energy 🌙',
      optionB: 'Speak every human and animal language fluently 🦉',
      votesA: 2120,
      votesB: 4210,
    },
    {
      id: 'd3',
      topic: 'Social Dilemma',
      optionA: 'Find out exactly what your friends talk about when you leave the room 🕵️',
      optionB: 'Know the exact date and place you meet your future soulmate 💫',
      votesA: 1540,
      votesB: 5120,
    },
  ]);

  if (!isOpen) return null;

  const handleVote = (id: string, choice: 'A' | 'B') => {
    sound.playMatchChord();
    setDilemmas((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.selected) return d;
        return {
          ...d,
          selected: choice,
          votesA: choice === 'A' ? d.votesA + 1 : d.votesA,
          votesB: choice === 'B' ? d.votesB + 1 : d.votesB,
        };
      })
    );
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
          className="relative w-full max-w-lg bg-zinc-950 border border-indigo-500/40 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Would You Rather? (Live Dilemmas)</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                    Live Polls
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Vote & see real-time community statistics.</p>
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {dilemmas.map((d) => {
              const total = d.votesA + d.votesB;
              const pctA = Math.round((d.votesA / total) * 100);
              const pctB = 100 - pctA;

              return (
                <div key={d.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">{d.topic}</span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{total.toLocaleString()} votes</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Option A */}
                    <button
                      onClick={() => handleVote(d.id, 'A')}
                      className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                        d.selected === 'A'
                          ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500/40'
                          : 'border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800/60'
                      }`}
                    >
                      {d.selected && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctA}%` }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 bg-indigo-500/25 -z-0"
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-semibold text-white">
                        <span>{d.optionA}</span>
                        {d.selected && <span className="text-indigo-400 font-black">{pctA}%</span>}
                      </div>
                    </button>

                    {/* Option B */}
                    <button
                      onClick={() => handleVote(d.id, 'B')}
                      className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                        d.selected === 'B'
                          ? 'border-cyan-500 bg-cyan-500/20 ring-1 ring-cyan-500/40'
                          : 'border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800/60'
                      }`}
                    >
                      {d.selected && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctB}%` }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 bg-cyan-500/25 -z-0"
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-semibold text-white">
                        <span>{d.optionB}</span>
                        {d.selected && <span className="text-cyan-400 font-black">{pctB}%</span>}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
