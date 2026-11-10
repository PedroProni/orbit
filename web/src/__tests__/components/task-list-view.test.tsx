// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { TaskListView } from '@/components/tasks/task-list-view';
import { useUiStore } from '@/stores/ui.store';

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/hooks/use-orbit', () => ({
  useMembers: () => ({ data: MEMBERS }),
  useUpdateTask: () => ({ mutate: mocks.mutate }),
  useCreateTask: () => ({ mutate: vi.fn() }),
}));

const space = makeSpace();
const tasks = [makeTask({ id: 'a', title: 'Alpha', status: 'to-do', priority: 'high', dueDate: '2026-11-10T12:00:00.000Z', assigneeIds: ['u2'], tags: ['x'], points: 3 }), makeTask({ id: 'b', title: 'Beta', status: 'completed' })];

describe('TaskListView', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
    resetUiStore();
  });

  it('renders the column headers inside each populated status section', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    const section = screen.getByRole('region', { name: 'To do' });
    ['Name', 'Assignee', 'Due date', 'Priority', 'Tags', 'Points'].forEach((header) => expect(within(section).getByText(header)).toBeTruthy());
  });

  it('groups tasks by status and hides empty statuses', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    expect(within(screen.getByRole('region', { name: 'To do' })).getByText('Alpha')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Completed' })).getByText('Beta')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'doing' })).toBeNull();
  });

  it('calls update with the priority patch when the priority changes', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    const section = screen.getByRole('region', { name: 'To do' });
    chooseOption(within(section).getByLabelText('Priority'), 'Urgent');
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { priority: 'urgent' } });
  });

  it('sends a null priority when the empty option is chosen', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    const section = screen.getByRole('region', { name: 'To do' });
    chooseOption(within(section).getByLabelText('Priority'), 'None');
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { priority: null } });
  });

  it('calls update with an ISO due date when the date changes and null when cleared', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    const trigger = within(screen.getByRole('region', { name: 'To do' })).getByLabelText('Due date');
    expect(trigger.textContent).toBe('11/10/2026');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(document.querySelector('[data-day="2026-12-01"]') as HTMLElement);
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 'a', patch: { dueDate: '2026-12-01T12:00:00.000Z' } });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(mocks.mutate).toHaveBeenLastCalledWith({ id: 'a', patch: { dueDate: null } });
  });

  it('wraps a long title to two lines on mobile and truncates it on one line from md up', () => {
    const long = 'Um título bem comprido de tarefa que precisa aparecer quase inteiro no celular sem ser cortado no meio';
    renderWithProviders(<TaskListView tasks={[makeTask({ id: 'c', title: long, status: 'to-do' })]} space={space} listId="l1" />);
    const classes = screen.getByRole('button', { name: long }).className.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['line-clamp-2', 'break-words', 'md:truncate', 'min-w-0']));
    expect(classes).not.toContain('truncate');
  });

  it('follows the list width instead of the window, so the title keeps room at 1024 px with the sidebar open', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    const section = screen.getByRole('region', { name: 'To do' });
    const tagsHeader = within(section).getByText('Tags');
    const header = tagsHeader.parentElement as HTMLElement;
    const frame = header.parentElement?.parentElement as HTMLElement;
    expect(frame.className.split(' ')).toEqual(expect.arrayContaining(['@container', 'overflow-x-auto']));
    expect((header.parentElement as HTMLElement).className.split(' ')).toContain('md:min-w-[610px]');
    expect(header.className).toContain('md:grid-cols-[minmax(220px,1fr)_90px_130px_110px]');
    expect(header.className).toContain('md:@4xl:grid-cols-[minmax(220px,1fr)_90px_130px_110px_140px_50px]');
    expect(header.className).not.toMatch(/(^| )lg:/);
    const wide = [tagsHeader, within(section).getByText('Points'), within(section).getAllByText('x').map((chip) => chip.parentElement as HTMLElement).find((cell) => cell.className.includes('gap-1')) as HTMLElement, within(section).getAllByText('3').find((cell) => cell.className.includes('text-muted')) as HTMLElement];
    wide.forEach((cell) => {
      const classes = cell.className.split(' ');
      expect(classes).toContain('hidden');
      expect(classes.some((c) => c.startsWith('md:@4xl:'))).toBe(true);
      expect(classes.some((c) => c.startsWith('lg:'))).toBe(false);
    });
  });

  it('labels a task with no priority with the short word in both languages, so the desktop priority column never cuts it', () => {
    const task = makeTask({ id: 'd', title: 'Delta', status: 'to-do', priority: null });
    const { unmount } = renderWithProviders(<TaskListView tasks={[task]} space={space} listId="l1" />, 'pt');
    expect(screen.getByLabelText('Prioridade').textContent).toBe('Nenhuma');
    unmount();
    renderWithProviders(<TaskListView tasks={[task]} space={space} listId="l1" />);
    expect(screen.getByLabelText('Priority').textContent).toBe('None');
  });

  it('opens the task when the title is clicked', () => {
    renderWithProviders(<TaskListView tasks={tasks} space={space} listId="l1" />);
    fireEvent.click(screen.getByText('Beta'));
    expect(useUiStore.getState().openTaskId).toBe('b');
  });
});
