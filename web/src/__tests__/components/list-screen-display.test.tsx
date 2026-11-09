// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { ListScreen } from '@/components/tasks/list-screen';
import { TaskListView } from '@/components/tasks/task-list-view';
import { saveViewDisplay, loadViewDisplay } from '@/lib/view-display-storage';
import { orbitService } from '@/services/orbit.service';
import { EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { useComposerStore } from '@/stores/composer.store';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { workspaceService } from '@/services/workspace.service';
import { useSelectionStore } from '@/stores/selection.store';
import { DEFAULT_DISPLAY, EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';
import { useSessionStore } from '@/stores/session.store';

const space = makeSpace({
  lists: [
    { id: 'l1', name: 'Um', kind: 'list', folderId: null },
    { id: 'l2', name: 'Dois', kind: 'list', folderId: null },
  ],
} as never);

describe('ListScreen display state', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetUiStore();
    useComposerStore.getState().close();
    useSelectionStore.getState().clear();
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], workspaceId: 'w', scopes: [] } as never);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([space]);
    useCreateTaskStore.getState().hide();
    vi.spyOn(orbitService, 'savedViews').mockResolvedValue([]);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [makeTask()], total: 1 } as never);
  });

  it('loads the display saved for the list and keeps each list apart', async () => {
    saveViewDisplay('l1', { ...DEFAULT_DISPLAY, groupBy: 'tag' });
    const { rerender } = renderWithProviders(<ListScreen listId="l1" />);
    await waitFor(() => expect(useUiStore.getState().display.groupBy).toBe('tag'));
    act(() => useUiStore.getState().setDisplay({ hideEmpty: true }));
    await waitFor(() => expect(loadViewDisplay('l1').hideEmpty).toBe(true));
    rerender(<ListScreen listId="l2" />);
    await waitFor(() => expect(useUiStore.getState().display.groupBy).toBe('status'));
    expect(loadViewDisplay('l1').groupBy).toBe('tag');
  });

  it('does not write a saved view over the display of the list', async () => {
    renderWithProviders(<ListScreen listId="l1" />);
    await screen.findByText('Task one');
    act(() => useUiStore.getState().setDisplay({ hideEmpty: true }));
    await waitFor(() => expect(loadViewDisplay('l1').hideEmpty).toBe(true));
    act(() => useUiStore.getState().applyView('v', 'board', EMPTY_FILTERS, { ...DEFAULT_DISPLAY, groupBy: 'priority' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(loadViewDisplay('l1').groupBy).toBe('status');
  });

  it('closes the composer, clears the selection and leaves a saved view when the list changes', async () => {
    const { rerender } = renderWithProviders(<ListScreen listId="l1" />);
    await screen.findByText('Task one');
    act(() => {
      useComposerStore.getState().open('cell', EMPTY_PRESETS);
      useSelectionStore.getState().set(['t1']);
      useUiStore.getState().applyView('v', 'list', { ...EMPTY_FILTERS, tags: ['x'] }, DEFAULT_DISPLAY);
    });
    rerender(<ListScreen listId="l2" />);
    await waitFor(() => expect(useUiStore.getState().activeViewId).toBeNull());
    expect(useComposerStore.getState().anchor).toBeNull();
    expect(useSelectionStore.getState().ids).toEqual([]);
    expect(useUiStore.getState().filters.tags).toEqual([]);
  });

  it('keeps the filters when the list changes with no saved view active', async () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, tags: ['x'] } });
    const { rerender } = renderWithProviders(<ListScreen listId="l1" />);
    rerender(<ListScreen listId="l2" />);
    await waitFor(() => expect(orbitService.tasks).toHaveBeenCalled());
    expect(useUiStore.getState().filters.tags).toEqual(['x']);
  });

  it('shows the bulk bar for a member with a selection', async () => {
    renderWithProviders(<ListScreen listId="l1" />);
    await screen.findByText('Task one');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Task one' }));
    expect(screen.getByRole('toolbar', { name: 'Actions for selected tasks' })).toBeTruthy();
  });

  it('gives a guest no checkbox and no bulk bar, even with a selection in memory', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], role: 'guest', workspaceId: 'w', scopes: [] } as never);
    useSelectionStore.getState().set(['t1']);
    renderWithProviders(<ListScreen listId="l1" />);
    await screen.findByText('Task one');
    await waitFor(() => {
      expect(screen.queryByRole('checkbox')).toBeNull();
      expect(screen.queryByRole('toolbar')).toBeNull();
    });
  });
});

describe('TaskListView', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    resetUiStore();
    useComposerStore.getState().close();
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [], total: 0 } as never);
  });

  it('applies the sort of the display', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, sortBy: 'title' } });
    renderWithProviders(<TaskListView tasks={[makeTask({ id: 'a', title: 'Zeta' }), makeTask({ id: 'b', title: 'Alfa' })]} space={space} listId="l1" />);
    const titles = screen.getAllByRole('button', { name: /Zeta|Alfa/ }).map((el) => el.textContent);
    expect(titles[0]).toContain('Alfa');
  });

  it('opens the composer in the group, with its status, from the group plus', () => {
    renderWithProviders(<TaskListView tasks={[makeTask({ status: 'doing' })]} space={space} listId="l1" />);
    const group = screen.getByRole('region', { name: 'doing' });
    fireEvent.click(within(group).getByRole('button', { name: 'Add a task to doing' }));
    expect(within(group).getByTestId('task-composer')).toBeTruthy();
    expect(useComposerStore.getState().presets.status).toBe('doing');
  });

  it('opens the inline row with the template list from the Add Task arrow, and the full form with the group status', async () => {
    vi.spyOn(workspaceService, 'templates').mockResolvedValue([]);
    renderWithProviders(<TaskListView tasks={[makeTask({ status: 'doing' })]} space={space} listId="l1" />);
    const group = screen.getByRole('region', { name: 'doing' });
    fireEvent.click(within(group).getByRole('button', { name: 'More ways to add a task' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'From a template' }));
    const row = within(group).getByTestId('task-composer');
    expect(row.getAttribute('data-variant')).toBe('row');
    expect(useComposerStore.getState().presets.status).toBe('doing');
    expect(await screen.findByRole('dialog', { name: 'Templates' })).toBeTruthy();
    act(() => useComposerStore.getState().close());
    fireEvent.click(within(group).getByRole('button', { name: 'More ways to add a task' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'With the full form' }));
    expect(useCreateTaskStore.getState()).toMatchObject({ open: true, defaults: { listId: 'l1', status: 'doing' } });
  });
});
