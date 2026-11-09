// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { TaskTableView } from '@/components/tasks/task-table-view';
import { tagColor } from '@/components/tasks/task-helpers';
import { useUiStore } from '@/stores/ui.store';

const mutate = vi.fn();
vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }), useUpdateTask: () => ({ mutate }) }));

const space = makeSpace();
const statusesOf = () => space.statuses;
const row = (title: string) => screen.getByText(title).closest('tr') as HTMLElement;

describe('TaskTableView', () => {
  beforeEach(() => {
    mutate.mockReset();
    resetUiStore();
  });

  it('renders the translated priority with its flag and the assignee names', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', priority: 'urgent', assigneeIds: ['u1'] })]} statusesOf={statusesOf} readOnly />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.queryByText('urgent')).toBeNull();
    expect(within(row('Alpha')).getByText('Ana Souza')).toBeTruthy();
    expect(within(row('Alpha')).getByLabelText('Ana Souza')).toBeTruthy();
  });

  it('leaves the priority name out without priority and says when nobody is assigned', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'b', title: 'Beta', priority: null })]} statusesOf={statusesOf} readOnly />);
    expect(screen.queryByText('Urgent')).toBeNull();
    expect(within(row('Beta')).getByText('Unassigned')).toBeTruthy();
  });

  it('numbers the rows in the order shown and keeps the sort by column', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Bravo', updatedAt: '2026-11-01T10:00:00.000Z' }), makeTask({ id: 'b', title: 'Alpha', updatedAt: '2026-11-02T10:00:00.000Z' })]} statusesOf={statusesOf} readOnly />);
    const firstCells = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((r) => [r.children[0].textContent, r.children[1].textContent]);
    expect(firstCells()).toEqual([
      ['1', 'Alpha'],
      ['2', 'Bravo'],
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Title' }));
    expect(firstCells()).toEqual([
      ['1', 'Alpha'],
      ['2', 'Bravo'],
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Title' }));
    expect(firstCells()).toEqual([
      ['1', 'Bravo'],
      ['2', 'Alpha'],
    ]);
  });

  it('shows the status as a pill in the status color and changes it in place without opening the task', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', status: 'doing' })]} statusesOf={statusesOf} readOnly={false} />);
    const pill = within(row('Alpha')).getByTestId('table-status');
    expect(pill.getAttribute('data-status-color')).toBe('#0000ff');
    fireEvent.click(within(pill).getByRole('combobox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: /Completed/ }));
    expect(mutate).toHaveBeenCalledWith({ id: 'a', patch: { status: 'completed' } });
    expect(useUiStore.getState().openTaskId).toBeNull();
  });

  it('changes the priority in place', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', priority: 'low' })]} statusesOf={statusesOf} readOnly={false} />);
    fireEvent.click(within(row('Alpha')).getByRole('combobox', { name: 'Priority' }));
    fireEvent.click(screen.getByRole('option', { name: /High/ }));
    expect(mutate).toHaveBeenCalledWith({ id: 'a', patch: { priority: 'high' } });
  });

  it('gives a guest no editors and opens the task from any cell', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', status: 'doing', priority: 'high' })]} statusesOf={statusesOf} readOnly />);
    const status = within(row('Alpha')).getByRole('combobox', { name: 'Status' }) as HTMLButtonElement;
    expect(status.disabled).toBe(true);
    expect(within(row('Alpha')).queryByRole('combobox', { name: 'Priority' })).toBeNull();
    fireEvent.click(within(row('Alpha')).getByText('High'));
    expect(useUiStore.getState().openTaskId).toBe('a');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('shows the description, subtask, checklist and attachment marks next to the title, and no checklist mark for an empty checklist', () => {
    renderWithProviders(
      <TaskTableView
        tasks={[
          makeTask({
            id: 'p',
            title: 'Parent',
            descriptionMd: 'texto',
            attachmentCount: 3,
            checklists: [
              {
                id: 'k1',
                name: 'QA',
                items: [
                  { id: 'i1', name: 'one', resolved: true, assigneeId: null },
                  { id: 'i2', name: 'two', resolved: false, assigneeId: null },
                ],
              },
              { id: 'k2', name: 'Deploy', items: [{ id: 'i3', name: 'three', resolved: true, assigneeId: null }] },
            ],
          }),
          makeTask({ id: 'k', title: 'Only checklist', checklists: [{ id: 'k3', name: 'Empty list', items: [] }] }),
          makeTask({ id: 'c1', title: 'Child one', parentId: 'p' }),
          makeTask({ id: 'c2', title: 'Child two', parentId: 'p' }),
          makeTask({ id: 'e', title: 'Empty' }),
        ]}
        statusesOf={statusesOf}
        readOnly
      />,
    );
    const parent = within(row('Parent'));
    expect(parent.getByRole('img', { name: 'Has a description' })).toBeTruthy();
    expect(parent.getByRole('img', { name: '2 subtasks' })).toBeTruthy();
    expect(parent.getByRole('img', { name: '3 attachments' })).toBeTruthy();
    expect(parent.getByRole('img', { name: '2 of 3 checklist items done' }).textContent).toBe('2/3');
    expect(within(row('Only checklist')).queryAllByRole('img')).toHaveLength(0);
    expect(within(row('Empty')).queryAllByRole('img')).toHaveLength(0);
  });

  it('shows tags in their own colors with a count of the hidden ones', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', tags: ['back-end', 'front-end', 'bug'] })]} statusesOf={statusesOf} readOnly />);
    const chip = within(row('Alpha')).getByText('back-end').parentElement as HTMLElement;
    expect(chip.getAttribute('data-tag-color')).toBe(tagColor('back-end'));
    expect(within(row('Alpha')).getByText('front-end')).toBeTruthy();
    expect(within(row('Alpha')).queryByText('bug')).toBeNull();
    expect(within(row('Alpha')).getByText('+1').getAttribute('title')).toBe('bug');
  });

  it('marks an open task past its due day as overdue, but not a closed one', () => {
    renderWithProviders(
      <TaskTableView
        tasks={[makeTask({ id: 'a', title: 'Late', dueDate: '2020-01-10T12:00:00.000Z' }), makeTask({ id: 'b', title: 'Done late', dueDate: '2020-01-10T12:00:00.000Z', dateClosed: '2020-01-11T12:00:00.000Z' })]}
        statusesOf={statusesOf}
        readOnly
      />,
    );
    expect(row('Late').querySelector('[data-overdue]')).not.toBeNull();
    expect(row('Done late').querySelector('[data-overdue]')).toBeNull();
  });
});
