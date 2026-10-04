'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/sound';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(sound.getSoundEnabled());
  }, []);

  const handleToggle = () => {
    const newState = sound.toggleMute();
    setSoundEnabled(newState);
    if (newState) {
      sound.playPop(520);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`btn-icon relative transition-all duration-200 ${
        soundEnabled 
          ? 'text-primary hover:bg-primary/10' 
          : 'text-muted-foreground hover:bg-secondary'
      } ${className}`}
      title={soundEnabled ? 'Mute Micro-interactions' : 'Enable Micro-interactions Sound'}
      aria-label="Toggle Sound Effects"
    >
      {soundEnabled ? (
        <Volume2 className="w-4 h-4 transition-transform hover:scale-110" />
      ) : (
        <VolumeX className="w-4 h-4 opacity-70 transition-transform hover:scale-110" />
      )}
    </button>
  );
}
