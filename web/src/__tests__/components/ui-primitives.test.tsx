// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { Toaster } from '@/components/ui/toaster';
import { ContextMenu } from '@/components/ui/context-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { BoardSkeleton, ListSkeleton } from '@/components/tasks/task-skeletons';
import { SidebarSkeleton } from '@/components/shell/sidebar-skeleton';
import { useToastStore } from '@/stores/toast.store';
import { TOAST_ACTION_TTL_MS, TOAST_MAX_VISIBLE, TOAST_TTL_MS } from '@/stores/toast.constants';
import { useUiStore } from '@/stores/ui.store';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

describe('Toaster', () => {
  beforeEach(() => useToastStore.setState({ items: [] }));

  it('renders translated toasts, dismisses on click and expires after the ttl', () => {
    vi.useFakeTimers();
    renderWithProviders(<Toaster />);
    act(() => useToastStore.getState().push('success', 'created'));
    expect(screen.getByText('Task created')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Task created')).toBeNull();
    act(() => useToastStore.getState().push('error', 'updateFailed'));
    expect(screen.getByText(/reverted/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(TOAST_TTL_MS + 10));
    expect(screen.queryByText(/reverted/)).toBeNull();
    vi.useRealTimers();
  });

  it('runs the toast actions by click and by the 1 and 2 keys, only while nobody is typing, and keeps them on screen longer', () => {
    vi.useFakeTimers();
    nav.push.mockReset();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const actions = [
      { kind: 'open' as const, hotkey: '1', labelKey: 'viewTask', target: '/lists/l9?task=t1', taskId: 't1' },
      { kind: 'copy' as const, hotkey: '2', labelKey: 'copyUrl', target: 'http://localhost/t/t1' },
    ];
    renderWithProviders(
      <>
        <input aria-label="typing" />
        <Toaster />
      </>,
    );
    act(() => useToastStore.getState().push('success', 'taskCreatedIn', { name: 'Write', list: 'Sprint' }, { actions }));
    expect(screen.getByText('Task created: Write in Sprint')).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText('typing'), { key: '1' });
    expect(nav.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(TOAST_TTL_MS + 10));
    expect(screen.getByText('Task created: Write in Sprint')).toBeTruthy();
    fireEvent.keyDown(window, { key: '2' });
    expect(writeText).toHaveBeenCalledWith('http://localhost/t/t1');
    expect(screen.getByText('Link copied')).toBeTruthy();
    act(() => useToastStore.getState().push('success', 'taskCreatedIn', { name: 'Again', list: 'Sprint' }, { actions }));
    fireEvent.keyDown(window, { key: '1' });
    expect(nav.push).toHaveBeenCalledWith('/lists/l9?task=t1');
    act(() => useToastStore.getState().push('success', 'taskCreatedIn', { name: 'Last', list: 'Sprint' }, { actions }));
    fireEvent.click(screen.getByRole('button', { name: /View task/ }));
    expect(nav.push).toHaveBeenCalledTimes(2);
    act(() => useToastStore.getState().push('success', 'taskCreatedIn', { name: 'Gone', list: 'Sprint' }, { actions }));
    act(() => vi.advanceTimersByTime(TOAST_ACTION_TTL_MS + 400));
    expect(screen.queryByText('Task created: Gone in Sprint')).toBeNull();
    vi.useRealTimers();
  });

  it('opens the task drawer in place when the toast points to the list already on screen', () => {
    nav.push.mockReset();
    useUiStore.setState({ openTaskId: null });
    window.history.replaceState(null, '', '/lists/l9');
    renderWithProviders(<Toaster />);
    act(() => useToastStore.getState().push('success', 'taskCreatedIn', { name: 'Here', list: 'Sprint' }, { actions: [{ kind: 'open', hotkey: '1', labelKey: 'viewTask', target: '/lists/l9?task=t7', taskId: 't7' }] }));
    fireEvent.click(screen.getByRole('button', { name: /View task/ }));
    expect(nav.push).not.toHaveBeenCalled();
    expect(useUiStore.getState().openTaskId).toBe('t7');
    window.history.replaceState(null, '', '/');
  });

  it('keeps at most the max visible toasts', () => {
    for (let i = 0; i < TOAST_MAX_VISIBLE + 3; i++) useToastStore.getState().push('info', 'linkCopied');
    expect(useToastStore.getState().items).toHaveLength(TOAST_MAX_VISIBLE);
  });
});

describe('ContextMenu', () => {
  it('opens on right click, runs the action and closes', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContextMenu items={[{ key: 'a', label: 'Do it', onSelect }]}>
        <p>target</p>
      </ContextMenu>,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.contextMenu(screen.getByText('target'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Do it' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('renders the menu in document.body so sibling stacking contexts cannot cover it', () => {
    const { container } = renderWithProviders(
      <ContextMenu items={[{ key: 'a', label: 'Do it', onSelect: vi.fn() }]}>
        <p>target</p>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('target'));
    const menu = screen.getByRole('menu');
    expect(container.contains(menu)).toBe(false);
    expect(menu.parentElement?.parentElement).toBe(document.body);
  });

  it('closes with Escape', () => {
    renderWithProviders(
      <ContextMenu items={[{ key: 'a', label: 'Do it', onSelect: vi.fn() }]}>
        <p>target</p>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('target'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('skeleton and empty states', () => {
  it('renders accessible skeletons with the expected number of blocks', () => {
    const { container, unmount } = renderWithProviders(<ListSkeleton rows={5} />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(container.querySelectorAll('.skeleton').length).toBe(1 + 5 * 4);
    unmount();
    const board = renderWithProviders(<BoardSkeleton columns={3} />);
    expect(board.container.querySelectorAll('section, .w-72').length).toBe(3);
    board.unmount();
    renderWithProviders(<SidebarSkeleton />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders the empty state with its hint', () => {
    renderWithProviders(<EmptyState title="Nothing here" hint="Try again" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
