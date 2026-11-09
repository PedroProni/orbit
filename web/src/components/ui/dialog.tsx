'use client';

import { KeyboardEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeLayer } from '@/hooks/use-escape-layer';
import { usePresence } from '@/hooks/use-presence';
import { cn } from '@/lib/cn';
import { MOTION_BASE_MS } from '@/lib/motion.constants';
import { DIALOG_CONTAINER_CLASS, DIALOG_ENTER_CLASS, DIALOG_EXIT_CLASS, FOCUSABLE_SELECTOR } from './dialog.constants';
import { DialogProps } from './dialog.types';

export function Dialog({ open, onClose, label, closeLabel, variant = 'center', panelClassName, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(open, MOTION_BASE_MS);
  useEscapeLayer(open, onClose);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    if (!panelRef.current?.contains(previous)) panelRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const current = document.activeElement;
    if (event.shiftKey && (current === first || current === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };
  if (!mounted) return null;
  return createPortal(
    <div className={cn('fixed inset-0', DIALOG_CONTAINER_CLASS[variant], closing && 'pointer-events-none')}>
      <button type="button" tabIndex={-1} aria-label={closeLabel} onClick={onClose} className={cn('absolute inset-0 bg-black/55', closing ? 'anim-fade-out' : 'anim-fade-in')} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKeyDown} className={cn('relative outline-none', closing ? DIALOG_EXIT_CLASS[variant] : DIALOG_ENTER_CLASS[variant], panelClassName)}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
