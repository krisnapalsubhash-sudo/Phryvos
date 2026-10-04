'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'media' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  pressed?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable, pressed, loading, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-120 ease-out';
    const variantStyles = {
      default: 'bg-surface border border-border shadow-sm',
      elevated: 'bg-surface-elevated border border-border shadow-md',
      interactive: 'bg-surface border border-border shadow-sm cursor-pointer hover:bg-surface-hover hover:shadow-md active:bg-surface-active active:shadow-sm',
      media: 'bg-surface border border-border shadow-sm overflow-hidden',
      outlined: 'bg-transparent border-2 border-border',
    };
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };
    const hoverStyles = hoverable ? 'hover:bg-surface-hover hover:shadow-md' : '';
    const pressedStyles = pressed ? 'bg-surface-active active:shadow-sm' : '';
    const loadingStyles = loading ? 'relative overflow-hidden' : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-120 ease-out',
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          pressedStyles,
          loadingStyles,
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-text-secondary">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}
        {children}
      </div>
    )
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  as?: React.ElementType;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, asChild = false, as, ...props }, ref) => {
    const Comp = asChild ? 'span' : (as || 'h3');
    return (
      <Comp
        ref={ref}
        className={cn('text-lg font-semibold text-text-primary leading-tight', className)}
        {...props}
      />
    )
  }
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary mt-1', className)} {...props} />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pb-4', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center px-4 py-3 border-t border-border', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';

interface CardActionProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardAction = React.forwardRef<HTMLDivElement, CardActionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
  )
);

CardAction.displayName = 'CardAction';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction };