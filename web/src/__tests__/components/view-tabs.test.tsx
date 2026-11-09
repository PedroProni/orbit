// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { resetUiStore } from '../helpers/fixtures';
import { ViewTabs } from '@/components/tasks/view-tabs';
import { ViewChanges } from '@/components/tasks/view-changes';
import { orbitService } from '@/services/orbit.service';
import { DEFAULT_DISPLAY, EMPTY_FILTERS } from '@/stores/ui.constants';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { ApiError } from '@/lib/api-client';
import { Principal, SavedView, UserRole } from '@/types/api.types';
import { useSessionStore } from '@/stores/session.store';

const principal = (role: UserRole): Principal => ({ id: 'u1', email: 'a@x.io', name: 'Ana', avatarUrl: null, role, status: 'active', workspaceId: 'w', scopes: [] });
const makeView = (over: Partial<SavedView> = {}): SavedView => ({ id: 'v1', ownerId: 'u1', name: 'Bugs', viewType: 'board', listId: 'l1', filters: { ...EMPTY_FILTERS, tags: ['bug'] }, shared: false, display: { ...DEFAULT_DISPLAY, groupBy: 'priority' }, ...over });

const stub = (role: UserRole, views: SavedView[]) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
  return {
    list: vi.spyOn(orbitService, 'savedViews').mockResolvedValue(views),
    save: vi.spyOn(orbitService, 'saveView').mockImplementation(async (view) => ({ ...makeView(), ...view, id: 'v2' }) as SavedView),
    update: vi.spyOn(orbitService, 'updateView').mockImplementation(async (id, view) => ({ ...makeView(), ...view, id }) as SavedView),
    remove: vi.spyOn(orbitService, 'deleteView').mockResolvedValue(undefined as never),
  };
};

const openMenu = async (name: string) => {
  fireEvent.click(await screen.findByRole('button', { name: `Actions for view ${name}` }));
};

describe('ViewTabs', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    resetUiStore();
    useToastStore.setState({ items: [] });
  });

  it('renders one tab per view with the active one selected and switches on click', () => {
    stub('member', []);
    renderWithProviders(<ViewTabs listId="l1" />);
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
    expect(useUiStore.getState().view).toBe('board');
    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')).toBe('false');
  });

  it('applies a saved view from its tab, with filters and display', async () => {
    stub('member', [makeView()]);
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    const state = useUiStore.getState();
    expect(state.activeViewId).toBe('v1');
    expect(state.view).toBe('board');
    expect(state.filters.tags).toEqual(['bug']);
    expect(state.display.groupBy).toBe('priority');
    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('false');
    fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
    expect(useUiStore.getState().activeViewId).toBeNull();
  });

  it('creates a view from the current state and makes it active', async () => {
    const { save } = stub('member', []);
    useUiStore.setState({ view: 'board', filters: { ...EMPTY_FILTERS, q: 'x' }, display: { ...DEFAULT_DISPLAY, hideEmpty: true } });
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'View' }));
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: ' Minha ' } });
    fireEvent.click(screen.getByLabelText('Share with the workspace'));
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }));
    await waitFor(() => expect(useUiStore.getState().activeViewId).toBe('v2'));
    expect(save.mock.calls[0][0]).toEqual({ name: 'Minha', viewType: 'board', listId: 'l1', filters: { ...EMPTY_FILTERS, q: 'x' }, shared: true, display: { ...DEFAULT_DISPLAY, hideEmpty: true } });
  });

  it('shows a refusal when the view cannot be created', async () => {
    const { save } = stub('member', []);
    save.mockRejectedValue(new ApiError(400, 'no'));
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'View' }));
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }));
    await waitFor(() => expect(useToastStore.getState().items.map((item) => item.messageKey)).toContain('viewSaveFailed'));
  });

  it('renames, shares and deletes through the tab menu of an owned view', async () => {
    const { update, remove } = stub('member', [makeView()]);
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    await openMenu('Bugs');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Falhas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe('v1');
    expect(update.mock.calls[0][1].name).toBe('Falhas');
    expect(update.mock.calls[0][1].display?.groupBy).toBe('priority');
    await openMenu('Bugs');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share with the workspace' }));
    await waitFor(() => expect(update.mock.calls[1]?.[1].shared).toBe(true));
    await openMenu('Bugs');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete view' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete view' }));
    await waitFor(() => expect(remove.mock.calls[0][0]).toBe('v1'));
    expect(useUiStore.getState().activeViewId).toBeNull();
  });

  it('offers only duplicate on a view someone else shared', async () => {
    const { save } = stub('member', [makeView({ ownerId: 'other', shared: true })]);
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    await openMenu('Bugs');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Delete view' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0]).toMatchObject({ name: 'Copy of Bugs', shared: false });
  });

  it('lets an admin change a view someone else shared', async () => {
    stub('admin', [makeView({ ownerId: 'other', shared: true })]);
    renderWithProviders(<ViewTabs listId="l1" />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    await openMenu('Bugs');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Delete view' })).toBeTruthy());
  });

  it('shows a guest no saved views and no way to add one, and never asks for them', async () => {
    const { list } = stub('guest', [makeView()]);
    renderWithProviders(<ViewTabs listId="l1" />);
    await waitFor(() => expect(orbitService.me).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(list).not.toHaveBeenCalled();
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'View' })).toBeNull();
  });

  it('marks a changed view, then saves or discards the change', async () => {
    const { update } = stub('member', [makeView()]);
    renderWithProviders(
      <>
        <ViewTabs listId="l1" />
        <ViewChanges listId="l1" />
      </>,
    );
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Bugs' }));
    await waitFor(() => expect(useUiStore.getState().activeViewId).toBe('v1'));
    useUiStore.getState().setFilters({ q: 'novo' });
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(useUiStore.getState().filters.q).toBe('');
    useUiStore.getState().setFilters({ q: 'novo' });
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1].filters.q).toBe('novo');
  });

  it('never offers saving over a view the person cannot change', async () => {
    stub('member', [makeView({ ownerId: 'other', shared: true })]);
    renderWithProviders(
      <>
        <ViewTabs listId="l1" />
        <ViewChanges listId="l1" />
      </>,
    );
    fireEvent.click(await screen.findByRole('tab', { name: 'Bugs' }));
    useUiStore.getState().setFilters({ q: 'novo' });
    await screen.findByRole('button', { name: 'Discard' });
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
});
