// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { TaskDrawerHeader } from '@/components/tasks/task-drawer-header';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';

const SPACE = makeSpace({ folders: [{ id: 'f1', name: 'Produto', spaceId: 's1' }], lists: [{ id: 'l1', name: 'Sprint 17', spaceId: 's1', folderId: 'f1', kind: 'list' }] });
const SIBLINGS = [makeTask({ id: 't0', title: 'Anterior' }), makeTask({ id: 't1', title: 'Atual' }), makeTask({ id: 't2', title: 'Seguinte' })];

describe('TaskDrawerHeader', () => {
  beforeEach(() => {
    resetUiStore();
    useUiStore.setState({ openTaskId: 't1' });
    window.localStorage.clear();
    useFavoritesStore.setState({ listIds: [], tasks: [], hydrated: true });
    useToastStore.setState({ items: [] });
  });

  it('shows space, folder and list, each linking to the list and closing the task', () => {
    renderWithProviders(<TaskDrawerHeader task={SIBLINGS[1]} space={SPACE} siblings={SIBLINGS} readOnly={false} people={[]} onToggleWatcher={vi.fn()} />);
    const links = within(screen.getByRole('navigation', { name: 'Location' })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Engineering', 'Produto', 'Sprint 17']);
    expect(links.every((link) => link.getAttribute('href') === '/lists/l1')).toBe(true);
    fireEvent.click(links[2]);
    expect(useUiStore.getState().openTaskId).toBeNull();
  });

  it('moves to the previous and next task of the list and disables the ends', () => {
    const { rerender } = renderWithProviders(<TaskDrawerHeader task={SIBLINGS[1]} space={SPACE} siblings={SIBLINGS} readOnly={false} people={[]} onToggleWatcher={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next task' }));
    expect(useUiStore.getState().openTaskId).toBe('t2');
    fireEvent.click(screen.getByRole('button', { name: 'Previous task' }));
    expect(useUiStore.getState().openTaskId).toBe('t0');
    rerender(<TaskDrawerHeader task={SIBLINGS[0]} space={SPACE} siblings={SIBLINGS} readOnly={false} people={[]} onToggleWatcher={vi.fn()} />);
    expect((screen.getByRole('button', { name: 'Previous task' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('copies the task link and confirms with a toast', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithProviders(<TaskDrawerHeader task={SIBLINGS[1]} space={SPACE} siblings={SIBLINGS} readOnly={false} people={[]} onToggleWatcher={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy task link' }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/t/t1`);
    expect(useToastStore.getState().items.at(-1)?.messageKey).toBe('linkCopied');
  });

  it('toggles the task in favorites, kept in the local store', () => {
    renderWithProviders(<TaskDrawerHeader task={SIBLINGS[1]} space={SPACE} siblings={SIBLINGS} readOnly people={[]} onToggleWatcher={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    expect(useFavoritesStore.getState().tasks).toEqual([{ id: 't1', title: 'Atual' }]);
    expect(screen.getByRole('button', { name: 'Remove from favorites' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Remove from favorites' }));
    expect(useFavoritesStore.getState().tasks).toEqual([]);
  });

  it('hides the watchers bell from a guest', () => {
    renderWithProviders(<TaskDrawerHeader task={SIBLINGS[1]} space={SPACE} siblings={SIBLINGS} readOnly people={[]} onToggleWatcher={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Watchers' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
