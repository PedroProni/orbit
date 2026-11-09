// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { TaskDrawerContent } from '@/components/tasks/task-drawer-content';
import { Task } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), task: null as unknown, guest: false }));

vi.mock('@/hooks/use-orbit', () => ({
  useTask: () => ({ data: mocks.task }),
  useHierarchy: () => ({ data: [makeSpace({ requiredTags: ['P4T'] })] }),
  useMembers: () => ({ data: mocks.guest ? [] : MEMBERS }),
  useTasks: () => ({ data: { data: [makeTask({ tags: ['vizinha'] })] } }),
  useUpdateTask: () => ({ mutate: mocks.mutate }),
  useComments: () => ({ data: [] }),
  useAddComment: () => ({ mutate: vi.fn(), isPending: false }),
  useSubtasks: () => ({ data: { data: [] } }),
  useTaskActivity: () => ({ data: [] }),
  useCustomFields: () => ({ data: [] }),
  useCreateTask: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => ({ isGuest: mocks.guest, member: !mocks.guest, canManageAccess: false, canManageWorkspace: false, userId: 'u1' }), useMe: () => ({ data: null }) }));
vi.mock('@/hooks/use-workspace', () => ({
  useTaskPlan: () => ({ data: { estimateMinutes: 90, taskKind: 'task', trackedMinutes: 30 } }),
  useTaskTime: () => ({ data: { entries: [] } }),
  useDependencies: () => ({ data: { blockedBy: [] } }),
  useRecurrence: () => ({ data: null }),
  useInvalidating: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/components/attachments/task-attachments', () => ({ TaskAttachments: () => null }));
vi.mock('@/hooks/use-attachments', () => ({ useUploads: () => ({ uploads: [], start: vi.fn(), dismiss: vi.fn() }), useAttachments: () => ({ data: [] }), useRemoveAttachment: () => ({ mutate: vi.fn(), isPending: false }), useAttachmentUrl: () => ({ data: null }) }));

const setTask = (over: Partial<Task>) => {
  mocks.task = makeTask({ title: 'Original', descriptionMd: 'Texto', ...over });
};

describe('TaskDrawerContent fields and sync', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
    mocks.guest = false;
    resetUiStore();
    setTask({});
  });

  it('does not throw away a title being typed when the task refreshes', () => {
    const { rerender } = renderWithProviders(<TaskDrawerContent taskId="t1" />);
    const title = screen.getByLabelText('Task title') as HTMLTextAreaElement;
    fireEvent.focus(title);
    fireEvent.change(title, { target: { value: 'Digitando' } });
    setTask({ updatedAt: '2026-02-02T00:00:00Z', points: 1 });
    rerender(<TaskDrawerContent taskId="t1" />);
    expect(title.value).toBe('Digitando');
  });

  it('takes the new title when the field is not in use', () => {
    const { rerender } = renderWithProviders(<TaskDrawerContent taskId="t1" />);
    setTask({ title: 'Renomeada', updatedAt: '2026-02-02T00:00:00Z' });
    rerender(<TaskDrawerContent taskId="t1" />);
    expect((screen.getByLabelText('Task title') as HTMLTextAreaElement).value).toBe('Renomeada');
  });

  it('keeps the description being edited when the task refreshes', () => {
    const { rerender } = renderWithProviders(<TaskDrawerContent taskId="t1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), { target: { value: 'Rascunho' } });
    setTask({ updatedAt: '2026-02-02T00:00:00Z', descriptionMd: 'Outro' });
    rerender(<TaskDrawerContent taskId="t1" />);
    expect((screen.getByRole('textbox', { name: 'Description' }) as HTMLTextAreaElement).value).toBe('Rascunho');
  });

  it('resets everything when another task opens', () => {
    const { rerender } = renderWithProviders(<TaskDrawerContent taskId="t1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), { target: { value: 'Rascunho' } });
    setTask({ id: 't2', title: 'Outra', descriptionMd: 'Outra descrição' });
    rerender(<TaskDrawerContent taskId="t2" />);
    expect(screen.queryByRole('textbox', { name: 'Description' })).toBeNull();
    expect((screen.getByLabelText('Task title') as HTMLTextAreaElement).value).toBe('Outra');
  });

  it('adds and removes one assignee at a time, keeping the others', () => {
    setTask({ assigneeIds: ['u1'] });
    renderWithProviders(<TaskDrawerContent taskId="t1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Assignees' }));
    fireEvent.click(screen.getByRole('option', { name: /Bruno Lima/ }));
    expect(mocks.mutate.mock.calls[0][0]).toEqual({ id: 't1', patch: { addAssigneeIds: ['u2'] } });
    fireEvent.click(screen.getByRole('option', { name: /Ana Souza/ }));
    expect(mocks.mutate.mock.calls[1][0]).toEqual({ id: 't1', patch: { removeAssigneeIds: ['u1'] } });
  });

  it('sends the whole watcher list', () => {
    setTask({ watcherIds: ['u1'] });
    renderWithProviders(<TaskDrawerContent taskId="t1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Watchers' }));
    fireEvent.click(screen.getByRole('option', { name: /Bruno Lima/ }));
    expect(mocks.mutate.mock.calls[0][0].patch).toEqual({ watcherIds: ['u1', 'u2'] });
    fireEvent.click(screen.getByRole('option', { name: /Ana Souza/ }));
    expect(mocks.mutate.mock.calls[1][0].patch).toEqual({ watcherIds: [] });
  });

  it('saves points and edits tags, suggesting the required tag and the tags of the list', () => {
    setTask({ tags: ['a'] });
    renderWithProviders(<TaskDrawerContent taskId="t1" />);
    const points = screen.getByLabelText('Points');
    fireEvent.change(points, { target: { value: '8' } });
    fireEvent.blur(points);
    expect(mocks.mutate.mock.calls[0][0].patch).toEqual({ points: 8 });
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag a' }));
    expect(mocks.mutate.mock.calls[1][0].patch).toEqual({ removeTags: ['a'] });
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    expect(screen.getByRole('option', { name: 'p4t' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'vizinha' }));
    expect(mocks.mutate.mock.calls[2][0].patch).toEqual({ addTags: ['vizinha'] });
  });

  it('shows the rule when the API refuses a change, and keeps it through a refresh', () => {
    mocks.mutate.mockImplementation((_vars, options) => options.onError(new Error('At least one tag is required: p4t')));
    setTask({ tags: ['p4t'] });
    const { rerender } = renderWithProviders(<TaskDrawerContent taskId="t1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag p4t' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    setTask({ tags: ['p4t'], updatedAt: '2026-02-02T00:00:00Z' });
    rerender(<TaskDrawerContent taskId="t1" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    mocks.mutate.mockReset();
  });

  it('gives a guest no people, tag or points controls', () => {
    mocks.guest = true;
    setTask({ tags: ['a'], watcherIds: ['u1'], assigneeIds: ['u1'] });
    renderWithProviders(<TaskDrawerContent taskId="t1" />);
    expect(screen.queryByRole('button', { name: 'Assignees' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Watchers' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add tag' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove tag a' })).toBeNull();
    expect((screen.getByLabelText('Points') as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole('textbox', { name: 'Add subtask' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Actions' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Type' })).toBeNull();
    expect(screen.queryByText('Time estimate')).toBeNull();
    expect(screen.queryByText('Track time')).toBeNull();
    expect(screen.queryByText('Repeat')).toBeNull();
  });

  it('has no add subtask on a subtask', () => {
    setTask({ parentId: 'p' });
    renderWithProviders(<TaskDrawerContent taskId="t1" />);
    expect(screen.queryByRole('textbox', { name: 'Add subtask' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Create checklist' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add subtask' })).toBeNull();
  });
});
