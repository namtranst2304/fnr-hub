import React from 'react';
import { cn } from '@/lib/utils';

export type CyberVariant = 'cyan' | 'magenta' | 'yellow' | 'red' | 'zinc';
export type CyberSize = 'sm' | 'md' | 'lg';

// ─── CYBER BUTTON ────────────────────────────────────────────────────────────
interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CyberVariant;
  size?: CyberSize;
  fullWidth?: boolean;
  glow?: boolean;
}

export function CyberButton({
  variant = 'cyan',
  size = 'md',
  fullWidth = false,
  glow = true,
  className,
  children,
  ...props
}: CyberButtonProps) {
  const variantStyles = {
    cyan: cn(
      'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20',
      glow && 'shadow-neon-cyan hover:shadow-neon-cyan-hover'
    ),
    magenta: cn(
      'border-neon-magenta text-neon-magenta hover:bg-neon-magenta/20',
      glow && 'shadow-neon-magenta hover:shadow-neon-magenta-hover'
    ),
    yellow: cn(
      'border-neon-yellow text-neon-yellow hover:bg-neon-yellow/20',
      glow && 'shadow-neon-yellow hover:shadow-neon-yellow-hover'
    ),
    red: cn(
      'border-neon-red text-neon-red hover:bg-neon-red/20',
      glow && 'shadow-neon-red hover:shadow-neon-red-hover'
    ),
    zinc: 'border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:bg-zinc-800/30'
  };

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-[10px] tracking-wider',
    md: 'px-6 py-2.5 text-xs tracking-widest',
    lg: 'px-8 py-3.5 text-sm tracking-widest'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 border bg-transparent font-bold uppercase transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none font-mono active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── CYBER CARD ──────────────────────────────────────────────────────────────
interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CyberVariant;
  withCorners?: boolean;
}

export function CyberCard({
  variant = 'zinc',
  withCorners = false,
  className,
  children,
  ...props
}: CyberCardProps) {
  const variantStyles = {
    cyan: 'border-neon-cyan/30 shadow-[0_0_15px_rgba(0,243,255,0.05)]',
    magenta: 'border-neon-magenta/40 shadow-[0_0_15px_rgba(255,0,255,0.05)]',
    yellow: 'border-neon-yellow/40 shadow-[0_0_15px_rgba(252,226,5,0.05)]',
    red: 'border-neon-red/40 shadow-[0_0_15px_rgba(255,0,0,0.05)]',
    zinc: 'border-zinc-800'
  };

  const cornerColor = {
    cyan: 'border-neon-cyan',
    magenta: 'border-neon-magenta',
    yellow: 'border-neon-yellow',
    red: 'border-neon-red',
    zinc: 'border-zinc-500'
  };

  return (
    <div
      className={cn(
        'bg-black/80 p-6 border relative transition-colors duration-300 ease-out',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withCorners && (
        <>
          <div className={cn('absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2', cornerColor[variant])} />
          <div className={cn('absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2', cornerColor[variant])} />
        </>
      )}
      {children}
    </div>
  );
}

// ─── CYBER INPUT ─────────────────────────────────────────────────────────────
interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: CyberVariant;
}

export function CyberInput({
  variant = 'zinc',
  className,
  ...props
}: CyberInputProps) {
  const variantStyles = {
    cyan: 'border-neon-cyan/50 focus:border-neon-cyan text-neon-cyan placeholder:text-neon-cyan/30 shadow-[inset_0_0_8px_rgba(0,243,255,0.05)] focus:shadow-[0_0_10px_rgba(0,243,255,0.1)]',
    magenta: 'border-neon-magenta/50 focus:border-neon-magenta text-neon-magenta placeholder:text-neon-magenta/30 shadow-[inset_0_0_8px_rgba(255,0,255,0.05)] focus:shadow-[0_0_10px_rgba(255,0,255,0.1)]',
    yellow: 'border-neon-yellow/50 focus:border-neon-yellow text-neon-yellow placeholder:text-neon-yellow/30 shadow-[inset_0_0_8px_rgba(252,226,5,0.05)] focus:shadow-[0_0_10px_rgba(252,226,5,0.1)]',
    red: 'border-neon-red/50 focus:border-neon-red text-neon-red placeholder:text-neon-red/30 shadow-[inset_0_0_8px_rgba(255,0,0,0.05)] focus:shadow-[0_0_10px_rgba(255,0,0,0.1)]',
    zinc: 'border-zinc-700 focus:border-zinc-500 text-zinc-200 placeholder:text-zinc-700'
  };

  return (
    <input
      className={cn(
        'px-4 py-2 bg-black border text-sm outline-none transition-all duration-300 ease-out font-mono',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── CYBER TEXTAREA ──────────────────────────────────────────────────────────
interface CyberTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: CyberVariant;
}

export function CyberTextArea({
  variant = 'zinc',
  className,
  ...props
}: CyberTextAreaProps) {
  const variantStyles = {
    cyan: 'border-neon-cyan/50 focus:border-neon-cyan text-neon-cyan placeholder:text-neon-cyan/30 shadow-[inset_0_0_10px_rgba(0,243,255,0.05)] focus:shadow-[0_0_12px_rgba(0,243,255,0.1)]',
    magenta: 'border-neon-magenta/50 focus:border-neon-magenta text-neon-magenta placeholder:text-neon-magenta/30 shadow-[inset_0_0_10px_rgba(255,0,255,0.05)] focus:shadow-[0_0_12px_rgba(255,0,255,0.1)]',
    yellow: 'border-neon-yellow/50 focus:border-neon-yellow text-neon-yellow placeholder:text-neon-yellow/30 shadow-[inset_0_0_10px_rgba(252,226,5,0.05)] focus:shadow-[0_0_12px_rgba(252,226,5,0.1)]',
    red: 'border-neon-red/50 focus:border-neon-red text-neon-red placeholder:text-neon-red/30 shadow-[inset_0_0_10px_rgba(255,0,0,0.05)] focus:shadow-[0_0_12px_rgba(255,0,0,0.1)]',
    zinc: 'border-zinc-700 focus:border-zinc-500 text-zinc-200 placeholder:text-zinc-700'
  };

  return (
    <textarea
      className={cn(
        'w-full bg-black border p-4 outline-none text-sm font-mono transition-all duration-300 ease-out resize-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── CYBER BADGE ─────────────────────────────────────────────────────────────
interface CyberBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: CyberVariant;
  pulse?: boolean;
  withIndicator?: boolean;
}

export function CyberBadge({
  variant = 'cyan',
  pulse = false,
  withIndicator = true,
  className,
  children,
  ...props
}: CyberBadgeProps) {
  const variantStyles = {
    cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan shadow-[0_0_8px_rgba(0,243,255,0.15)]',
    magenta: 'bg-neon-magenta/10 text-neon-magenta border-neon-magenta shadow-[0_0_8px_rgba(255,0,255,0.15)]',
    yellow: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow shadow-[0_0_8px_rgba(252,226,5,0.15)]',
    red: 'bg-neon-red/10 text-neon-red border-neon-red shadow-[0_0_8px_rgba(255,0,0,0.15)]',
    zinc: 'bg-zinc-900/50 text-zinc-500 border-zinc-700'
  };

  const indicatorStyles = {
    cyan: 'bg-neon-cyan shadow-[0_0_8px_#00f3ff]',
    magenta: 'bg-neon-magenta shadow-[0_0_8px_#ff00ff]',
    yellow: 'bg-neon-yellow shadow-[0_0_8px_#fce205]',
    red: 'bg-neon-red shadow-[0_0_8px_#ff0000]',
    zinc: 'bg-zinc-600'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-[3px] border-y border-r font-mono border-t-zinc-800/30 border-b-zinc-800/30 border-r-zinc-800/30 select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withIndicator && (
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-none',
            indicatorStyles[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}
