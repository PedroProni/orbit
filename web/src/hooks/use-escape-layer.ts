'use client';

import { useEffect, useRef } from 'react';
import { pushEscapeLayer } from '@/lib/layers';

export function useEscapeLayer(active: boolean, onEscape: () => void): void {
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  }, [onEscape]);
  useEffect(() => {
    if (!active) return;
    return pushEscapeLayer(() => latest.current());
  }, [active]);
}
