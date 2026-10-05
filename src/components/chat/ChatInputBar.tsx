'use client';

import React, { useState } from 'react';
import {
  Send,
  Smile,
  Image as ImageIcon,
  Mic,
  BellOff,
  Reply,
  X,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import type { Message } from '@/types';

const STARTER_PROMPTS = [
  '👋 Hey! What are you playing lately?',
  '🎬 Any good shows on your radar?',
  '☕ Tea or Coffee person?',
  '🎧 Send me a song recommendation!',
];

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export function ChatInputBar({
  onSendMessage,
  replyingTo,
  onCancelReply,
}: ChatInputBarProps) {
  const [inputText, setInputText] = useState('');
  const [silentSend, setSilentSend] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleStarterClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div>
      {/* Conversation Starters (Quick Tap Prompts) */}
      <div className="px-4 py-2 bg-secondary/30 border-t border-border/60">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {STARTER_PROMPTS.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleStarterClick(starter)}
              className="whitespace-nowrap text-xs px-3 py-1 rounded-xl bg-card border border-border hover:border-primary/50 text-foreground transition-all shrink-0 hover:bg-secondary"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Reply Preview Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs truncate">
            <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-primary">Replying:</span>
            <span className="text-foreground truncate">{replyingTo.content}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground ml-2"
            aria-label="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Toolbar */}
      <div className="p-3 sm:p-4 border-t border-border/80 glass-panel">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Action Icons */}
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button
              type="button"
              onClick={() => sound.playPop(420)}
              className="btn-icon w-8 h-8 rounded-lg hover:text-foreground p-1"
              title="Emoji"
              aria-label="Choose emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => sound.playPop(420)}
              className="btn-icon w-8 h-8 rounded-lg hover:text-foreground p-1"
              title="Share Image"
              aria-label="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => sound.playPop(420)}
              className="btn-icon w-8 h-8 rounded-lg hover:text-foreground p-1"
              title="Voice Note"
              aria-label="Record voice note"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your story..."
            aria-label="Chat message input"
            className="flex-1 bg-secondary/60 hover:bg-secondary/80 focus:bg-background border border-border/60 focus:border-primary/50 text-sm sm:text-base px-4 py-2.5 rounded-full outline-none transition-all"
          />

          {/* Silent Message Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(350);
              setSilentSend(!silentSend);
            }}
            className={`btn-icon w-8 h-8 rounded-full p-1 transition-colors ${
              silentSend ? 'text-purple-400 bg-purple-500/10' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={silentSend ? 'Sending Silently (No ding)' : 'Normal Send'}
            aria-label={silentSend ? 'Disable silent send' : 'Enable silent send (no notification sound)'}
          >
            <BellOff className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center disabled:opacity-40 shadow-xs transition-all active:scale-95 shrink-0"
            title="Send"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
