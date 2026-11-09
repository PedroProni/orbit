'use client';

import { RefObject, useLayoutEffect } from 'react';
import { placeFloating } from './floating.helpers';
import { FloatingOptions } from './floating.types';

export function useFloating(active: boolean, anchorRef: RefObject<HTMLElement | null>, floatingRef: RefObject<HTMLElement | null>, { align = 'start', matchWidth = false }: FloatingOptions = {}): void {
  useLayoutEffect(() => {
    if (!active) return;
    const place = () => {
      const anchor = anchorRef.current;
      const floating = floatingRef.current;
      if (!anchor || !floating) return;
      const rect = anchor.getBoundingClientRect();
      if (matchWidth) floating.style.minWidth = `${rect.width}px`;
      const position = placeFloating(rect, { width: floating.offsetWidth, height: floating.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, align);
      floating.style.left = `${position.left}px`;
      floating.style.top = `${position.top}px`;
      floating.style.transformOrigin = position.above ? 'bottom' : 'top';
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [active, anchorRef, floatingRef, align, matchWidth]);
}
