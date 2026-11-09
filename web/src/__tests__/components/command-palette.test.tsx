// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace, resetUiStore } from '../helpers/fixtures';
import { CommandPalette } from '@/components/shell/command-palette';
import { useUiStore } from '@/stores/ui.store';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/hooks/use-orbit', () => ({
  useHierarchy: () => ({ data: [makeSpace({ lists: [{ id: 'l1', spaceId: 's1', folderId: null, name: 'Backlog', kind: 'list' }, { id: 'l2', spaceId: 's1', folderId: null, name: 'Sprint 12', kind: 'sprint' }] })] }),
  useSearch: () => ({ data: undefined }),
}));
vi.mock('@/hooks/use-workspace', () => ({ useDocs: () => ({ data: [{ id: 'd1', title: 'Retro notes', spaceId: null, parentId: null, updatedAt: '2026-01-01' }] }) }));

describe('CommandPalette', () => {
  beforeEach(() => {
    mocks.push.mockClear();
    resetUiStore();
    useUiStore.setState({ paletteOpen: true });
  });

  it('filters by typing and runs the active item with Enter', () => {
    renderWithProviders(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sprint' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mocks.push).toHaveBeenCalledWith('/lists/l2');
    expect(useUiStore.getState().paletteOpen).toBe(false);
  });

  it('moves the selection with the arrow keys', () => {
    renderWithProviders(<CommandPalette />);
    const input = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('lists docs and switches the view through actions, closing on Escape', () => {
    renderWithProviders(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'retro' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mocks.push).toHaveBeenCalledWith('/docs');
    useUiStore.setState({ paletteOpen: true });
    fireEvent.change(input, { target: { value: 'board view' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useUiStore.getState().view).toBe('board');
    useUiStore.setState({ paletteOpen: true });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(useUiStore.getState().paletteOpen).toBe(false);
  });

  it('shows the empty message when nothing matches', () => {
    renderWithProviders(<CommandPalette />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'qqqqq' } });
    expect(screen.getByText('Nothing found')).toBeTruthy();
  });
});
