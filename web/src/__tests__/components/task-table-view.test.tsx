// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeTask } from '../helpers/fixtures';
import { TaskTableView } from '@/components/tasks/task-table-view';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));

describe('TaskTableView', () => {
  it('renders the translated priority and the assignee names', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', priority: 'urgent', assigneeIds: ['u1'] })]} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.queryByText('urgent')).toBeNull();
    expect(screen.getByText('Ana Souza')).toBeTruthy();
  });

  it('leaves the priority cell empty without priority', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'b', title: 'Beta', priority: null })]} />);
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByText('Urgent')).toBeNull();
  });
});
