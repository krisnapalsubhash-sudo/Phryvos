'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Sparkles, QrCode, ExternalLink } from 'lucide-react';
import type { User } from '@/types';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function ShareProfileModal({ isOpen, onClose, user }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://phryvos.in';
  const profileUrl = `${origin}/profile/${user.id}`;

  const handleCopyLink = () => {
    sound.playPop(520);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl).catch(() => {});
    }
    setCopied(true);
    toast.success('Profile link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = user.displayName || user.username || 'User';

  const handleNativeShare = async () => {
    sound.playPop(480);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} (@${user.username}) on Phryvos`,
          text: `Connect with ${displayName} on Phryvos — Where Strangers Become Stories.`,
          url: profileUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-card border border-border/80 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Header Close */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-primary" />
              Share Profile
            </span>
            <button
              onClick={() => {
                sound.playPop(300);
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viral Card Preview (Instagram-like Card) */}
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-full max-w-[260px] p-5 rounded-2xl bg-gradient-to-b from-primary/20 via-background to-card border border-primary/30 shadow-lg relative overflow-hidden mb-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl phryvos-gradient flex items-center justify-center text-3xl mx-auto shadow-md mb-3 ring-2 ring-primary/40">
                {user.avatar || '✨'}
              </div>

              <h3 className="font-bold text-base text-foreground flex items-center justify-center gap-1">
                {displayName}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>

              {user.bio && (
                <p className="text-[11px] text-muted-foreground/90 mt-2 line-clamp-2 italic">
                  &ldquo;{user.bio}&rdquo;
                </p>
              )}

              {/* QR Code Graphic Placeholder */}
              <div className="mt-4 p-3 bg-white rounded-xl mx-auto w-28 h-28 flex flex-col items-center justify-center shadow-inner">
                <QrCode className="w-20 h-20 text-neutral-900" />
                <span className="text-[8px] font-bold text-neutral-800 tracking-wider uppercase mt-0.5">PHRYVOS</span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2">
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 rounded-xl phryvos-gradient text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-all active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                Share to Apps (WhatsApp / Insta)
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium flex items-center justify-center gap-2 border border-border/80 transition-all active:scale-[0.98]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                {copied ? 'Link Copied!' : 'Copy Direct Link'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
