'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Mic, Bookmark, Link2, Download } from 'lucide-react';
import { sound } from '@/lib/sound';

interface SharedVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
}

export function SharedVaultModal({ isOpen, onClose, friendName }: SharedVaultModalProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'voice' | 'links'>('media');

  if (!isOpen) return null;

  const mockPhotos = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
  ];

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
          className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 glass-panel">
            <div>
              <h2 className="text-base font-extrabold text-foreground tracking-tight">
                Shared Vault · {friendName}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                All media, voice notes & memories exchanged
              </p>
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

          {/* Vault Tabs */}
          <div className="flex border-b border-border/60 px-4 pt-2">
            {[
              { id: 'media', label: 'Media', icon: ImageIcon, count: 4 },
              { id: 'voice', label: 'Voice Notes', icon: Mic, count: 2 },
              { id: 'links', label: 'Links', icon: Link2, count: 3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playPop(440);
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-60">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'media' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {mockPhotos.map((url, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-2xl overflow-hidden bg-secondary border border-border/60"
                  >
                    <img src={url} alt="Shared memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-2">
                {[
                  { title: 'Voice Note #1', duration: '0:24', time: 'Yesterday' },
                  { title: 'Voice Note #2', duration: '1:12', time: '3 days ago' },
                ].map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{v.title}</p>
                        <p className="text-[10px] text-muted-foreground">{v.duration} · {v.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-2">
                {[
                  { title: 'Spotify · Midnight Lofi Vibes', url: 'https://open.spotify.com/playlist/...', time: 'Yesterday' },
                  { title: 'YouTube · Ghibli Study Stream', url: 'https://youtube.com/watch?...', time: '2 days ago' },
                  { title: 'GitHub · Phryvos Open Source', url: 'https://github.com/phryvos/...', time: 'Oct 1' },
                ].map((l, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{l.title}</p>
                        <p className="text-[10px] text-primary truncate">{l.url}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
