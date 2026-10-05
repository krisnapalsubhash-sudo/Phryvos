'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Check,
  Save,
  Sparkles,
  MapPin,
  Smile,
  Palette
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  '😊', '🦊', '⚡', '🌸', '🎮', '🎨', '🚀', '☕',
  '🎧', '🌙', '🦁', '🐺', '🦄', '👾', '🤖', '✨',
];

const BANNER_THEMES = [
  { id: 'aurora', name: 'Cosmic Aurora', class: 'from-indigo-600 via-purple-600 to-cyan-500' },
  { id: 'sunset', name: 'Santorini Sunset', class: 'from-rose-500 via-amber-500 to-indigo-600' },
  { id: 'cyber', name: 'Cyber Neon', class: 'from-cyan-600 via-blue-600 to-purple-800' },
  { id: 'emerald', name: 'Emerald Forest', class: 'from-emerald-600 via-teal-600 to-indigo-800' },
  { id: 'obsidian', name: 'Obsidian Velvet', class: 'from-zinc-900 via-purple-950 to-black' },
];

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfileAPI, fetchProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || 'You');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatar, setAvatar] = useState(user?.avatar || '😊');
  const [selectedBanner, setSelectedBanner] = useState(BANNER_THEMES[0].class);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateProfileAPI({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar,
        cover: selectedBanner,
      });
      await fetchProfile();
      sound.playMessageSent();
      toast.success('Profile updated successfully! ✨');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile';
      setSaveError(msg);
      console.error('Profile update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4 shrink-0">
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Profile</h2>
              <p className="text-xs text-muted-foreground">Customize how strangers see you</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form id="profile-edit-form" onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Banner Preview & Theme Selector */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>Cover Banner Theme</span>
              </label>
              <div
                className={`w-full h-20 rounded-2xl bg-gradient-to-r ${selectedBanner} mb-2 shadow-inner border border-white/20`}
              />
              <div className="grid grid-cols-5 gap-2">
                {BANNER_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedBanner(theme.class);
                      sound.playPop(340);
                    }}
                    className={`h-7 rounded-xl bg-gradient-to-r ${theme.class} border-2 transition-all flex items-center justify-center ${
                      selectedBanner === theme.class ? 'border-primary ring-2 ring-primary/40' : 'border-border/50'
                    }`}
                    title={theme.name}
                  >
                    {selectedBanner === theme.class && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-primary" />
                <span>Profile Avatar</span>
              </label>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl phryvos-gradient flex items-center justify-center text-3xl shadow-md ring-2 ring-primary/40 text-white shrink-0">
                  {avatar}
                </div>
                <div className="grid grid-cols-8 gap-1.5 flex-1">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        sound.playPop(480);
                      }}
                      className={`h-8 rounded-xl text-base flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-primary text-white scale-110 shadow-xs'
                          : 'bg-secondary/60 hover:bg-secondary text-foreground'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                maxLength={40}
                className="h-9 text-xs rounded-xl bg-secondary/30 border-border/70"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Bio</label>
                <span className="text-[10px] text-muted-foreground">{bio.length}/160</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell strangers what makes you curious... (interests, thoughts, vibes)"
                rows={3}
                maxLength={160}
                className="w-full text-xs rounded-xl bg-secondary/30 border border-border/70 p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span>Location</span>
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                maxLength={100}
                className="h-9 text-xs rounded-xl bg-secondary/30 border-border/70"
              />
            </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-between shrink-0">
            {saveError && (
              <span className="text-xs text-destructive">{saveError}</span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                form="profile-edit-form"
                size="sm"
                disabled={isSaving}
                className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs px-4 gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
