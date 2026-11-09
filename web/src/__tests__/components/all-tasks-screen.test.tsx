// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { AllTasksScreen } from '@/components/all-tasks/all-tasks-screen';
import { BOARD_NO_LANE } from '@/components/tasks/board.constants';
import { orbitService } from '@/services/orbit.service';
import { useComposerStore } from '@/stores/composer.store';
import { useSelectionStore } from '@/stores/selection.store';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { ListNode, Task, TaskPage } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ dragEnd: null as null | ((event: unknown) => void) }));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: { onDragEnd: (event: unknown) => void; children: React.ReactNode }) => {
      mocks.dragEnd = props.onDragEnd;
      return <actual.DndContext {...(props as object)} />;
    },
  };
});

const list = (id: string, spaceId: string, name: string): ListNode => ({ id, spaceId, folderId: null, name, kind: 'list' });
const eng = makeSpace({ id: 's1', name: 'Engineering', lists: [list('l1', 's1', 'Backlog')] });
const ops = makeSpace({
  id: 's2',
  name: 'Ops',
  statuses: [
    { name: 'to-do', color: '#111111', type: 'open', order: 0 },
    { name: 'review', color: '#ff00ff', type: 'review', order: 1 },
    { name: 'shipped', color: '#00ffff', type: 'closed', order: 2 },
  ],
  lists: [list('l3', 's2', 'Runbook')],
});
const build = makeTask({ id: 'a', title: 'Build pipeline', spaceId: 's1', listId: 'l1', status: 'doing' });
const deploy = makeTask({ id: 'b', title: 'Deploy notes', spaceId: 's2', listId: 'l3', status: 'review' });
const third = makeTask({ id: 'c', title: 'Third task', spaceId: 's2', listId: 'l3', status: 'to-do' });
const pageOf = (data: Task[], total: number): TaskPage => ({ data, total, page: 1, limit: 200, totalPages: 2 });
const meAs = (role: 'owner' | 'guest') => vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], role, workspaceId: 'w', scopes: [] } as never);
const dragOf = (taskId: string, column: string) => ({ data: { current: { taskId, column, lane: BOARD_NO_LANE } } });
const dropOn = (column: string) => ({ data: { current: { column, lane: BOARD_NO_LANE } } });
const board = () => screen.findByLabelText('Board');

describe('AllTasksScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetUiStore();
    useComposerStore.getState().close();
    useSelectionStore.getState().clear();
    useToastStore.setState({ items: [] });
    meAs('owner');
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([eng, ops]);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue(pageOf([], 0));
    vi.spyOn(orbitService, 'allTasks').mockImplementation((_filters, page) => Promise.resolve(page === 1 ? pageOf([build, deploy], 3) : pageOf([third], 3)));
    vi.spyOn(orbitService, 'updateTask').mockImplementation((id, patch) => Promise.resolve({ ...build, id, ...patch } as Task));
  });

  it('opens on the board with one column per status of every space and the list each card comes from', async () => {
    renderWithProviders(<AllTasksScreen />);
    await board();
    const columns = await screen.findAllByRole('region');
    expect(columns.map((column) => column.getAttribute('aria-label')).filter((name) => name !== 'Board')).toEqual(['To do', 'doing', 'review', 'Completed', 'shipped']);
    expect(useUiStore.getState().view).toBe('board');
    const card = screen.getByText('Deploy notes').closest('[data-task-card]') as HTMLElement;
    expect(within(card).getByText('Runbook')).toBeTruthy();
    expect(within(screen.getByText('Build pipeline').closest('[data-task-card]') as HTMLElement).getByText('Backlog')).toBeTruthy();
  });

  it('shows how many were loaded, loads the next page on demand and stops when all arrived', async () => {
    renderWithProviders(<AllTasksScreen />);
    expect(await screen.findByText('Showing 2 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Showing 3 of 3')).toBeTruthy();
    expect(screen.getByText('Third task')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    expect(vi.mocked(orbitService.allTasks).mock.calls.map(([, page]) => page)).toEqual(expect.arrayContaining([1, 2]));
  });

  it('refuses a drop on a status the space of the task does not have, and saves one it has', async () => {
    renderWithProviders(<AllTasksScreen />);
    await screen.findByText('Deploy notes');
    act(() => mocks.dragEnd?.({ active: dragOf('b', 'review'), over: dropOn('doing') }));
    expect(orbitService.updateTask).not.toHaveBeenCalled();
    expect(useToastStore.getState().items.map((toast) => [toast.kind, toast.messageKey, toast.values])).toEqual([['error', 'statusMissing', { status: 'doing', space: 'Ops' }]]);
    act(() => mocks.dragEnd?.({ active: dragOf('b', 'review'), over: dropOn('shipped') }));
    await waitFor(() => expect(orbitService.updateTask).toHaveBeenCalledWith('b', { status: 'shipped' }));
  });

  it('opens the column composer on a list whose space has that status, preferring the recent one', async () => {
    window.localStorage.setItem('orbit.recentLists', JSON.stringify(['l1']));
    renderWithProviders(<AllTasksScreen />);
    await screen.findByText('Deploy notes');
    fireEvent.click(screen.getByRole('button', { name: 'Add a task to review' }));
    const composer = await screen.findByRole('form', { name: 'Add a task to review' });
    expect(within(composer).getByText('Runbook')).toBeTruthy();
    act(() => useComposerStore.getState().close());
    fireEvent.click(screen.getByRole('button', { name: 'Add a task to doing' }));
    expect(within(await screen.findByRole('form', { name: 'Add a task to doing' })).getByText('Backlog')).toBeTruthy();
  });

  it('switches to the table with every loaded task', async () => {
    renderWithProviders(<AllTasksScreen />);
    await screen.findByText('Deploy notes');
    fireEvent.click(screen.getByRole('tab', { name: /Table/ }));
    expect(useUiStore.getState().view).toBe('table');
    expect(await screen.findByRole('table')).toBeTruthy();
    expect(screen.getByText('Build pipeline')).toBeTruthy();
  });

  it('lets a guest read the board without creating, dragging or picking assignees', async () => {
    meAs('guest');
    renderWithProviders(<AllTasksScreen />);
    await screen.findByText('Deploy notes');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Add a task to review' })).toBeNull());
    expect(screen.queryByRole('button', { name: 'New task' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Assignees/ })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: /Select/ })).toBeNull();
  });
});
