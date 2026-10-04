'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Image as ImageIcon,
  UserPlus,
  X,
  Check,
  SkipForward,
  Flag,
  Heart,
  Ban,
  Gamepad2,
  HelpCircle,
  Sparkles,
  Mic,
  StopCircle,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import type { RealtimeUser, RealtimeMessage } from '@/lib/realtime/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const STARTER_PROMPTS = [
  '👋 Hey! What are you listening to right now?',
  '🎮 Do you play any video games?',
  '☕ Tea or Coffee person?',
  '🎬 Any movie recommendations?',
  '🌍 Which country are you connecting from?',
];

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '💯', '✨', '👏'];

interface RadarChatViewProps {
  partner: RealtimeUser | null;
  currentRealtimeUser: RealtimeUser;
  messages: RealtimeMessage[];
  isPartnerTyping: boolean;
  hasStrangerLeft: boolean;
  friendRequestReceived: boolean;
  friendRequestAccepted: boolean;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
  onNextStranger: () => void;
  onLeaveChat: () => void;
  onBlockUser: (targetId: string) => void;
  onReportUser: (targetId: string, reason: string) => void;
  onSendMessage: (text: string) => void;
  onSetTyping: (typing: boolean) => void;
  onOpenGameModal: () => void;
  onOpenMysteryModal: () => void;
}

export function RadarChatView({
  partner,
  currentRealtimeUser,
  messages,
  isPartnerTyping,
  hasStrangerLeft,
  friendRequestReceived,
  friendRequestAccepted,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onNextStranger,
  onLeaveChat,
  onBlockUser,
  onReportUser,
  onSendMessage,
  onSetTyping,
  onOpenGameModal,
  onOpenMysteryModal,
}: RadarChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [dismissedWarmth, setDismissedWarmth] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedVoiceDuration, setRecordedVoiceDuration] = useState(0);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceRecordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Voice record timer with ref cleanup
  useEffect(() => {
    if (isRecordingVoice) {
      voiceRecordTimerRef.current = setInterval(() => {
        setRecordedVoiceDuration((d) => {
          if (d >= 14) {
            handleStopVoiceRecord();
            return 15;
          }
          return d + 1;
        });
      }, 1000);
    } else {
      if (voiceRecordTimerRef.current) clearInterval(voiceRecordTimerRef.current);
    }

    return () => {
      if (voiceRecordTimerRef.current) clearInterval(voiceRecordTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (voiceRecordTimerRef.current) clearInterval(voiceRecordTimerRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSetTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSetTyping(false);
    }, 1500);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;
    onSendMessage(text);
    setInputText('');
    onSetTyping(false);
  };

  const handleStopVoiceRecord = () => {
    setIsRecordingVoice(false);
    sound.playMessageSent();
    const voiceMsg = `🎙️ Voice Note (${recordedVoiceDuration || 4}s)`;
    onSendMessage(voiceMsg);
    setRecordedVoiceDuration(0);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sound.playMessageSent();
      onSendMessage(`[image:${dataUrl}]`);
      toast.success('Photo shared in chat! 📸');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-2xl w-full mx-auto border-x border-border/40 shadow-xs">
      {/* Top Header with Next & Action Controls */}
      <div className="px-4 py-3 sm:py-3.5 border-b border-border/80 glass-panel sticky top-0 z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-secondary flex items-center justify-center text-xl sm:text-2xl shadow-xs border border-border shrink-0">
            {partner?.avatar || '👤'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-foreground truncate">
                {partner?.displayName || 'Anonymous Stranger'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate italic">
              Connected from {partner?.locationDisplay || partner?.location || 'Somewhere in the dark'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Friend */}
          <button
            type="button"
            onClick={onSendFriendRequest}
            disabled={friendRequestAccepted}
            className={`btn-icon rounded-full border transition-all p-2 ${
              friendRequestAccepted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
            title={friendRequestAccepted ? 'Connected as Friends ✨' : 'Send Friend Request (+)'}
          >
            {friendRequestAccepted ? <Check className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4" />}
          </button>

          {/* Anti-Awkwardness Game 1: Tic-Tac-Toe */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(520);
              onOpenGameModal();
            }}
            className="btn-icon rounded-full bg-secondary text-primary hover:bg-primary/20 border border-primary/30 p-2"
            title="Play Zero-Kaata (Tic-Tac-Toe)"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* Anti-Awkwardness Game 2: 20 Questions / Word Mystery */}
          <button
            type="button"
            onClick={() => {
              sound.playPop(520);
              onOpenMysteryModal();
            }}
            className="btn-icon rounded-full bg-secondary text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 p-2"
            title="Play 20 Questions: Guess The Word"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Next Stranger Button */}
          <button
            type="button"
            onClick={onNextStranger}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
            title="Next Stranger"
          >
            <span>Next</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Block Stranger Button */}
          <button
            type="button"
            onClick={() => {
              if (partner && confirm(`Block ${partner.displayName}? They will never match with you again.`)) {
                onBlockUser(partner.id);
              }
            }}
            className="btn-icon rounded-full bg-secondary text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border border-border p-2"
            title="Block Stranger"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>

          {/* Report Stranger Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="btn-icon rounded-full bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border p-2"
                title="Report Stranger"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Report {partner?.displayName || 'Stranger'}</AlertDialogTitle>
                <AlertDialogDescription>
                  Help us keep Phryvos safe. This will block the user from matching with you again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <textarea
                id="report-reason"
                defaultValue="Inappropriate behavior"
                className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe what happened..."
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    const reason =
                      (document.getElementById('report-reason') as HTMLTextAreaElement)?.value ||
                      'Inappropriate behavior';
                    if (partner) {
                      onReportUser(partner.id, reason);
                      toast.success('Report submitted. User blocked from your orbit.');
                    }
                  }}
                >
                  Submit Report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Leave / Exit Chat */}
          <button
            type="button"
            onClick={onLeaveChat}
            className="btn-icon rounded-full bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border p-2"
            title="Leave Chat & Return to Radar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stranger Left Banner */}
      {hasStrangerLeft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-500 font-medium flex items-center justify-center gap-2">
          <span>Stranger disconnected from orbit.</span>
          <button
            type="button"
            onClick={onNextStranger}
            className="underline font-bold hover:text-foreground ml-1"
          >
            Click here to match next stranger ⏭
          </button>
        </div>
      )}

      {/* Friend Request Incoming Alert */}
      {friendRequestReceived && !friendRequestAccepted && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between text-xs text-foreground font-medium animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
            <span>{partner?.displayName} wants to connect and reveal profiles!</span>
          </span>
          <button
            type="button"
            onClick={onAcceptFriendRequest}
            className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all active:scale-95"
          >
            Accept & Reveal ✨
          </button>
        </div>
      )}

      {/* Mutual Connection Accepted Banner */}
      {friendRequestAccepted && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>You and {partner?.displayName} are now mutually connected! Profiles revealed.</span>
        </div>
      )}

      {/* Warmth Connection Suggestion Card */}
      {messages.length >= 6 && !friendRequestAccepted && !friendRequestReceived && !dismissedWarmth && (
        <div className="mx-4 my-2 p-3 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">You two are vibing!</p>
              <p className="text-[11px] text-muted-foreground">Stay in each other's story before this chat ends?</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setDismissedWarmth(true)}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              Later
            </button>
            <button
              type="button"
              onClick={onSendFriendRequest}
              className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <Heart className="w-3 h-3 fill-white" />
              <span>Connect</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentRealtimeUser.id || msg.senderId === 'me';
          const isImage = msg.text.startsWith('[image:') && msg.text.endsWith(']');
          const imageUrl = isImage ? msg.text.slice(7, -1) : null;
          const isVoice = msg.text.startsWith('🎙️ Voice Note');

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] sm:max-w-[70%] p-2 sm:p-2.5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-primary text-white rounded-br-xs'
                    : 'bg-card border border-border text-foreground rounded-bl-xs'
                }`}
              >
                {isImage && imageUrl ? (
                  <div
                    onClick={() => setSelectedImagePreview(imageUrl)}
                    className="cursor-pointer overflow-hidden rounded-xl group relative"
                  >
                    <img
                      src={imageUrl}
                      alt="Shared photo"
                      className="max-h-64 rounded-xl object-cover hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      Click to view
                    </div>
                  </div>
                ) : isVoice ? (
                  <div className="flex items-center gap-2.5 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => sound.playPop(520)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isMe ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                      }`}
                    >
                      ▶
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{msg.text}</span>
                      <span className="text-[10px] opacity-70">Voice dispatch</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-2">{msg.text}</div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMe && (
                  <span className="text-[10px] opacity-80" title={msg.status || 'delivered'}>
                    {msg.status === 'sending' ? '⏳' : msg.status === 'failed' ? '⚠️' : '✓✓'}
                  </span>
                )}
              </span>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200" />
            <span className="italic ml-1">{partner?.displayName} is typing...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Starter Prompts */}
      <div className="px-4 py-2 bg-secondary/30 border-t border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Conversation Starters:
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STARTER_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap text-xs px-3 py-1 rounded-lg bg-card border border-border/80 hover:border-primary/50 text-foreground transition-all hover:bg-secondary/60 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Reactions Bar */}
      <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-card/60 border-t border-border/40">
        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          Quick React:
        </span>
        <div className="flex items-center gap-1.5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSend(emoji)}
              className="text-base px-1.5 py-0.5 rounded-md hover:bg-secondary transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 border-t border-border/80 glass-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button
              type="button"
              onClick={() => sound.playPop(420)}
              className="btn-icon w-8 h-8 rounded-lg hover:text-foreground"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                sound.playPop(420);
                fileInputRef.current?.click();
              }}
              className="btn-icon w-8 h-8 rounded-lg hover:text-foreground"
              title="Share Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRecordingVoice) {
                  setRecordedVoiceDuration(0);
                  setIsRecordingVoice(true);
                  sound.playPop(520);
                } else {
                  handleStopVoiceRecord();
                }
              }}
              className={`btn-icon w-8 h-8 rounded-lg transition-all ${
                isRecordingVoice ? 'text-rose-500 animate-pulse bg-rose-500/10' : 'hover:text-foreground'
              }`}
              title={isRecordingVoice ? 'Stop and send voice note' : 'Record voice note (15s)'}
            >
              {isRecordingVoice ? <StopCircle className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {isRecordingVoice ? (
            <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Recording Voice Note... ({recordedVoiceDuration}s/15s)</span>
              </span>
              <span
                className="text-[11px] underline cursor-pointer"
                onClick={() => {
                  setIsRecordingVoice(false);
                  setRecordedVoiceDuration(0);
                }}
              >
                Cancel
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type message to stranger..."
              className="flex-1 bg-secondary/60 hover:bg-secondary/80 focus:bg-background border border-border/60 focus:border-primary/50 text-sm sm:text-base px-4 py-2.5 rounded-full outline-none transition-all"
            />
          )}

          <button
            type="submit"
            disabled={!inputText.trim() && !isRecordingVoice}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center disabled:opacity-40 shadow-xs transition-all active:scale-95 shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lightbox Modal for Shared Image */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img
              src={selectedImagePreview}
              alt="Shared preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
