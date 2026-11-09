// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRealtime } from '@/hooks/use-orbit';
import { useSessionStore } from '@/stores/session.store';

const mocks = vi.hoisted(() => ({ sources: [] as { url: string; events: string[]; handlers: (() => void)[]; close: ReturnType<typeof vi.fn>; onmessage: (() => void) | null }[] }));

class FakeEventSource {
  url: string;
  events: string[] = [];
  handlers: (() => void)[] = [];
  close = vi.fn();
  onmessage: (() => void) | null = null;
  constructor(url: string) {
    this.url = url;
    mocks.sources.push(this);
  }
  addEventListener(name: string, handler: () => void) {
    this.events.push(name);
    this.handlers.push(handler);
  }
}

const mount = (enabled: boolean) => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { invalidate, ...renderHook(() => useRealtime(enabled), { wrapper }) };
};

describe('live updates and the session', () => {
  beforeEach(() => {
    mocks.sources.length = 0;
    vi.stubGlobal('EventSource', FakeEventSource);
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('connects through the cookie, with no token in the address', () => {
    mount(true);
    expect(mocks.sources.map((source) => source.url)).toEqual(['/backend/events']);
  });

  it('does not connect without a session or when turned off', () => {
    useSessionStore.setState({ authenticated: false, hydrated: true });
    mount(true);
    cleanup();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    mount(false);
    expect(mocks.sources).toEqual([]);
  });

  it('hangs up when the session ends', () => {
    const { rerender } = mount(true);
    useSessionStore.setState({ authenticated: false, hydrated: true });
    rerender();
    expect(mocks.sources[0].close).toHaveBeenCalledTimes(1);
  });

  it('hangs up when the screen closes', () => {
    const { unmount } = mount(true);
    unmount();
    expect(mocks.sources[0].close).toHaveBeenCalledTimes(1);
  });

  it('refreshes what changed on each event', () => {
    const { invalidate } = mount(true);
    const source = mocks.sources[0];
    expect(source.events).toEqual(['task.created', 'task.updated', 'task.deleted', 'comment.created', 'comment.updated', 'comment.deleted']);
    source.handlers[0]();
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([['tasks'], ['task'], ['comments'], ['notifications'], ['assignee-counts']]);
    invalidate.mockClear();
    source.onmessage?.();
    expect(invalidate).toHaveBeenCalledTimes(5);
  });
});
