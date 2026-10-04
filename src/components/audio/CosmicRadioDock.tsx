'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Users,
  X,
  Headphones
} from 'lucide-react';
import { useFeaturesStore } from '@/store/features';
import { sound } from '@/lib/sound';

interface Station {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  listeners: number;
  freq: number;
  noiseType: 'rain' | 'drone' | 'cafe' | 'chill';
}

const STATIONS: Station[] = [
  { id: 'rain', name: 'Rainy Tokyo 3 AM', emoji: '🌧️', tag: 'Rain & Lo-Fi', listeners: 47, freq: 174, noiseType: 'rain' },
  { id: 'cafe', name: 'Cyberpunk Midnight Cafe', emoji: '☕', tag: 'Warmth & Hiss', listeners: 31, freq: 216, noiseType: 'cafe' },
  { id: 'space', name: 'Cosmic Nebula Drone', emoji: '🌌', tag: 'Deep Binaural', listeners: 64, freq: 136.1, noiseType: 'drone' },
  { id: 'fire', name: 'Campfire Stargazing', emoji: '🔥', tag: 'Crackle & Calm', listeners: 28, freq: 194, noiseType: 'chill' },
];

export function CosmicRadioDock() {
  const { flags } = useFeaturesStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const currentStation = STATIONS[activeStationIndex];

  // Web Audio Synth for ambient sound generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startAudio = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Clean up previous
      stopAudio();

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.connect(ctx.destination);
      gainRef.current = gain;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(currentStation.freq, ctx.currentTime);
      osc1.connect(gain);
      osc1.start();
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(currentStation.freq * 1.5, ctx.currentTime);
      osc2.connect(gain);
      osc2.start();
      osc2Ref.current = osc2;
    } catch {}
  };

  const stopAudio = () => {
    try {
      if (osc1Ref.current) {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
        osc2Ref.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    if (isPlaying && !isMuted) {
      startAudio();
    } else {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [isPlaying, activeStationIndex, isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isPlaying;
    setIsPlaying(next);
    sound.playPop(next ? 520 : 320);
  };

  const handleSelectStation = (index: number) => {
    setActiveStationIndex(index);
    sound.playPop(440);
    if (!isPlaying) setIsPlaying(true);
  };

  // If cosmicRadio is disabled or minimalist mode is on, or dismissed by user
  if (!flags.cosmicRadio || flags.minimalistMode || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 select-none">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-[320px] transition-all"
      >
        {/* Compact Dock Bar */}
        <div
          onClick={() => {
            setIsExpanded((p) => !p);
            sound.playPop(400);
          }}
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-secondary/40 transition-colors"
        >
          {/* Animated Glow Icon */}
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm shadow-md transition-all ${
                isPlaying
                  ? 'bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white animate-pulse'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span>{currentStation.emoji}</span>
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-background animate-ping" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">{currentStation.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Users className="w-2.5 h-2.5 text-cyan-400" />
              <span>{currentStation.listeners} co-listeners</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">Cosmic Radio</span>
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-xs"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((p) => !p);
            }}
            className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Station Drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/60 p-3 space-y-2 bg-secondary/20"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1 pb-1">
                <span>SELECT AMBIENT FREQUENCY</span>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="hover:text-foreground text-[10px] flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Hide</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {STATIONS.map((station, index) => {
                  const isCurrent = activeStationIndex === index;
                  return (
                    <button
                      key={station.id}
                      onClick={() => handleSelectStation(index)}
                      className={`w-full flex items-center justify-between p-2 rounded-2xl text-left text-xs transition-all ${
                        isCurrent
                          ? 'bg-primary/10 border border-primary/40 text-primary font-bold shadow-xs'
                          : 'hover:bg-secondary/60 text-foreground border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{station.emoji}</span>
                        <div>
                          <p className="truncate leading-tight">{station.name}</p>
                          <span className="text-[10px] text-muted-foreground font-normal">{station.tag}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {station.listeners} live
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-cyan-400" />
                  <span>Binaural lo-fi background audio</span>
                </span>
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="hover:text-foreground flex items-center gap-1"
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
