// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { TaskActivity } from '@/components/tasks/task-activity';
import { CustomFieldDefinition, TaskActivityEntry } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ entries: [] as TaskActivityEntry[], definitions: undefined as CustomFieldDefinition[] | undefined }));

vi.mock('@/hooks/use-orbit', () => ({
  useMembers: () => ({ data: MEMBERS }),
  useTaskActivity: () => ({ data: mocks.entries }),
  useCustomFields: () => ({ data: mocks.definitions }),
}));

const entry = (over: Partial<TaskActivityEntry>): TaskActivityEntry => ({ id: 'e', action: 'task.updated', actorId: 'u1', diff: {}, createdAt: '2026-11-04T10:00:00Z', ...over });

describe('TaskActivity', () => {
  it('shows the empty state without entries', () => {
    mocks.entries = [];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  it('renders a created entry with the actor name', () => {
    mocks.entries = [entry({ id: 'e1', action: 'task.created' })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText(/created this task/)).toBeTruthy();
  });

  it('renders changed entries with field labels and before and after values', () => {
    mocks.entries = [entry({ id: 'e2', diff: { status: { before: 'to-do', after: 'completed' }, dueDate: { before: null, after: '2026-12-01T12:00:00.000Z' } } })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText(/changed status, due date/)).toBeTruthy();
    expect(screen.getByText('status: To do -> Completed')).toBeTruthy();
    expect(screen.getByText('due date: - -> 12/01/2026')).toBeTruthy();
  });

  it('hides internal fields and falls back to the updated label', () => {
    mocks.entries = [entry({ id: 'e3', diff: { updatedAt: { before: 'a', after: 'b' } } })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText(/updated this task/)).toBeTruthy();
    expect(screen.queryByText(/updatedAt/)).toBeNull();
  });

  it('uses the fallback name for unknown actors', () => {
    mocks.entries = [entry({ id: 'e4', actorId: 'ghost', action: 'task.created' })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText('Someone')).toBeTruthy();
  });

  it('shows the priority change with translated labels', () => {
    mocks.entries = [entry({ id: 'e4', diff: { priority: { before: null, after: 'urgent' } } })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText(/- -> Urgent/)).toBeTruthy();
  });

  it('shows each changed custom field by name with the option label or link instead of the raw object', () => {
    mocks.definitions = [
      { id: 'f1', spaceId: 's1', name: 'Ambiente', type: 'dropdown', options: [{ id: 'o1', label: 'Homolog', color: '#000' }] },
      { id: 'f2', spaceId: 's1', name: 'Link do PR', type: 'url', options: [] },
    ];
    mocks.entries = [entry({ id: 'e5', diff: { customFields: { before: [{ fieldId: 'f1', value: 'o1' }], after: [{ fieldId: 'f1', value: 'o1' }, { fieldId: 'f2', value: 'https://github.com/x/y/pull/1' }] } } })];
    renderWithProviders(<TaskActivity taskId="t1" spaceId="s1" />);
    expect(screen.getByText('Link do PR: - -> https://github.com/x/y/pull/1')).toBeTruthy();
    expect(screen.queryByText(/Ambiente/)).toBeNull();
    expect(screen.queryByText(/object Object/)).toBeNull();
  });

  it('never shows raw ids for a field it cannot name, as for a guest without the field definitions', () => {
    mocks.definitions = undefined;
    mocks.entries = [entry({ id: 'e6', diff: { customFields: { before: [], after: [{ fieldId: 'gone', value: 'o9' }] } } })];
    renderWithProviders(<TaskActivity taskId="t1" />);
    expect(screen.getByText(/changed custom fields/)).toBeTruthy();
    expect(screen.queryByText(/o9/)).toBeNull();
    expect(screen.queryByText(/object Object/)).toBeNull();
  });
});
