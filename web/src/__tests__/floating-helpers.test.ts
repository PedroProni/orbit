import { describe, expect, it } from 'vitest';
import { placeFloating } from '@/components/ui/floating.helpers';

const viewport = { width: 1000, height: 800 };
const size = { width: 200, height: 300 };

describe('placeFloating', () => {
  it('opens below the anchor when there is room', () => {
    expect(placeFloating({ left: 100, top: 100, width: 80, height: 30 }, size, viewport, 'start')).toEqual({ left: 100, top: 134, above: false });
  });

  it('flips above the anchor when the bottom has no room', () => {
    expect(placeFloating({ left: 100, top: 700, width: 80, height: 30 }, size, viewport, 'start')).toEqual({ left: 100, top: 396, above: true });
  });

  it('aligns the right edges when asked', () => {
    expect(placeFloating({ left: 400, top: 100, width: 80, height: 30 }, size, viewport, 'end').left).toBe(280);
  });

  it('never leaves the viewport on either side', () => {
    expect(placeFloating({ left: 950, top: 100, width: 40, height: 30 }, size, viewport, 'start').left).toBe(792);
    expect(placeFloating({ left: 10, top: 100, width: 40, height: 30 }, size, viewport, 'end').left).toBe(8);
  });

  it('stays inside a viewport that fits it neither above nor below', () => {
    const small = { width: 390, height: 320 };
    const result = placeFloating({ left: 10, top: 150, width: 80, height: 30 }, size, small, 'start');
    expect(result.top).toBe(12);
    expect(result.above).toBe(false);
  });
});
