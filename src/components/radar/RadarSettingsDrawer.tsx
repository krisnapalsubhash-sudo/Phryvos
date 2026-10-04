'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Plus, Check, Globe, ShieldCheck } from 'lucide-react';
import { sound } from '@/lib/sound';

interface RadarSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  customTags: string[];
  onAddCustomTag: (tag: string) => void;
}

const DEFAULT_COUNTRIES = ['Global', 'India', 'United States', 'United Kingdom', 'Germany', 'Japan', 'Brazil'];

export function RadarSettingsDrawer({
  isOpen,
  onClose,
  selectedTag,
  onSelectTag,
  selectedCountry,
  onSelectCountry,
  customTags,
  onAddCustomTag,
}: RadarSettingsDrawerProps) {
  const [newTagInput, setNewTagInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  if (!isOpen) return null;

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddCustomTag(newTagInput.trim());
    setNewTagInput('');
    setShowInput(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop(340);
            onClose();
          }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Drawer Content */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-sm h-full bg-background/95 border-l border-border backdrop-blur-xl p-5 overflow-y-auto space-y-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Radar Preferences</h2>
            </div>
            <button
              onClick={() => {
                sound.playPop(340);
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vibe / Interest Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Match by Interest Vibe:
              </span>
              <button
                type="button"
                onClick={() => setShowInput(!showInput)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {showInput && (
              <form onSubmit={handleCreateTag} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. Anime, Coding, Indie Rock"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-secondary text-xs text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90"
                >
                  Add
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {customTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      sound.playPop(480);
                      onSelectTag(tag);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <span>{tag}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region / Country Matching */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Orbit Region:</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_COUNTRIES.map((country) => {
                const isSelected = selectedCountry === country;
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      sound.playPop(480);
                      onSelectCountry(country);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    }`}
                  >
                    <span>{country}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safe Discovery Guard */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Age-Appropriate Pairing Guard</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Orbital algorithms automatically pair minor and adult accounts in segregated discovery rings to protect privacy.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => {
              sound.playMatchChord();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            Apply Filters & Continue
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
