import { FLOATING_GAP_PX, FLOATING_LAYER_SELECTOR, FLOATING_VIEWPORT_MARGIN_PX } from './floating.constants';
import { FloatingAlign, FloatingBox, FloatingPosition } from './floating.types';

export function placeFloating(anchor: FloatingBox, size: { width: number; height: number }, viewport: { width: number; height: number }, align: FloatingAlign): FloatingPosition {
  const below = anchor.top + anchor.height + FLOATING_GAP_PX;
  const fitsBelow = below + size.height <= viewport.height - FLOATING_VIEWPORT_MARGIN_PX;
  const fitsAbove = anchor.top - FLOATING_GAP_PX - size.height >= FLOATING_VIEWPORT_MARGIN_PX;
  const above = !fitsBelow && fitsAbove;
  const rawTop = above ? anchor.top - FLOATING_GAP_PX - size.height : below;
  const rawLeft = align === 'end' ? anchor.left + anchor.width - size.width : anchor.left;
  const maxLeft = viewport.width - size.width - FLOATING_VIEWPORT_MARGIN_PX;
  const maxTop = viewport.height - size.height - FLOATING_VIEWPORT_MARGIN_PX;
  return { left: Math.max(FLOATING_VIEWPORT_MARGIN_PX, Math.min(rawLeft, maxLeft)), top: Math.max(FLOATING_VIEWPORT_MARGIN_PX, Math.min(rawTop, maxTop)), above };
}

export function insideLaterLayer(own: HTMLElement | null, target: Node | null): boolean {
  if (!own || !target) return false;
  const layer = (target instanceof Element ? target : target.parentElement)?.closest(FLOATING_LAYER_SELECTOR);
  return !!layer && layer !== own && !own.contains(layer) && Boolean(own.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING);
}
