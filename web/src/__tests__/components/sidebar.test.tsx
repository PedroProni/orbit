// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace } from '../helpers/fixtures';
import { Sidebar } from '@/components/shell/sidebar';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useCreateTaskStore } from '@/stores/create-task.store';

const mocks = vi.hoisted(() => ({ params: {} as { listId?: string }, state: { isLoading: false, data: [] as unknown[] | undefined }, member: false, guest: false }));

vi.mock('next/navigation', () => ({ useParams: () => mocks.params }));
vi.mock('@/hooks/use-orbit', () => ({ useHierarchy: () => mocks.state, useMe: () => ({ data: { name: 'Owner' } }) }));
vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => ({ loaded: true, isGuest: mocks.guest, member: mocks.member, userId: 'u1', canModerateComments: false, canManageAccess: false, canManageStructure: false }) }));

const space = makeSpace({
  folders: [{ id: 'f1', spaceId: 's1', name: 'Q4' }],
  lists: [
    { id: 'l1', spaceId: 's1', folderId: null, name: 'Backlog', kind: 'list' },
    { id: 'l2', spaceId: 's1', folderId: 'f1', name: 'Sprint 12', kind: 'sprint' },
    { id: 'l3', spaceId: 's1', folderId: 'f1', name: 'Roadmap', kind: 'list' },
  ],
});

describe('Sidebar', () => {
  it('shows the loading and empty states', () => {
    mocks.state = { isLoading: true, data: undefined };
    const { unmount } = renderWithProviders(<Sidebar />);
    expect(screen.getByText('Loading...')).toBeTruthy();
    unmount();
    mocks.state = { isLoading: false, data: [] };
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('No spaces yet')).toBeTruthy();
  });

  it('renders the nav links and the space tree with counts', () => {
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Inbox' }).getAttribute('href')).toBe('/inbox');
    const spaceBranch = screen.getByRole('button', { name: /Engineering/ });
    expect(within(spaceBranch).getByText('3')).toBeTruthy();
    const folderBranch = screen.getByRole('button', { name: /Q4/ });
    expect(within(folderBranch).getByText('2')).toBeTruthy();
  });

  it('collapses and expands a folder with aria-expanded', () => {
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    const folder = screen.getByRole('button', { name: /Q4/ });
    expect(folder.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Sprint 12')).toBeTruthy();
    fireEvent.click(folder);
    expect(folder.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Sprint 12')).toBeNull();
    fireEvent.click(folder);
    expect(screen.getByText('Sprint 12')).toBeTruthy();
  });

  it('collapses the whole space', () => {
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: /Engineering/ }));
    expect(screen.queryByText('Backlog')).toBeNull();
    expect(screen.queryByText('Q4')).toBeNull();
  });

  it('uses the sprint icon for sprint lists and the list icon otherwise', () => {
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Sprint 12' }).querySelector('svg.lucide-zap')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Roadmap' }).querySelector('svg.lucide-zap')).toBeNull();
    expect(screen.getByRole('link', { name: 'Roadmap' }).querySelector('svg.lucide-list')).toBeTruthy();
  });

  it('marks the active list from the route params', () => {
    mocks.params = { listId: 'l3' };
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Roadmap' }).className).toContain('bg-accentsoft');
    expect(screen.getByRole('link', { name: 'Backlog' }).className).not.toContain('bg-accentsoft');
    mocks.params = {};
  });

  it('shows a Favorites block after starring a list and removes it when unstarred', () => {
    window.localStorage.clear();
    useFavoritesStore.setState({ listIds: [], hydrated: false });
    mocks.state = { isLoading: false, data: [space] };
    renderWithProviders(<Sidebar />);
    expect(screen.queryByText('Favorites')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add Roadmap to favorites' }));
    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Roadmap' })).toHaveLength(2);
    expect(JSON.parse(window.localStorage.getItem('orbit.favorites') ?? '[]')).toEqual(['l3']);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Roadmap from favorites' })[0]);
    expect(screen.queryByText('Favorites')).toBeNull();
  });

  it('opens the create form from New task on the current list for a member, and hides it from a guest', () => {
    mocks.state = { isLoading: false, data: [space] };
    mocks.params = { listId: 'l2' };
    mocks.member = false;
    mocks.guest = true;
    const { unmount } = renderWithProviders(<Sidebar />);
    expect(screen.queryByRole('button', { name: 'New task' })).toBeNull();
    unmount();
    mocks.guest = false;
    mocks.member = true;
    useCreateTaskStore.setState({ open: false, session: 0, defaults: { listId: null } });
    renderWithProviders(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    expect(useCreateTaskStore.getState()).toMatchObject({ open: true, session: 1, defaults: { listId: 'l2' } });
    mocks.member = false;
    mocks.params = {};
  });
});
