'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] select-none">
      {/* Dynamic Aurora Orb 1 (Indigo/Violet) */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[15%] left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-600/10 to-transparent blur-[120px] dark:from-indigo-600/18 dark:via-purple-600/12 dark:to-transparent"
      />

      {/* Dynamic Aurora Orb 2 (Cyan/Teal) */}
      <motion.div
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.92, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[40%] -right-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-cyan-500/10 via-blue-500/8 to-transparent blur-[110px] dark:from-cyan-500/14 dark:via-indigo-500/10 dark:to-transparent"
      />

      {/* Subtle Noise Texture overlay (SVG data URI - no external image) */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.038] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
