'use client';

import { useEffect, useRef } from 'react';
import { useUiStore } from '@/stores/ui.store';
import { SHORTCUT_VIEW_KEYS, SHORTCUT_CHORD_MS } from '@/hooks/use-shortcuts.constants';
import { isTyping } from '@/lib/typing-target';
import { triggerNewTask } from '@/lib/new-task-trigger';

export function useShortcuts(canCreate: boolean) {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setView = useUiStore((s) => s.setView);
  const chord = useRef<number>(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(!useUiStore.getState().paletteOpen);
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (chord.current && Date.now() - chord.current < SHORTCUT_CHORD_MS) {
        const view = SHORTCUT_VIEW_KEYS[e.key.toLowerCase()];
        chord.current = 0;
        if (view) setView(view);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-shortcut="search"]')?.focus();
      } else if (e.key === 'c' && canCreate) {
        e.preventDefault();
        triggerNewTask();
      } else if (e.key === 'g') {
        chord.current = Date.now();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen, setView, canCreate]);
}
