// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { resetUiStore } from '../helpers/fixtures';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { TaskPeopleField } from '@/components/tasks/task-people-field';
import { assignablePeople } from '@/lib/assignable-people';
import { useUiStore } from '@/stores/ui.store';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), role: 'viewer' }));

vi.mock('@/hooks/use-capabilities', () => ({
  useCapabilities: () => ({ loaded: true, isGuest: mocks.role === 'guest', isViewer: mocks.role === 'viewer', member: mocks.role !== 'guest', canWrite: mocks.role === 'member', userId: 'v1', canModerateComments: false, canManageAccess: false, canManageStructure: false }),
  useMe: () => ({ data: { id: 'v1', role: mocks.role } }),
}));

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
      priority: 'high',
      tags: ['auth'],
      assigneeIds: ['u1'],
      watcherIds: [],
      points: 3,
      startDate: null,
      dueDate: null,
      checklists: [],
      customFields: [],
      links: { figma: null, notion: null, printsFolder: null },
      creatorId: 'u1',
      dateClosed: null,
      archived: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  }),
  useHierarchy: () => ({ data: [{ id: 's1', name: 'Eng', statuses: [{ name: 'to-do', color: '#888', type: 'open', order: 0 }], requiredTags: [], titlePrefixes: [], folders: [], lists: [] }] }),
  useMembers: () => ({
    data: [
      { id: 'u1', name: 'Ana Souza', role: 'member' },
      { id: 'v1', name: 'Vera Leitora', role: 'viewer' },
    ],
  }),
  useTasks: () => ({ data: { data: [{ id: 't2', title: 'Set up SSO', parentId: null }] } }),
  useUpdateTask: () => ({ mutate: mocks.mutate }),
  useComments: (id: string | null) => ({ data: id ? [{ id: 'c1', taskId: 't1', authorId: 'u1', bodyMd: 'Looks good to me', dailyLogDate: null, editedAt: null, createdAt: '2026-01-02T10:00:00Z' }] : undefined }),
  useEditComment: () => ({ mutate: vi.fn() }),
  useDeleteComment: () => ({ mutate: vi.fn(), isPending: false }),
  useAddComment: () => ({ mutate: vi.fn(), isPending: false }),
  useSubtasks: () => ({ data: { data: [] } }),
  useCustomFields: () => ({ data: [] }),
  useCreateTask: () => ({ mutate: vi.fn(), isPending: false }),
  useTaskActivity: () => ({ data: [] }),
}));

vi.mock('@/hooks/use-workspace', () => ({
  useTaskPlan: () => ({ data: { estimateMinutes: 90, taskKind: 'task', trackedMinutes: 30 } }),
  useTaskTime: () => ({ data: { entries: [] } }),
  useDependencies: () => ({ data: { blockedBy: ['t2'] } }),
  useRecurrence: () => ({ data: null }),
  useInvalidating: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/use-attachments', () => ({
  useAttachments: (id: string | null) => ({ data: id ? [{ id: 'a1', taskId: 't1', commentId: null, filename: 'spec.pdf', mimeType: 'application/pdf', sizeBytes: 2048, uploaderId: 'u1', confirmed: true, gallery: null, createdAt: '2026-01-01T00:00:00Z' }] : undefined }),
  useAttachmentUrl: () => ({ data: undefined }),
  useRemoveAttachment: () => ({ mutate: vi.fn() }),
  useUploads: () => ({ uploads: [], start: vi.fn(), dismiss: vi.fn() }),
}));

describe('task drawer for a viewer', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
    mocks.role = 'viewer';
    resetUiStore();
    useUiStore.setState({ openTaskId: 't1' });
  });

  it('shows names, planning, blockers, files and comments like a member sees them', () => {
    renderWithProviders(<TaskDrawer />);
    expect(within(screen.getByRole('group', { name: 'Assignees' })).getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('90 min')).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Blocked by' })).getByText('Set up SSO')).toBeTruthy();
    expect(screen.getByText('spec.pdf')).toBeTruthy();
    const timeline = screen.getByRole('region', { name: 'Comments' });
    expect(within(timeline).getByText('Ana Souza')).toBeTruthy();
    expect(within(timeline).getByText('Looks good to me')).toBeTruthy();
  });

  it('offers no control that writes', () => {
    renderWithProviders(<TaskDrawer />);
    expect((screen.getByLabelText('Task title') as HTMLTextAreaElement).readOnly).toBe(true);
    expect(screen.getByText('Read only')).toBeTruthy();
    expect(screen.queryByRole('spinbutton', { name: 'Estimate (min)' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add time' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assignees' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Watchers' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove blocker' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Add blocker' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Attach' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove spec.pdf' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download spec.pdf' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Actions' })).toBeNull();
    expect(screen.queryByRole('form', { name: 'Write a comment (markdown)' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit comment' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete comment' })).toBeNull();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('still hides the private data from a guest', () => {
    mocks.role = 'guest';
    renderWithProviders(<TaskDrawer />);
    expect(screen.queryByRole('group', { name: 'Assignees' })).toBeNull();
    expect(screen.queryByText('90 min')).toBeNull();
    expect(screen.queryByText('spec.pdf')).toBeNull();
    expect(screen.queryByText('Looks good to me')).toBeNull();
  });

  it('gives a member the editors back', () => {
    mocks.role = 'member';
    renderWithProviders(<TaskDrawer />);
    expect(screen.getByRole('spinbutton', { name: 'Estimate (min)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Assignees' })).toBeTruthy();
    expect(screen.getByRole('form', { name: 'Write a comment (markdown)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove spec.pdf' })).toBeTruthy();
  });
});

describe('assignee pickers', () => {
  const people = [
    { id: 'u1', name: 'Ana Souza', role: 'member' as const },
    { id: 'v1', name: 'Vera Leitora', role: 'viewer' as const },
    { id: 'v2', name: 'Vito Leitor', role: 'viewer' as const },
  ];

  it('leaves viewers out unless one is already assigned', () => {
    expect(assignablePeople(people).map((person) => person.id)).toEqual(['u1']);
    expect(assignablePeople(people, ['v2']).map((person) => person.id)).toEqual(['u1', 'v2']);
  });

  it('lists no viewer in the drawer assignee picker but keeps an assigned one removable', () => {
    const onToggle = vi.fn();
    renderWithProviders(<TaskPeopleField label="Assignees" emptyLabel="Empty" people={people} selected={['v2']} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Assignees' }));
    const picker = screen.getByRole('dialog', { name: 'Assignees' });
    expect(within(picker).getByText('Ana Souza')).toBeTruthy();
    expect(within(picker).queryByText('Vera Leitora')).toBeNull();
    expect(within(picker).getAllByText('Vito Leitor').length).toBeGreaterThan(0);
  });
});
