'use client';

import { useEffect, useState } from 'react';
import { motionEnabled } from '@/lib/motion';

export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [previous, setPrevious] = useState(open);
  if (open !== previous) {
    setPrevious(open);
    if (open) setMounted(true);
    else if (!motionEnabled()) setMounted(false);
  }
  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, mounted, exitMs]);
  return { mounted, closing: mounted && !open };
}
