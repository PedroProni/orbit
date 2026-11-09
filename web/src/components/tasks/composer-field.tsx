'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { Popover } from '@/components/ui/popover';
import { ComposerFieldProps } from './composer-field.types';

export function ComposerField({ label, icon, value, active, open, onToggle, onClose, children, look = 'icon', align }: ComposerFieldProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      {look === 'line' ? (
        <button
          ref={anchorRef}
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={onToggle}
          className={cn('flex min-h-7 w-full min-w-0 items-center gap-2 rounded px-1 text-left text-xs transition-colors hover:bg-panel', active ? 'text-fg' : 'text-muted hover:text-fg')}
        >
          <span className="flex w-4 shrink-0 justify-center">{icon}</span>
          <span className="min-w-0 flex-1 truncate">{value ?? label}</span>
        </button>
      ) : (
        <button
          ref={anchorRef}
          type="button"
          aria-label={label}
          title={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={onToggle}
          className={cn('flex h-6 min-w-6 shrink-0 items-center justify-center gap-1 rounded px-1 text-xs transition-colors hover:bg-panel hover:text-fg', active ? 'text-fg' : 'text-muted')}
        >
          {icon}
          {value}
        </button>
      )}
      <Popover open={open} anchorRef={anchorRef} onClose={onClose} label={label} role="dialog" align={align}>
        {children}
      </Popover>
    </>
  );
}
