'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Ghost, FolderArchive, Phone } from 'lucide-react';
import { sound } from '@/lib/sound';
import type { User } from '@/types';

interface ChatHeaderProps {
  otherUser: User;
  vanishMode: boolean;
  onToggleVanishMode: () => void;
  onBack: () => void;
  onOpenVault: () => void;
}

export function ChatHeader({
  otherUser,
  vanishMode,
  onToggleVanishMode,
  onBack,
  onOpenVault,
}: ChatHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 glass-panel sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(340);
              onBack();
            }}
            className="btn-icon md:hidden text-muted-foreground hover:text-foreground shrink-0 p-1"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-secondary flex items-center justify-center text-2xl shadow-xs border border-border">
              {otherUser.avatar || '👤'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                {otherUser.displayName}
              </h2>
              {vanishMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  <Ghost className="w-3 h-3" />
                  <span>Vanish</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Listening to Midnight Lofi 🎧</span>
            </p>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1">
          {/* Shared Vault Button */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(480);
              onOpenVault();
            }}
            className="btn-icon rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground p-2"
            title="Shared Vault (Media & Links)"
            aria-label="Shared Vault"
          >
            <FolderArchive className="w-4 h-4" />
          </button>

          {/* Vanish / Ghost Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(520);
              onToggleVanishMode();
            }}
            className={`btn-icon rounded-full border transition-all p-2 ${
              vanishMode
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground border-transparent'
            }`}
            title={vanishMode ? 'Disable Vanish Mode' : 'Enable Ghost / Vanish Mode'}
            aria-label="Toggle Ghost / Vanish Mode"
          >
            <Ghost className="w-4 h-4" />
          </button>

          {/* Audio Call */}
          <button
            type="button"
            onClick={() => sound.playPop(400)}
            className="btn-icon rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground p-2"
            title="Audio Call"
            aria-label="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vanish Mode Banner */}
      {vanishMode && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-purple-950/40 border-b border-purple-500/20 px-4 py-1.5 text-center text-[11px] text-purple-300 flex items-center justify-center gap-1.5 font-medium"
        >
          <Ghost className="w-3.5 h-3.5" />
          <span>Ghost Mode Active: Seen messages disappear when the chat is closed</span>
        </motion.div>
      )}
    </>
  );
}
