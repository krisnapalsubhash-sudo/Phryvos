'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Radio, Compass, Users } from 'lucide-react';
import Link from 'next/link';
import { sound } from '@/lib/sound';

interface VibeLoungesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIBE_ROOMS = [
  { id: 'midnight', emoji: '🌙', title: 'Midnight Deep Talks', count: 42, vibe: 'Unfiltered 2 AM conversations without masks' },
  { id: 'coffee', emoji: '☕', title: 'Casual Coffee Banter', count: 89, vibe: 'Lighthearted daily chats & funny work stories' },
  { id: 'tech', emoji: '🚀', title: 'Startups & Brainstorm', count: 31, vibe: 'Wild ideas, code talk & side project showcases' },
  { id: 'gaming', emoji: '🎮', title: 'Late Night Gamers', count: 114, vibe: 'Looking for duo/squad & talking game lore' },
  { id: 'zen', emoji: '🧘', title: 'Silent Co-Presence', count: 56, vibe: 'Study together in quiet rooms with lo-fi beats' },
  { id: 'music', emoji: '🎧', title: 'Music & Jam Session', count: 68, vibe: 'Sharing obscure underground tracks & playlists' },
];

export function VibeLoungesModal({ isOpen, onClose }: VibeLoungesModalProps) {
  if (!isOpen) return null;

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
          className="relative w-full max-w-lg bg-zinc-950 border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Real-time Vibe Lounges</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Live Orbit
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Match with strangers in the exact same vibe.</p>
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
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {VIBE_ROOMS.map((room) => (
              <Link key={room.id} href="/radar" onClick={() => sound.playMatchChord()}>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group cursor-pointer flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                      {room.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                          {room.title}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          {room.count} online
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{room.vibe}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform">
                    <span>Enter</span>
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
