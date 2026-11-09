// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace } from '../helpers/fixtures';
import { ActivityLine } from '@/components/tasks/task-activity-line';
import { CustomFieldDefinition, TaskActivityEntry } from '@/types/api.types';

const STATUSES = makeSpace().statuses;
const entry = (over: Partial<TaskActivityEntry>): TaskActivityEntry => ({ id: 'e', action: 'task.updated', actorId: 'u1', diff: {}, createdAt: '2026-11-04T10:00:00Z', ...over });
const render = (value: TaskActivityEntry, definitions?: CustomFieldDefinition[]) =>
  renderWithProviders(
    <ol>
      <ActivityLine entry={value} statuses={STATUSES} members={MEMBERS} definitions={definitions} />
    </ol>,
  );
const line = (text: string) => screen.getByText((_, node) => node?.tagName === 'P' && node.textContent?.replace(/\s+/g, ' ').trim() === text);

describe('ActivityLine', () => {
  it('renders a created entry with the actor name', () => {
    render(entry({ action: 'task.created' }));
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText(/created this task/)).toBeTruthy();
  });

  it('renders changed entries with field labels and before and after values', () => {
    render(entry({ diff: { status: { before: 'to-do', after: 'completed' }, dueDate: { before: null, after: '2026-12-01T12:00:00.000Z' } } }));
    expect(screen.getByText(/changed status, due date/)).toBeTruthy();
    expect(line('status: To do -> Completed')).toBeTruthy();
    expect(line('due date: - -> 12/01/2026')).toBeTruthy();
  });

  it('hides internal fields and falls back to the updated label', () => {
    render(entry({ diff: { updatedAt: { before: 'a', after: 'b' } } }));
    expect(screen.getByText(/updated this task/)).toBeTruthy();
    expect(screen.queryByText(/updatedAt/)).toBeNull();
  });

  it('uses the fallback name for unknown actors', () => {
    render(entry({ actorId: 'ghost', action: 'task.created' }));
    expect(screen.getByText('Someone')).toBeTruthy();
  });

  it('shows the priority change with translated labels', () => {
    render(entry({ diff: { priority: { before: null, after: 'urgent' } } }));
    expect(screen.getByText(/- -> Urgent/)).toBeTruthy();
  });

  it('shows each changed custom field by name with the option label or link instead of the raw object', () => {
    const definitions: CustomFieldDefinition[] = [
      { id: 'f1', spaceId: 's1', name: 'Ambiente', type: 'dropdown', listIds: [], options: [{ id: 'o1', label: 'Homolog', color: '#000' }] },
      { id: 'f2', spaceId: 's1', name: 'Link do PR', type: 'url', listIds: [], options: [] },
    ];
    render(
      entry({
        diff: {
          customFields: {
            before: [{ fieldId: 'f1', value: 'o1' }],
            after: [
              { fieldId: 'f1', value: 'o1' },
              { fieldId: 'f2', value: 'https://github.com/x/y/pull/1' },
            ],
          },
        },
      }),
      definitions,
    );
    expect(screen.getByText('Link do PR: - -> https://github.com/x/y/pull/1')).toBeTruthy();
    expect(screen.queryByText(/Ambiente/)).toBeNull();
    expect(screen.queryByText(/object Object/)).toBeNull();
  });

  it('never shows raw ids for a field it cannot name, as for a guest without the field definitions', () => {
    render(entry({ diff: { customFields: { before: [], after: [{ fieldId: 'gone', value: 'o9' }] } } }));
    expect(screen.getByText(/changed custom fields/)).toBeTruthy();
    expect(screen.queryByText(/o9/)).toBeNull();
    expect(screen.queryByText(/gone/)).toBeNull();
    expect(screen.queryByText(/object Object/)).toBeNull();
  });
});
