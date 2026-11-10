// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { DragStartEvent, TouchSensor } from '@dnd-kit/core';
import { MousePointerSensor } from '@/lib/mouse-pointer-sensor';
import { touchLiftFeedback, useBoardSensors } from '@/hooks/use-board-sensors';
import { BOARD_POINTER_DISTANCE_PX, BOARD_TOUCH_DELAY_MS, BOARD_TOUCH_TOLERANCE_PX, BOARD_TOUCH_VIBRATE_MS } from '@/hooks/use-board-sensors.constants';

const press = (pointerType: string, button = 0) => ({ nativeEvent: new PointerEvent('pointerdown', { pointerType, button, isPrimary: true }) }) as unknown as ReactPointerEvent;
const startWith = (activatorEvent: Event) => ({ activatorEvent }) as unknown as DragStartEvent;

describe('board drag sensors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('leaves touch pointers to the touch sensor, so a finger never starts a drag by distance', () => {
    const onActivation = vi.fn();
    expect(MousePointerSensor.activators[0].handler(press('touch'), { onActivation })).toBe(false);
    expect(onActivation).not.toHaveBeenCalled();
  });

  it('keeps the mouse and the pen on the distance sensor', () => {
    const onActivation = vi.fn();
    expect(MousePointerSensor.activators[0].handler(press('mouse'), { onActivation })).toBe(true);
    expect(MousePointerSensor.activators[0].handler(press('pen'), { onActivation })).toBe(true);
    expect(onActivation).toHaveBeenCalledTimes(2);
  });

  it('ignores the right mouse button like the stock pointer sensor', () => {
    expect(MousePointerSensor.activators[0].handler(press('mouse', 2), {})).toBe(false);
  });

  it('uses 6 px for the mouse and a 250 ms hold with 6 px tolerance for touch', () => {
    expect(BOARD_POINTER_DISTANCE_PX).toBe(6);
    expect(BOARD_TOUCH_DELAY_MS).toBe(250);
    expect(BOARD_TOUCH_TOLERANCE_PX).toBe(6);
    const { result } = renderHook(() => useBoardSensors());
    expect(result.current.map((descriptor) => descriptor.sensor)).toEqual([MousePointerSensor, TouchSensor]);
    expect(result.current[0].options).toEqual({ activationConstraint: { distance: 6 } });
    expect(result.current[1].options).toEqual({ activationConstraint: { delay: 250, tolerance: 6 } });
  });

  it('gives a short vibration when a touch hold lifts the card, and none for the mouse', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    touchLiftFeedback(startWith(new MouseEvent('pointerdown')));
    expect(vibrate).not.toHaveBeenCalled();
    touchLiftFeedback(startWith(new TouchEvent('touchstart')));
    expect(vibrate).toHaveBeenCalledWith(BOARD_TOUCH_VIBRATE_MS);
  });

  it('does nothing on browsers without vibration, such as Safari on iPhone', () => {
    expect(() => touchLiftFeedback(startWith(new TouchEvent('touchstart')))).not.toThrow();
  });
});
