'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, Reply } from 'lucide-react';
import { sound } from '@/lib/sound';
import type { Message, User } from '@/types';
import { VoiceNotePlayer } from '@/components/chat/VoiceNotePlayer';

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '12:00';
  }
}

interface ChatMessageListProps {
  messages: Message[];
  otherUser: User;
  isTyping: boolean;
  onReplyTo: (msg: Message) => void;
}

export function ChatMessageList({
  messages,
  otherUser,
  isTyping,
  onReplyTo,
}: ChatMessageListProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* "HOW YOU MET" HERO CARD */}
      <div className="p-4 rounded-3xl bg-secondary/30 border border-border/60 text-center max-w-sm mx-auto mb-6 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 mx-auto flex items-center justify-center text-2xl shadow-md mb-2">
          ✨
        </div>
        <h3 className="font-extrabold text-sm text-foreground">
          Connected on Radar · #Gaming & #Anime
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          You and {otherUser.displayName} matched 3 days ago.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Shared Vibe: 88%
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Friends
          </span>
        </div>
      </div>

      {/* Sample Voice Note Message */}
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-[70%] p-2 rounded-2xl bg-card border border-border/80 text-foreground rounded-bl-xs shadow-xs">
          <VoiceNotePlayer duration="0:24" isMe={false} />
          <span className="text-[9px] text-muted-foreground px-2 block text-right mt-0.5">
            10:14 PM
          </span>
        </div>
      </div>

      {/* Rendered Messages */}
      {messages.map((msg) => {
        const isMe = msg.senderId === 'me';
        return (
          <div
            key={msg.id}
            className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`relative max-w-[85%] sm:max-w-[72%] px-4 py-2.5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-xs ${
                isMe
                  ? 'bg-primary text-white rounded-br-xs'
                  : 'bg-card border border-border/80 text-foreground rounded-bl-xs'
              }`}
            >
              <p>{msg.content}</p>

              <div
                className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                  isMe ? 'text-white/70' : 'text-muted-foreground'
                }`}
              >
                <span>{formatTime(msg.timestamp)}</span>
                {isMe && <CheckCheck className="w-3 h-3" />}
              </div>

              {/* Quick Reaction Bubble Menu on Hover */}
              <div
                className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border/80 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1.5 z-10 ${
                  isMe ? 'right-0' : 'left-0'
                }`}
              >
                {['❤️', '😂', '🔥', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sound.playHeart()}
                    className="hover:scale-125 transition-transform text-xs"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onReplyTo(msg)}
                  className="text-muted-foreground hover:text-foreground text-[10px] pl-1 border-l border-border"
                >
                  <Reply className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="bg-card border border-border/80 px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">typing...</span>
        </motion.div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
