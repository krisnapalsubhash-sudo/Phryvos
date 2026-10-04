'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const avatarSizeClasses = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-20 text-xl',
  xxl: 'size-32 text-2xl',
} as const;

const statusDotSizes = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
  xl: 'size-4',
  xxl: 'size-5',
} as const;

const statusDotColors = {
  online: 'bg-green-500 ring-background',
  away: 'bg-amber-500 ring-background',
  busy: 'bg-red-500 ring-background',
  offline: 'bg-muted ring-background',
} as const;

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: keyof typeof avatarSizeClasses;
  status?: keyof typeof statusDotColors;
  badge?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Avatar({
  src, alt, name, size = 'md', status, badge, fallback, className, ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!src);

  const fallbackContent = fallback ?? (
    <div className="flex size-full items-center justify-center bg-primary/10 text-primary font-medium">
      {getInitials(name)}
    </div>
  );

  return (
    <div className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full', avatarSizeClasses[size], className)} {...props}>
      {!imageError && src && (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="aspect-square size-full object-cover transition-opacity duration-150"
          style={{ opacity: isLoading ? 0 : 1 }}
          onLoad={() => setIsLoading(false)}
          onError={() => setImageError(true)}
        />
      )}
      {(imageError || !src) && fallbackContent}
      {status && (
        <span className={cn('absolute bottom-0 right-0 rounded-full ring-2', statusDotSizes[size], statusDotColors[status])} aria-label={`Status: ${status}`} />
      )}
      {badge && (
        <span className="absolute bottom-0 right-0 flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );
}

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
}

export function AvatarGroup({ children, max = 5, className, ...props }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children).filter(React.isValidElement);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <span key={index} className="ring-2 ring-background" style={{ zIndex: visibleChildren.length - index }}>
          {child}
        </span>
      ))}
      {remainingCount > 0 && (
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-text-secondary ring-2 ring-background">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

AvatarGroup.displayName = 'AvatarGroup';