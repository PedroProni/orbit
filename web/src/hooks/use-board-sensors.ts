import { DragStartEvent, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { MousePointerSensor } from '@/lib/mouse-pointer-sensor';
import { BOARD_POINTER_DISTANCE_PX, BOARD_TOUCH_DELAY_MS, BOARD_TOUCH_TOLERANCE_PX, BOARD_TOUCH_VIBRATE_MS } from './use-board-sensors.constants';

export function useBoardSensors() {
  return useSensors(useSensor(MousePointerSensor, { activationConstraint: { distance: BOARD_POINTER_DISTANCE_PX } }), useSensor(TouchSensor, { activationConstraint: { delay: BOARD_TOUCH_DELAY_MS, tolerance: BOARD_TOUCH_TOLERANCE_PX } }));
}

export function touchLiftFeedback(event: DragStartEvent) {
  if (typeof TouchEvent === 'undefined' || !(event.activatorEvent instanceof TouchEvent)) return;
  if (typeof navigator.vibrate === 'function') navigator.vibrate(BOARD_TOUCH_VIBRATE_MS);
}
