import { PointerEvent as ReactPointerEvent, RefObject, useRef, useState } from 'react';
import { DRAG_SCROLL_IGNORE, DRAG_SCROLL_THRESHOLD } from './use-drag-scroll.constants';
import { DragScrollStart } from './use-drag-scroll.types';

export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const start = useRef<DragScrollStart | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || event.button !== 0 || event.pointerType !== 'mouse') return;
    if ((event.target as Element).closest(DRAG_SCROLL_IGNORE)) return;
    start.current = { x: event.clientX, left: el.scrollLeft, id: event.pointerId };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const el = ref.current;
    const from = start.current;
    if (!el || !from || from.id !== event.pointerId) return;
    const delta = event.clientX - from.x;
    if (!dragging && Math.abs(delta) < DRAG_SCROLL_THRESHOLD) return;
    if (!dragging) {
      setDragging(true);
      el.setPointerCapture?.(event.pointerId);
    }
    el.scrollLeft = from.left - delta;
  };
  const stop = (event: ReactPointerEvent<HTMLElement>) => {
    if (start.current?.id !== event.pointerId) return;
    start.current = null;
    setDragging(false);
    ref.current?.releasePointerCapture?.(event.pointerId);
  };
  return { dragging, handlers: { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop } };
}
