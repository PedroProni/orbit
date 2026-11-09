// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { useUiStore } from '@/stores/ui.store';
import { useComposerStore } from '@/stores/composer.store';
import { useSelectionStore } from '@/stores/selection.store';
import { DEFAULT_DISPLAY } from '@/stores/ui.constants';
import { BOARD_NO_LANE } from '@/components/tasks/board.constants';
import { boardAnchor } from '@/components/tasks/board-groups';
import { EMPTY_PRESETS, TEMP_TASK_PREFIX } from '@/components/tasks/task-composer.constants';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), dragEnd: null as null | ((event: unknown) => void) }));

vi.mock('@/hooks/use-orbit', () => ({
  useMembers: () => ({ data: MEMBERS }),
  useUpdateTask: () => ({ mutate: mocks.mutate }),
  useTasks: () => ({ data: { data: [] } }),
  useHierarchy: () => ({ data: undefined }),
  useMe: () => ({ data: MEMBERS[0] }),
}));

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

const space = makeSpace();
const rich = makeTask({
  id: 'a',
  title: 'Ship release',
  tags: ['infra', 'p1'],
  priority: 'urgent',
  assigneeIds: ['u1'],
  checklists: [
    {
      id: 'c',
      name: 'QA',
      items: [
        { id: 'i1', name: 'x', resolved: true, assigneeId: null },
        { id: 'i2', name: 'y', resolved: false, assigneeId: null },
      ],
    },
  ],
});
const child = makeTask({ id: 'b', title: 'Write notes', parentId: 'a', status: 'doing' });
const top = makeTask({ id: 'c', title: 'Standalone', status: 'doing' });

describe('KanbanBoard', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
    resetUiStore();
    useComposerStore.getState().close();
    useSelectionStore.getState().clear();
  });

  it('renders title, tags, subtask count, priority label and assignee initials', () => {
    renderWithProviders(<KanbanBoard tasks={[rich, child]} space={space} listId="l1" />);
    const column = screen.getByRole('region', { name: 'To do' });
    expect(within(column).getByText('Ship release')).toBeTruthy();
    expect(within(column).getByText('infra')).toBeTruthy();
    expect(within(column).getByText('p1')).toBeTruthy();
    expect(within(column).getByLabelText('Urgent')).toBeTruthy();
    expect(within(column).getByTitle('Subtasks').textContent).toBe('1');
    expect(within(column).getByTitle('Checklist').textContent).toBe('1/2');
    expect(within(column).getByText('AS')).toBeTruthy();
  });

  it('shows one column per status with the task count', () => {
    renderWithProviders(<KanbanBoard tasks={[rich, child]} space={space} listId="l1" />);
    expect(screen.getByRole('region', { name: 'To do' }).querySelector('div')?.textContent).toBe('To do1');
    expect(within(screen.getByRole('region', { name: 'doing' })).queryByText('Write notes')).toBeNull();
    expect(screen.getByRole('region', { name: 'Completed' }).querySelector('div')?.textContent).toBe('Completed0');
  });

  it('shows the no priority label when the task has none', () => {
    renderWithProviders(<KanbanBoard tasks={[top]} space={space} listId="l1" />);
    expect(screen.getByLabelText('No priority')).toBeTruthy();
  });

  it('opens the task in the ui store when a card is clicked', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    fireEvent.click(screen.getByText('Ship release'));
    expect(useUiStore.getState().openTaskId).toBe('a');
  });

  const dragOf = (taskId: string, column: string, lane = BOARD_NO_LANE) => ({ data: { current: { taskId, column, lane } } });
  const dropOn = (column: string, lane = BOARD_NO_LANE) => ({ data: { current: { column, lane } } });

  it('calls update with the new status when a card is dropped on another column', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    mocks.dragEnd?.({ active: dragOf('a', 'to-do'), over: dropOn('completed') });
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { status: 'completed' } });
  });

  it('does not call update when dropped on the same column or outside', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    mocks.dragEnd?.({ active: dragOf('a', 'to-do'), over: dropOn('to-do') });
    mocks.dragEnd?.({ active: dragOf('a', 'to-do'), over: null });
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('moves the assignee when a card is dropped on another person column', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, groupBy: 'assignee' } });
    renderWithProviders(<KanbanBoard tasks={[rich, makeTask({ id: 'z', assigneeIds: ['u2'] })]} space={space} listId="l1" />);
    expect(screen.getByRole('region', { name: 'Ana Souza' })).toBeTruthy();
    mocks.dragEnd?.({ active: dragOf('a', 'u1'), over: dropOn('u2') });
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { addAssigneeIds: ['u2'], removeAssigneeIds: ['u1'] } });
  });

  it('repeats the columns per lane and moves the lane value on drop', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, swimlane: 'priority' } });
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    const urgent = screen.getByRole('group', { name: 'Urgent' });
    expect(within(urgent).getByText('Ship release')).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'High' })).queryByText('Ship release')).toBeNull();
    mocks.dragEnd?.({ active: dragOf('a', 'to-do', 'urgent'), over: dropOn('doing', 'high') });
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { status: 'doing', priority: 'high' } });
    fireEvent.click(screen.getByRole('button', { name: 'Toggle lane Urgent' }));
    expect(within(urgent).queryByText('Ship release')).toBeNull();
  });

  it('collapses a column to a strip and expands it back', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse column To do' }));
    expect(useUiStore.getState().display.collapsedColumns).toEqual(['to-do']);
    const strip = screen.getByRole('region', { name: 'To do' });
    expect(strip.getAttribute('data-collapsed')).toBe('true');
    expect(within(strip).queryByText('Ship release')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand column To do' }));
    expect(useUiStore.getState().display.collapsedColumns).toEqual([]);
    expect(screen.getByText('Ship release')).toBeTruthy();
  });

  it('sums the points of a column and hides the sum at zero', () => {
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'p1', points: 3 }), makeTask({ id: 'p2', points: 2.5 })]} space={space} listId="l1" />);
    expect(within(screen.getByRole('region', { name: 'To do' })).getByText('5.5 pts')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'doing' })).queryByText(/pts/)).toBeNull();
  });

  it('flags a column over its limit without blocking a drop into it', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, wipLimits: [{ column: 'to-do', limit: 1 }] } });
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'w1' }), makeTask({ id: 'w2' }), makeTask({ id: 'w3', status: 'doing' })]} space={space} listId="l1" />);
    const column = screen.getByRole('region', { name: 'To do' });
    expect(column.getAttribute('data-wip-over')).toBe('true');
    expect(within(column).getByText('2/1')).toBeTruthy();
    mocks.dragEnd?.({ active: dragOf('w3', 'doing'), over: dropOn('to-do') });
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'w3', patch: { status: 'to-do' } });
  });

  it('counts the limit across lanes, once per task', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, swimlane: 'assignee', wipLimits: [{ column: 'to-do', limit: 1 }] } });
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'w1', assigneeIds: ['u1', 'u2'] })]} space={space} listId="l1" />);
    for (const name of ['Ana Souza', 'Bruno Lima']) {
      const column = within(screen.getByRole('group', { name })).getByRole('region', { name: 'To do' });
      expect(column.getAttribute('data-wip-over')).toBeNull();
      expect(within(column).getByText('1/1')).toBeTruthy();
    }
  });

  it('hides the card fields the display turned off', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, cardFields: ['tags'] } });
    renderWithProviders(<KanbanBoard tasks={[rich, child]} space={space} listId="l1" />);
    expect(screen.getByText('infra')).toBeTruthy();
    expect(screen.queryByLabelText('Urgent')).toBeNull();
    expect(screen.queryByTitle('Subtasks')).toBeNull();
    expect(screen.queryByTitle('Checklist')).toBeNull();
    expect(screen.queryByText('AS')).toBeNull();
  });

  it('hides empty columns, but keeps the one being composed in', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, hideEmpty: true } });
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    expect(screen.queryByRole('region', { name: 'doing' })).toBeNull();
    act(() => useComposerStore.getState().open(boardAnchor(BOARD_NO_LANE, 'doing'), EMPTY_PRESETS));
    expect(screen.getByRole('region', { name: 'doing' })).toBeTruthy();
  });

  it('opens the composer in place from the column plus, with that status preset', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    const column = screen.getByRole('region', { name: 'doing' });
    fireEvent.click(within(column).getByRole('button', { name: 'Add a task to doing' }));
    expect(within(column).getByTestId('task-composer')).toBeTruthy();
    expect(useComposerStore.getState().presets.status).toBe('doing');
  });

  it('opens the composer at the top of the column from the + Add Task button, above the cards', () => {
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'z', title: 'Old card', status: 'completed' })]} space={space} listId="l1" />);
    const column = screen.getByRole('region', { name: 'Completed' });
    fireEvent.click(within(column).getByRole('button', { name: 'Add task' }));
    expect(useComposerStore.getState().presets.status).toBe('completed');
    const composer = within(column).getByTestId('task-composer');
    expect(composer.getAttribute('data-variant')).toBe('card');
    expect(composer.compareDocumentPosition(within(column).getByText('Old card')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps a temporary card out of dragging, clicking and selection', () => {
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: `${TEMP_TASK_PREFIX}1`, title: 'Saving' })]} space={space} listId="l1" />);
    fireEvent.click(screen.getByText('Saving'));
    expect(useUiStore.getState().openTaskId).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('selects a card from its checkbox without opening it', () => {
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Ship release' }));
    expect(useSelectionStore.getState().ids).toEqual(['a']);
    expect(useUiStore.getState().openTaskId).toBeNull();
  });

  it('scrolls the board sideways when the background is dragged, but not from a card', () => {
    renderWithProviders(<KanbanBoard tasks={[rich, top]} space={space} listId="l1" />);
    const board = screen.getByLabelText('Board');
    board.scrollLeft = 300;
    fireEvent.pointerDown(board, { button: 0, pointerType: 'mouse', pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(board, { pointerType: 'mouse', pointerId: 1, clientX: 380 });
    expect(board.scrollLeft).toBe(420);
    expect(board.getAttribute('data-dragging')).toBe('true');
    fireEvent.pointerUp(board, { pointerType: 'mouse', pointerId: 1 });
    expect(board.getAttribute('data-dragging')).toBeNull();
    const card = screen.getByText('Ship release');
    fireEvent.pointerDown(card, { button: 0, pointerType: 'mouse', pointerId: 2, clientX: 500 });
    fireEvent.pointerMove(board, { pointerType: 'mouse', pointerId: 2, clientX: 300 });
    expect(board.scrollLeft).toBe(420);
  });

  it('gives every column the same fixed width and lets the cards scroll inside it', () => {
    renderWithProviders(<KanbanBoard tasks={[rich, top]} space={space} listId="l1" />);
    const columns = screen.getAllByRole('region');
    expect(columns.length).toBeGreaterThan(1);
    for (const column of columns) expect(column.className).toContain('w-[272px]');
    expect(screen.getAllByTestId('column-cards')[0].className).toContain('overflow-y-auto');
  });

  it('shows the scroll fade only when columns overflow the container', () => {
    const widths = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(2000);
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    const { unmount } = renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    expect(screen.getByTestId('board-more')).toBeTruthy();
    unmount();
    widths.mockReturnValue(900);
    renderWithProviders(<KanbanBoard tasks={[rich]} space={space} listId="l1" />);
    expect(screen.queryByTestId('board-more')).toBeNull();
    widths.mockRestore();
    client.mockRestore();
  });
});
