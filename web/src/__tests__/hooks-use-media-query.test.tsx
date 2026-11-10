// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/use-media-query';

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('follows the media query when the viewport changes and stops listening on unmount', () => {
    let matches = false;
    const listeners = new Set<() => void>();
    const list = {
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    };
    vi.stubGlobal('matchMedia', vi.fn(() => list));
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'));
    expect(result.current).toBe(false);
    act(() => {
      matches = true;
      listeners.forEach((fn) => fn());
    });
    expect(result.current).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('answers false when matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));
    expect(result.current).toBe(false);
  });
});
