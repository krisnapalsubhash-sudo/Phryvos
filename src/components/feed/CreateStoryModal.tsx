'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Mic,
  Moon,
  Sparkles,
  Check,
  Send,
  MapPin,
  Flame,
  Volume2
} from 'lucide-react';
import { useStoriesStore } from '@/store/stories';
import { useAuthStore } from '@/store/auth';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import type { Story, StorySlide } from '@/types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_IMAGES = [
  { name: 'Santorini Sunset', url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80' },
  { name: 'Tokyo Rain', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&q=80' },
  { name: 'Warm Coffee', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&q=80' },
  { name: 'Cosmic Sky', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1080&q=80' },
];

const GRADIENT_PRESETS = [
  { name: 'Velvet Violet', class: 'from-purple-950 via-slate-900 to-indigo-950' },
  { name: 'Midnight Nebula', class: 'from-indigo-950 via-slate-900 to-black' },
  { name: 'Cyber Cyan', class: 'from-cyan-950 via-slate-900 to-black' },
  { name: 'Obsidian Ember', class: 'from-amber-950 via-rose-950 to-black' },
];

export function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  const { addStory, openStory } = useStoriesStore();
  const { user } = useAuthStore();
  const currentUser = user;

  const [mode, setMode] = useState<'photo' | 'voice' | 'midnight'>('photo');

  // Photo mode state
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [locationTag, setLocationTag] = useState('');

  // Voice mode state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [voiceQuote, setVoiceQuote] = useState('');

  // Midnight mode state
  const [midnightThought, setMidnightThought] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);

  // Recording simulation
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordedDuration((prev) => {
          if (prev >= 15) {
            setIsRecording(false);
            sound.playPop(300);
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!isRecording) {
      setRecordedDuration(0);
      setIsRecording(true);
      sound.playPop(520);
    } else {
      setIsRecording(false);
      sound.playPop(380);
    }
  };

  const handlePublish = () => {
    const storyId = `story-${Date.now()}`;
    let newSlide: StorySlide;

    if (mode === 'photo') {
      const imgUrl = customImageUrl.trim() || selectedImage;
      newSlide = {
        id: `slide-${Date.now()}`,
        type: 'image',
        mediaUrl: imgUrl,
        caption: caption.trim() || 'A glimpse of my day ✨',
        tag: locationTag.trim() || 'Worldwide',
      };
    } else if (mode === 'voice') {
      newSlide = {
        id: `slide-${Date.now()}`,
        type: 'voice',
        audioDuration: recordedDuration || 12,
        caption: caption.trim() || '15s Audio Drop 🎙️',
        content: voiceQuote.trim() || '"Listening to the world when it slows down."',
        tag: '🎙️ Live Voice Snippet',
        gradient: 'from-cyan-950 via-slate-900 to-black',
      };
    } else {
      newSlide = {
        id: `slide-${Date.now()}`,
        type: 'midnight',
        content: midnightThought.trim() || 'Thoughts that only wake up after midnight.',
        tag: '🌙 Midnight Drop',
        gradient: selectedGradient,
      };
    }

    const newStory: Story = {
      id: storyId,
      author: currentUser || {
        id: 'unknown',
        username: 'unknown',
        displayName: 'Unknown',
        bio: '',
        avatar: '❓',
        interests: [],
        followers: 0,
        following: 0,
        postsCount: 0,
        isConnected: false,
        isOnline: false,
        createdAt: new Date().toISOString(),
      },
      images: mode === 'photo' ? [newSlide.mediaUrl!] : [],
      views: 1,
      hasSeen: false,
      isVoiceStory: mode === 'voice',
      isMidnightDrop: mode === 'midnight',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      slides: [newSlide],
    };

    addStory(newStory);
    sound.playMessageSent();
    onClose();
    // Open the new story immediately
    setTimeout(() => {
      openStory(storyId);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl p-5 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                ✨
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Create 24h Story</h3>
                <p className="text-[11px] text-muted-foreground">Disappears in 24 hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-2xl mb-4">
            <button
              onClick={() => {
                setMode('photo');
                sound.playPop(420);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'photo' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>

            <button
              onClick={() => {
                setMode('voice');
                sound.playPop(480);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'voice' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>

            <button
              onClick={() => {
                setMode('midnight');
                sound.playPop(540);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'midnight' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Midnight</span>
            </button>
          </div>

          {/* Mode 1: Photo Story */}
          {mode === 'photo' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-foreground block">Select Aesthetic Photo Preset:</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    onClick={() => {
                      setSelectedImage(preset.url);
                      setCustomImageUrl('');
                      sound.playPop(350);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      selectedImage === preset.url && !customImageUrl
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {selectedImage === preset.url && !customImageUrl && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste an image URL..."
                  className="w-full h-8.5 rounded-xl bg-secondary/50 border border-border/70 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption... (e.g. Sunset in Santorini)"
                  className="w-full h-8.5 rounded-xl bg-secondary/50 border border-border/70 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  placeholder="Location or mood tag (e.g. 🇬🇷 Oia, Greece)"
                  className="w-full h-8.5 rounded-xl bg-secondary/50 border border-border/70 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Voice Drop */}
          {mode === 'voice' && (
            <div className="space-y-4 text-center py-2">
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  onClick={toggleRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/20 shadow-xl'
                      : recordedDuration > 0
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                      : 'bg-primary text-white hover:scale-105'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>

                <div className="font-mono text-xs font-semibold text-foreground">
                  {isRecording ? (
                    <span className="text-rose-500 animate-pulse">Recording... 00:{String(recordedDuration).padStart(2, '0')} / 15s</span>
                  ) : recordedDuration > 0 ? (
                    <span className="text-emerald-500">Recorded: {recordedDuration} seconds audio</span>
                  ) : (
                    <span className="text-muted-foreground">Tap mic to record 15-second snippet</span>
                  )}
                </div>
              </div>

              <textarea
                value={voiceQuote}
                onChange={(e) => setVoiceQuote(e.target.value)}
                placeholder="Key quote or transcript thought... (e.g. '3 AM thoughts on why we code...')"
                rows={2}
                className="w-full rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Mode 3: Midnight Drop */}
          {mode === 'midnight' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-foreground block">Gradient Atmosphere:</label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((grad) => (
                  <button
                    key={grad.name}
                    onClick={() => {
                      setSelectedGradient(grad.class);
                      sound.playPop(360);
                    }}
                    className={`h-10 rounded-xl bg-gradient-to-br ${grad.class} border-2 flex items-center justify-center transition-all ${
                      selectedGradient === grad.class
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {selectedGradient === grad.class && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>

              <textarea
                value={midnightThought}
                onChange={(e) => setMidnightThought(e.target.value)}
                placeholder="Type your deep 1-liner midnight thought or confession..."
                rows={3}
                className="w-full rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary font-serif italic text-center"
              />
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs px-4 gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share to Stories</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
