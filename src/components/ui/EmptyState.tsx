'use client';

import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-3xl shadow-inner">
        {Icon ? <Icon className="w-8 h-8 text-primary" /> : emoji || <Sparkles className="w-8 h-8 text-primary" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
