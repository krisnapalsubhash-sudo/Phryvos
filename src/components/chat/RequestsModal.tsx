'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserX, Compass, Sparkles, MapPin } from 'lucide-react';
import { sound } from '@/lib/sound';

interface RequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (reqId: string, item?: RequestItem) => void;
}

interface RequestItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  tag: string;
  bio: string;
  timeAgo: string;
}

export function RequestsModal({ isOpen, onClose, onAccept }: RequestsModalProps) {
  const [requests, setRequests] = React.useState<RequestItem[]>([
    {
      id: 'r1',
      name: 'Kenji',
      username: 'kenji.dev',
      avatar: '⚡',
      location: 'Tokyo, Japan',
      tag: '#Coding',
      bio: 'Full-stack dev & Rust fan. Met through Radar!',
      timeAgo: '15m ago',
    },
    {
      id: 'r2',
      name: 'Elena',
      username: 'elena.art',
      avatar: '🎨',
      location: 'Madrid, Spain',
      tag: '#Art',
      bio: 'Digital illustrator & coffee enthusiast.',
      timeAgo: '2h ago',
    },
    {
      id: 'r3',
      name: 'Zack',
      username: 'zack.beats',
      avatar: '🎧',
      location: 'Toronto, Canada',
      tag: '#Music',
      bio: 'Lofi producer & vinyl collector.',
      timeAgo: 'Yesterday',
    },
  ]);

  if (!isOpen) return null;

  const handleDecline = (id: string) => {
    sound.playPop(340);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAcceptItem = (id: string) => {
    sound.playMatchChord();
    const item = requests.find((r) => r.id === id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onAccept(id, item);
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
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 glass-panel">
            <div>
              <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>Connection Requests</span>
                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {requests.length}
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Strangers who want to stay in your story
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

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary/40 animate-pulse" />
                <p>No pending requests right now.</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  Spin the Radar to discover new people!
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shadow-xs border border-border">
                        {req.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-foreground">{req.name}</span>
                          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-semibold">
                            {req.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{req.location}</span>
                          <span>· {req.timeAgo}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/80 px-1">{req.bio}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="flex-1 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleAcceptItem(req.id)}
                      className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Chat</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
