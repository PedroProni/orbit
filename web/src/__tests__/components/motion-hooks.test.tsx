// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { useListMotion } from '@/hooks/use-list-motion';
import { useEscapeLayer } from '@/hooks/use-escape-layer';
import { usePresence } from '@/hooks/use-presence';
import { motionEnabled } from '@/lib/motion';
import { useToastStore } from '@/stores/toast.store';

const enableMotion = (reduced = false) => {
  const animate = vi.fn(() => ({ onfinish: null }));
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, writable: true, value: animate });
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: () => ({ matches: reduced }) });
  return animate;
};

const disableMotion = () => {
  Reflect.deleteProperty(Element.prototype, 'animate');
  Reflect.deleteProperty(window, 'matchMedia');
};

function List({ keys }: { keys: string[] }) {
  const ref = useListMotion<HTMLUListElement>(keys);
  return (
    <ul ref={ref}>
      {keys.map((key) => (
        <li key={key} data-motion-key={key}>
          {key}
        </li>
      ))}
    </ul>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ items: [] });
});

afterEach(() => {
  vi.useRealTimers();
  disableMotion();
  document.body.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
});

describe('motionEnabled', () => {
  it('is off when the browser asks for reduced motion', () => {
    enableMotion(true);
    expect(motionEnabled()).toBe(false);
  });

  it('is on when the browser can animate and nothing asks otherwise', () => {
    enableMotion();
    expect(motionEnabled()).toBe(true);
  });
});

describe('usePresence', () => {
  it('stays mounted during the exit and unmounts after it', () => {
    enableMotion();
    const { result, rerender } = renderHook(({ open }) => usePresence(open, 100), { initialProps: { open: true } });
    rerender({ open: false });
    expect(result.current).toEqual({ mounted: true, closing: true });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toEqual({ mounted: false, closing: false });
  });

  it('unmounts at once with reduced motion', () => {
    enableMotion(true);
    const { result, rerender } = renderHook(({ open }) => usePresence(open, 100), { initialProps: { open: true } });
    rerender({ open: false });
    expect(result.current).toEqual({ mounted: false, closing: false });
  });

  it('cancels the exit when reopened in the middle of it', () => {
    enableMotion();
    const { result, rerender } = renderHook(({ open }) => usePresence(open, 100), { initialProps: { open: true } });
    rerender({ open: false });
    act(() => vi.advanceTimersByTime(50));
    rerender({ open: true });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toEqual({ mounted: true, closing: false });
  });
});

describe('useEscapeLayer', () => {
  it('only the topmost layer handles Escape, then the one below', () => {
    const below = vi.fn();
    const above = vi.fn();
    const first = renderHook(() => useEscapeLayer(true, below));
    const second = renderHook(() => useEscapeLayer(true, above));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(above).toHaveBeenCalledTimes(1);
    expect(below).not.toHaveBeenCalled();
    second.unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(below).toHaveBeenCalledTimes(1);
    first.unmount();
  });

  it('ignores other keys', () => {
    const close = vi.fn();
    const layer = renderHook(() => useEscapeLayer(true, close));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(close).not.toHaveBeenCalled();
    layer.unmount();
  });
});

describe('useListMotion', () => {
  it('animates only the new row and leaves a ghost for the removed one', () => {
    const animate = enableMotion();
    const view = render(<List keys={['a', 'b']} />);
    expect(animate).not.toHaveBeenCalled();
    view.rerender(<List keys={['a', 'c']} />);
    expect(animate).toHaveBeenCalledTimes(2);
    const ghost = document.body.querySelector(':scope > [data-motion-key="b"]');
    expect(ghost?.getAttribute('aria-hidden')).toBe('true');
    const frames = animate.mock.calls.flat().filter(Array.isArray) as Keyframe[][];
    frames.flat().forEach((frame) => expect(Object.keys(frame).every((key) => key === 'opacity' || key === 'transform')).toBe(true));
  });

  it('skips a bulk change', () => {
    const animate = enableMotion();
    const view = render(<List keys={['a']} />);
    view.rerender(<List keys={Array.from({ length: 20 }, (_, index) => `n${index}`)} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('does nothing with reduced motion', () => {
    const animate = enableMotion(true);
    const view = render(<List keys={['a']} />);
    view.rerender(<List keys={['a', 'b']} />);
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('toast exit', () => {
  it('marks the toast as leaving before removing it', () => {
    enableMotion();
    useToastStore.getState().push('info', 'toast.created');
    const { id } = useToastStore.getState().items[0];
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().items[0].leaving).toBe(true);
    vi.advanceTimersByTime(180);
    expect(useToastStore.getState().items).toEqual([]);
  });

  it('removes the toast at once with reduced motion', () => {
    enableMotion(true);
    useToastStore.getState().push('info', 'toast.created');
    useToastStore.getState().dismiss(useToastStore.getState().items[0].id);
    expect(useToastStore.getState().items).toEqual([]);
  });
});
