'use client';

import React from 'react';

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`p-5 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse space-y-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-white/10 rounded-md" />
          <div className="h-3 w-20 bg-white/5 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-white/10 rounded-md" />
        <div className="h-4 w-4/5 bg-white/10 rounded-md" />
      </div>
      <div className="h-44 w-full rounded-xl bg-white/5" />
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div role="status" aria-label="Loading messages..." className="p-4 space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-white/10 rounded-md" />
              <div className="h-3 w-10 bg-white/5 rounded-md" />
            </div>
            <div className="h-3.5 w-44 bg-white/5 rounded-md" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading messages...</span>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div role="status" aria-label="Loading profile..." className="space-y-6 animate-pulse">
      <div className="h-48 w-full rounded-2xl bg-white/5" />
      <div className="px-6 -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
        <div className="w-28 h-28 rounded-full border-4 border-background bg-white/10" />
        <div className="h-10 w-32 rounded-full bg-white/10" />
      </div>
      <div className="px-6 space-y-3">
        <div className="h-6 w-48 bg-white/10 rounded-md" />
        <div className="h-4 w-32 bg-white/5 rounded-md" />
        <div className="h-4 w-full max-w-md bg-white/5 rounded-md" />
      </div>
      <span className="sr-only">Loading profile...</span>
    </div>
  );
}
