'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
   variant?: 'text' | 'circular' | 'rectangular' | 'avatar' | 'post' | 'card';
   lines?: number;
   animated?: boolean;
   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
 }

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
   ({ className, variant = 'rectangular', lines = 1, animated = true, size, ...props }, ref) => {
     const baseStyles = 'bg-skeleton-base overflow-hidden';
     const animatedStyles = animated ? 'animate-shimmer' : '';

     const variantStyles = {
       text: 'h-4 w-full rounded-sm',
       circular: 'rounded-full',
       rectangular: 'rounded-lg',
       avatar: 'rounded-full',
       post: 'rounded-xl',
       card: 'rounded-xl',
     };

     const lineCount = Math.max(1, lines);

     if (variant === 'text' && lineCount > 1) {
       return (
         <div ref={ref} className={cn('space-y-2', className)} {...props}>
           {Array.from({ length: lineCount }, (_, i) => (
             <div
               key={i}
               ref={i === 0 ? ref : undefined}
               className={cn(baseStyles, variantStyles.text, animatedStyles, 'w-full', i === lineCount - 1 && 'w-3/4')}
             />
           ))}
         </div>
       );
     }

     // Size mapping for different variants
     const sizeMap = {
       avatar: { xs: 'size-6', sm: 'size-8', md: 'size-10', lg: 'size-12', xl: 'size-20', xxl: 'size-32' },
       post: 'aspect-video w-full',
       card: 'aspect-video w-full',
       circular: 'aspect-square',
       rectangular: 'h-16 w-full',
     };

     // Get the size class based on variant and size prop
     let sizeClass = 'h-16 w-full'; // default size
     if (sizeMap[variant as keyof typeof sizeMap]) {
       const variantSizeMap = sizeMap[variant as keyof typeof sizeMap];
       if (typeof variantSizeMap === 'string') {
         sizeClass = variantSizeMap;
       } else {
         // It's an object (like avatar sizes)
         sizeClass = variantSizeMap[size ?? 'md'] || variantSizeMap.md;
       }
     }

     return (
       <div
         ref={ref}
         className={cn(
           baseStyles,
           variantStyles[variant as keyof typeof variantStyles],
           animatedStyles,
           sizeClass,
           className
         )}
         {...props}
       />
     );
   }
 );

Skeleton.displayName = 'Skeleton';

export { Skeleton };

export function PostSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton variant="avatar" size="md" className="shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
      <Skeleton variant="post" />
      <div className="px-4 space-y-2">
        <Skeleton variant="text" className="w-1/4 h-4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
      <div className="flex items-center gap-2 px-4 py-2">
        <Skeleton variant="avatar" size="xs" />
        <Skeleton variant="text" className="w-20 h-3" />
        <Skeleton variant="text" className="w-16 h-3" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" size="md" />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
      <Skeleton variant="card" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3 h-4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-start">
        <Skeleton className="max-w-[70%] h-8 rounded-2xl bg-muted" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="max-w-[60%] h-8 rounded-2xl bg-primary" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="max-w-[80%] h-8 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="avatar" size="md" className="shrink-0" />
        ))}
      </div>
      {[...Array(count)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChatListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-1 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
          <Skeleton variant="avatar" size="lg" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton variant="text" className="w-1/3 h-4" />
            <Skeleton variant="text" className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-6">
      <div className="aspect-[5/2] w-full rounded-2xl bg-skeleton-base" />
      <div className="px-4 -mt-10 relative z-10 space-y-4">
        <div className="flex items-end gap-4">
          <Skeleton variant="avatar" size="xxl" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="w-1/3 h-6" />
            <Skeleton variant="text" className="w-1/4 h-4" />
          </div>
        </div>
        <Skeleton variant="text" className="w-3/4 h-4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center flex-1">
              <Skeleton variant="text" className="w-full h-6 mx-auto mb-1" />
              <Skeleton variant="text" className="w-full h-3 mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 px-3 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex border-b border-border">
        {['Discover', 'Activity', 'Connections'].map((tab) => (
          <Skeleton key={tab} className="flex-1 h-8 rounded-t-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} variant="post" />
        ))}
      </div>
    </div>
  );
}

export function RadarSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-8" />
        <div className="flex gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="aspect-square relative bg-skeleton-base rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="size-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-full h-14 rounded-xl bg-primary" />
      <Skeleton variant="text" className="w-1/3 h-4" />
    </div>
  );
}