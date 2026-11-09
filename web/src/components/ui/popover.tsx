'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeLayer } from '@/hooks/use-escape-layer';
import { usePresence } from '@/hooks/use-presence';
import { cn } from '@/lib/cn';
import { MOTION_FAST_MS } from '@/lib/motion.constants';
import { PopoverProps } from './popover.types';
import { insideLaterLayer } from './floating.helpers';
import { useFloating } from './use-floating';

export function Popover({ open, anchorRef, onClose, children, id, role, label, align, matchWidth, className }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(open, MOTION_FAST_MS);
  useFloating(mounted, anchorRef, ref, { align, matchWidth });
  useEscapeLayer(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchorRef.current?.contains(target) || insideLaterLayer(ref.current, target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, anchorRef, onClose]);
  if (!mounted) return null;
  return createPortal(
    <div
      ref={ref}
      data-floating-layer=""
      id={id}
      role={role}
      aria-label={label}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (open && next && !ref.current?.contains(next) && !anchorRef.current?.contains(next) && !insideLaterLayer(ref.current, next)) onClose();
      }}
      className={cn('fixed left-0 top-0 z-[90] rounded-lg border border-linestrong bg-raised shadow-floating', closing ? 'anim-pop-out pointer-events-none' : 'anim-pop-in', className)}
    >
      {children}
    </div>,
    document.body,
  );
}
