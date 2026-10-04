'use client';

import React from 'react';

export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] select-none transform-gpu"
      aria-hidden="true"
    >
      {/* Dynamic Aurora Orb 1 (Indigo/Violet) - Pure CSS GPU Accelerated */}
      <div
        className="absolute -top-[10%] left-[10%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-600/10 to-transparent blur-[64px] dark:from-indigo-600/20 dark:via-purple-600/15 dark:to-transparent animate-aurora-slow"
        style={{ willChange: 'transform' }}
      />

      {/* Dynamic Aurora Orb 2 (Cyan/Teal) - Pure CSS GPU Accelerated */}
      <div
        className="absolute top-[35%] -right-[5%] w-[380px] h-[380px] rounded-full bg-gradient-to-bl from-cyan-500/12 via-blue-500/10 to-transparent blur-[60px] dark:from-cyan-500/16 dark:via-indigo-500/12 dark:to-transparent animate-aurora-reverse"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
