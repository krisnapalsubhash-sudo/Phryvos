'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { sound } from '@/lib/sound';

interface VoiceNotePlayerProps {
  duration?: string;
  isMe?: boolean;
}

export function VoiceNotePlayer({ duration = '0:18', isMe = false }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // 24 randomized bar heights for the visualizer
  const bars = [4, 8, 14, 20, 16, 26, 32, 22, 18, 28, 34, 26, 20, 16, 24, 30, 20, 14, 18, 22, 16, 12, 8, 4];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    sound.playPop(isPlaying ? 380 : 540);
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2.5 py-1 px-1 min-w-[210px] select-none">
      {/* Play/Pause round button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs ${
          isMe
            ? 'bg-white text-primary'
            : 'bg-primary text-white'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Bars */}
      <div className="flex-1 flex items-center gap-[2.5px] h-9 cursor-pointer" onClick={togglePlay}>
        {bars.map((height, i) => {
          const barProgress = (i / bars.length) * 100;
          const isPassed = progress >= barProgress;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPassed
                  ? isMe
                    ? 'bg-white'
                    : 'bg-primary'
                  : isMe
                  ? 'bg-white/40'
                  : 'bg-muted-foreground/30'
              }`}
              style={{
                height: `${isPlaying ? Math.max(6, (height * (0.6 + Math.random() * 0.8))) : height}px`,
              }}
            />
          );
        })}
      </div>

      {/* Time */}
      <span className={`text-[10px] font-mono shrink-0 ${isMe ? 'text-white/80' : 'text-muted-foreground'}`}>
        {duration}
      </span>
    </div>
  );
}
