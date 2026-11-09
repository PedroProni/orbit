// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { resetUiStore } from '../helpers/fixtures';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { useUiStore } from '@/stores/ui.store';
import { orbitService } from '@/services/orbit.service';

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/hooks/use-orbit', () => ({
  useTask: (id: string) => ({
    data: {
      id,
      listId: 'l1',
      spaceId: 's1',
      parentId: null,
      title: 'Fix login',
      descriptionMd: 'Body',
      status: 'to-do',
      priority: null,
      tags: ['auth'],
      assigneeIds: [],
      watcherIds: [],
      points: null,
      startDate: null,
      dueDate: null,
      checklists: [],
      customFields: [],
      creatorId: 'u1',
      dateClosed: null,
      archived: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  }),
  useHierarchy: () => ({
    data: [
      {
        id: 's1',
        name: 'Eng',
        statuses: [
          { name: 'to-do', color: '#888', type: 'open', order: 0 },
          { name: 'completed', color: '#0f0', type: 'done', order: 1 },
        ],
        requiredTags: [],
        titlePrefixes: [],
        folders: [],
        lists: [],
      },
    ],
  }),
  useMembers: () => ({ data: [{ id: 'u1', name: 'Ana Souza' }] }),
  useTasks: () => ({ data: { data: [] } }),
  useUpdateTask: () => ({ mutate: mocks.mutate }),
  useComments: () => ({ data: [] }),
  useAddComment: () => ({ mutate: vi.fn(), isPending: false }),
  useSubtasks: () => ({ data: { data: [] } }),
  useCustomFields: () => ({ data: [] }),
  useCreateTask: () => ({ mutate: vi.fn(), isPending: false }),
  useTaskActivity: () => ({ data: [] }),
}));

vi.mock('@/hooks/use-workspace', () => ({
  useTaskPlan: () => ({ data: { estimateMinutes: 90, taskKind: 'task', trackedMinutes: 30 } }),
  useTaskTime: () => ({ data: { entries: [] } }),
  useDependencies: () => ({ data: { blockedBy: [] } }),
  useRecurrence: () => ({ data: null }),
  useInvalidating: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('TaskDrawer', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
    resetUiStore();
    useUiStore.setState({ openTaskId: 't1' });
  });

  it('renders nothing when no task is open', () => {
    useUiStore.setState({ openTaskId: null });
    renderWithProviders(<TaskDrawer />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the two columns with comments and the activity section', () => {
    renderWithProviders(<TaskDrawer />);
    expect(screen.getByRole('dialog', { name: 'Task details' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Activity' })).toBeTruthy();
    expect(screen.getByText('Comments')).toBeTruthy();
    expect((screen.getByLabelText('Task title') as HTMLTextAreaElement).value).toBe('Fix login');
  });

  it('lays the properties out as label and value rows, with watchers on the bell and planning spread over them', () => {
    renderWithProviders(<TaskDrawer />);
    for (const label of ['Status', 'Dates', 'Time estimate', 'Track time', 'Repeat', 'Assignees', 'Priority', 'Points', 'Tags']) expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByRole('combobox', { name: 'Type' })).toBeTruthy();
    expect((screen.getByRole('spinbutton', { name: 'Estimate (min)' }) as HTMLInputElement).placeholder).toBe('90 min');
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Watchers' }).getAttribute('title')).toBe('Nobody watching');
    expect(screen.getByLabelText('Start date')).toBeTruthy();
    expect(screen.getByLabelText('Due date')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Planning' })).toBeNull();
  });

  it('opens checklist, subtask and dependency editors only from the action links', () => {
    renderWithProviders(<TaskDrawer />);
    const actions = screen.getByRole('group', { name: 'Actions' });
    expect(screen.queryByRole('textbox', { name: 'Checklist name' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Add subtask' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Blocked by' })).toBeNull();
    fireEvent.click(within(actions).getByRole('button', { name: 'Create checklist' }));
    expect(screen.getByRole('textbox', { name: 'Checklist name' })).toBeTruthy();
    fireEvent.click(within(actions).getByRole('button', { name: 'Add subtask' }));
    expect(screen.getByRole('textbox', { name: 'Add subtask' })).toBeTruthy();
    fireEvent.click(within(actions).getByRole('button', { name: 'Relate items or add dependencies' }));
    expect(screen.getByRole('region', { name: 'Blocked by' })).toBeTruthy();
    expect(within(actions).getByRole('button', { name: 'Attach file' })).toBeTruthy();
  });

  it('saves the trimmed title on blur when it changed', () => {
    renderWithProviders(<TaskDrawer />);
    const input = screen.getByLabelText('Task title');
    fireEvent.change(input, { target: { value: '  Fix signup  ' } });
    fireEvent.blur(input);
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 't1', patch: { title: 'Fix signup' } }, expect.any(Object));
  });

  it('does not save on blur when the title is unchanged or blank', () => {
    renderWithProviders(<TaskDrawer />);
    const input = screen.getByLabelText('Task title');
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('keeps the title on one logical line and saves it on Enter', () => {
    renderWithProviders(<TaskDrawer />);
    const input = screen.getByLabelText('Task title') as HTMLTextAreaElement;
    expect(input.tagName).toBe('TEXTAREA');
    fireEvent.change(input, { target: { value: 'New\ntitle' } });
    expect(input.value).toBe('New title');
    input.focus();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(document.activeElement).not.toBe(input);
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 't1', patch: { title: 'New title' } }, expect.any(Object));
  });

  it('saves the status when the status select changes', () => {
    renderWithProviders(<TaskDrawer />);
    chooseOption(screen.getByLabelText('Status'), 'Completed');
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 't1', patch: { status: 'completed' } }, expect.any(Object));
  });

  it('closes the drawer from the close button', () => {
    renderWithProviders(<TaskDrawer />);
    fireEvent.click(screen.getAllByLabelText('Close')[1]);
    expect(useUiStore.getState().openTaskId).toBeNull();
  });

  it('shows the drop overlay only for file drags and hides it when the drag leaves', () => {
    renderWithProviders(<TaskDrawer />);
    const zone = screen.getByTestId('task-drawer-dropzone');
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['text/plain'], files: [] } });
    expect(screen.queryByTestId('drop-overlay')).toBeNull();
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], files: [] } });
    expect(screen.getByTestId('drop-overlay').textContent).toBe('Drop files to attach them to this task');
    fireEvent.dragLeave(zone, { relatedTarget: null });
    expect(screen.queryByTestId('drop-overlay')).toBeNull();
  });

  it('uploads dropped files to the open task', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    const request = vi.spyOn(orbitService, 'requestUpload').mockRejectedValue(new Error('stop'));
    renderWithProviders(<TaskDrawer />);
    const file = new File(['abc'], 'dropped.txt', { type: 'text/plain' });
    fireEvent.drop(screen.getByTestId('task-drawer-dropzone'), { dataTransfer: { types: ['Files'], files: [file] } });
    await screen.findByText('Could not upload dropped.txt');
    expect(request).toHaveBeenCalledWith('t1', { filename: 'dropped.txt', mimeType: 'text/plain', sizeBytes: 3, commentId: undefined });
    expect(screen.queryByTestId('drop-overlay')).toBeNull();
  });

  it('starts a fresh comment draft when another task opens in the same drawer', () => {
    renderWithProviders(<TaskDrawer />);
    fireEvent.change(screen.getByLabelText('Write a comment (markdown)'), { target: { value: 'rascunho da t1' } });
    act(() => useUiStore.setState({ openTaskId: 't2' }));
    expect((screen.getByLabelText('Write a comment (markdown)') as HTMLTextAreaElement).value).toBe('');
  });
});
