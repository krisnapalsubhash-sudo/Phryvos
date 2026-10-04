'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Settings, Sparkles, RefreshCw, X } from 'lucide-react';
import { sound } from '@/lib/sound';
import { TiltedSolarCanvas } from '@/components/solar/TiltedSolarCanvas';

interface RadarOrbitalCanvasProps {
  isConnected: boolean;
  isReconnecting: boolean;
  onlineCount: number;
  isSearching: boolean;
  onToggleSettings: () => void;
  onStartMatch: () => void;
  onCancelMatch: () => void;
}

export function RadarOrbitalCanvas({
  isConnected,
  isReconnecting,
  onlineCount,
  isSearching,
  onToggleSettings,
  onStartMatch,
  onCancelMatch,
}: RadarOrbitalCanvasProps) {
  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto p-4 sm:p-6 md:p-8">
      {/* Top Bar / Radar Header with Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-mono">
              RADAR
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Engine</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playPop(400);
                onToggleSettings();
              }}
              className="btn-icon rounded-full hover:bg-secondary border border-border/60 p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Settings & Filters for Radar"
              aria-label="Radar Settings & Filters"
            >
              <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Discovery Mode Pill */}
        <div className="flex items-center justify-between text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-secondary/40 border border-border/50 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">Discovery:</span>
            <span className="font-semibold text-primary">Interest-Based Matching</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Smart Filters</span>
          </div>
        </div>
      </div>

      {/* Center: 75° Perspective Solar System */}
      <div className="my-auto flex flex-col items-center justify-center py-4 sm:py-6">
        <TiltedSolarCanvas isMatching={isSearching} />

        {/* Matchmaking Status Feedback */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Finding someone who shares your vibe...</span>
          </motion.div>
        )}
      </div>

      {/* Bottom Controls: Start Matchmaking Button & Live User Count */}
      <div className="space-y-3 pb-3">
        {isSearching ? (
          <button
            type="button"
            onClick={onCancelMatch}
            className="w-full py-4 rounded-2xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive font-bold text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <X className="w-4 h-4" />
            <span>Cancel Matchmaking</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartMatch}
            className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Start Matchmaking</span>
          </button>
        )}

        {/* Live Users Online Indicator */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span>
            {isReconnecting
              ? 'Reconnecting to orbit...'
              : !isConnected
              ? 'Connecting to orbit network...'
              : onlineCount > 0
              ? (
                <>
                  Active Orbits Online: <strong>{onlineCount}</strong>
                </>
              )
              : 'Active Orbits Online: 1'}
          </span>
        </div>
      </div>
    </div>
  );
}
