'use client';

import { useLayoutEffect, useRef } from 'react';
import { motionEnabled } from '@/lib/motion';
import { EASE_OUT, LIST_ENTER_OFFSET_PX, LIST_GHOST_Z_INDEX, LIST_MOTION_MAX_CHANGES, LIST_MOTION_MAX_ITEMS, MOTION_BASE_MS } from '@/lib/motion.constants';
import { ListMotionEntry } from './use-list-motion.types';

const measure = (root: HTMLElement): Map<string, ListMotionEntry> => {
  const origin = root.getBoundingClientRect();
  const entries = new Map<string, ListMotionEntry>();
  for (const node of root.querySelectorAll<HTMLElement>(':scope > [data-motion-key]')) {
    const rect = node.getBoundingClientRect();
    entries.set(node.dataset.motionKey as string, { node, left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height });
  }
  return entries;
};

const showGhost = (root: HTMLElement, entry: ListMotionEntry): void => {
  const origin = root.getBoundingClientRect();
  const ghost = entry.node.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, { position: 'fixed', left: `${origin.left + entry.left}px`, top: `${origin.top + entry.top}px`, width: `${entry.width}px`, height: `${entry.height}px`, margin: '0', pointerEvents: 'none', zIndex: LIST_GHOST_Z_INDEX, listStyle: 'none' });
  ghost.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ghost);
  ghost.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.98)' }], { duration: MOTION_BASE_MS, easing: EASE_OUT }).onfinish = () => ghost.remove();
};

const play = (root: HTMLElement, before: Map<string, ListMotionEntry>, after: Map<string, ListMotionEntry>): void => {
  const added = [...after.keys()].filter((key) => !before.has(key));
  const removed = [...before.keys()].filter((key) => !after.has(key));
  if (added.length + removed.length > LIST_MOTION_MAX_CHANGES) return;
  for (const key of removed) showGhost(root, before.get(key) as ListMotionEntry);
  for (const [key, entry] of after) {
    const old = before.get(key);
    if (!old) {
      entry.node.animate([{ opacity: 0, transform: `translateY(-${LIST_ENTER_OFFSET_PX}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: MOTION_BASE_MS, easing: EASE_OUT });
      continue;
    }
    const dx = old.left - entry.left;
    const dy = old.top - entry.top;
    if (dx !== 0 || dy !== 0) entry.node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: MOTION_BASE_MS, easing: EASE_OUT });
  }
};

export function useListMotion<T extends HTMLElement>(keys: string[]) {
  const ref = useRef<T>(null);
  const previous = useRef<Map<string, ListMotionEntry> | null>(null);
  const signature = keys.join('|');
  const count = keys.length;
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || count > LIST_MOTION_MAX_ITEMS || !motionEnabled()) {
      previous.current = null;
      return;
    }
    const after = measure(root);
    const before = previous.current;
    previous.current = after;
    if (before) play(root, before, after);
  }, [signature, count]);
  return ref;
}
