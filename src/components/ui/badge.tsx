'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
        outline: 'border border-border bg-transparent hover:bg-surface-hover',
        ghost: 'bg-transparent hover:bg-surface-hover',
        success: 'bg-success text-success-foreground hover:bg-success-hover',
        warning: 'bg-warning text-warning-foreground hover:bg-warning-hover',
        light: 'bg-primary-light text-primary hover:bg-primary/90',
      },
      size: {
        xs: 'h-4 gap-0.5 rounded-full px-1.5 text-[10px] [&_svg]:size-2.5',
        sm: 'h-5 gap-1 rounded-full px-2 text-xs [&_svg]:size-3',
        md: 'h-6 gap-1.5 rounded-full px-2.5 text-sm [&_svg]:size-3.5',
        lg: 'h-7 gap-2 rounded-full px-3 text-base [&_svg]:size-4',
      },
      tone: {
        solid: '',
        soft: 'bg-opacity-10 text-on-color',
        outline: 'border border-current bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      tone: 'solid',
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'custom';
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', tone = 'solid', dot, dotColor, removable, onRemove, children, ...props }, ref) => {
    const dotColors = {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
      custom: '',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium whitespace-nowrap transition-all',
          badgeVariants({ variant, size, tone }),
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full',
              'size-1.5',
              dotColors[dotColor || 'primary']
            )}
            aria-hidden="true"
          />
        )}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              'ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
              size === 'xs' && 'size-3',
              size === 'sm' && 'size-3.5',
              size === 'md' && 'size-4',
              size === 'lg' && 'size-4.5'
            )}
            aria-label="Remove"
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };