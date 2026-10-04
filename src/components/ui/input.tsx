'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, clearable, disabled, required, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useMemo(() => {
      if (!ref) return inputRef;
      if (typeof ref === 'function') {
        return (el: HTMLInputElement | null) => {
          inputRef.current = el;
          ref(el);
        };
      }
      inputRef.current = ref.current;
      return inputRef;
    }, [ref]);

    const [value, setValue] = React.useState(props.defaultValue || '');
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value);
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setValue('');
      props.onChange?.({ target: { name: props.name, value: '' } } as React.ChangeEvent<HTMLInputElement>);
      inputRef.current?.focus();
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
            {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, hintId)}
            className={cn(
              'w-full text-text-primary placeholder-text-tertiary',
              'bg-surface border border-border',
              'rounded-lg px-4 py-3 text-sm',
              'transition-all duration-120 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary',
              'disabled:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-border-strong',
              error && 'border-destructive focus:ring-destructive focus:border-destructive',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              clearable && value && 'pr-10',
            )}
            {...props}
          />
          {(clearable && value && !disabled && !error) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Clear input"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {rightIcon && !clearable && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Input.displayName = 'Input';

export { Input };