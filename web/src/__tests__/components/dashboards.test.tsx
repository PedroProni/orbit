// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS } from '../helpers/fixtures';
import { DashboardsScreen } from '@/components/workspace/dashboards-screen';
import { DashboardWidget } from '@/components/workspace/dashboard-widget';
import { workspaceService } from '@/services/workspace.service';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));

vi.mock('@/services/workspace.service', () => ({
  workspaceService: { createDashboard: vi.fn(), updateDashboard: vi.fn(), deleteDashboard: vi.fn() },
}));

const data = vi.hoisted(() => ({
  dashboards: [{ id: 'd1', name: 'Team', shared: false, widgets: [] }],
  detail: {
    id: 'd1',
    name: 'Team',
    widgets: [
      { id: 'w1', type: 'tasks_by_status', title: 'Tasks by status', listId: null, result: { 'to-do': 3, done: 1 } },
      { id: 'w2', type: 'tasks_by_assignee', title: 'Tasks by assignee', listId: null, result: { u1: 4, unassigned: 2 } },
    ],
  },
}));

vi.mock('@/hooks/use-workspace', () => ({
  useDashboards: () => ({ data: data.dashboards }),
  useDashboardData: (id: string | null) => ({ data: id ? data.detail : undefined }),
  useInvalidating: (fn: (args: unknown) => unknown) => ({ mutate: (args: unknown) => fn(args), mutateAsync: async (args: unknown) => fn(args), isPending: false }),
}));

describe('DashboardsScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a donut for tasks_by_status and bars for the other widgets', () => {
    renderWithProviders(<DashboardsScreen />);
    const donut = screen.getByRole('region', { name: 'Tasks by status' });
    expect(donut.querySelectorAll('[data-testid="slice"]')).toHaveLength(2);
    expect(donut.querySelectorAll('[data-testid="bar"]')).toHaveLength(0);
    const bars = screen.getByRole('region', { name: 'Tasks by assignee' });
    expect(bars.querySelectorAll('[data-testid="bar"]')).toHaveLength(2);
    expect(bars.querySelectorAll('[data-testid="slice"]')).toHaveLength(0);
  });

  it('maps assignee ids to member names and special keys to labels', () => {
    renderWithProviders(<DashboardsScreen />);
    const bars = screen.getByRole('region', { name: 'Tasks by assignee' });
    expect(within(bars).getByText('Ana Souza')).toBeTruthy();
    expect(within(bars).getByText('Unassigned')).toBeTruthy();
  });

  it('removes a widget by sending the remaining widgets to updateDashboard', () => {
    renderWithProviders(<DashboardsScreen />);
    const first = screen.getByRole('region', { name: 'Tasks by status' });
    fireEvent.click(within(first).getByLabelText('Remove widget'));
    expect(workspaceService.updateDashboard).toHaveBeenCalledWith('d1', { name: 'Team', widgets: [{ type: 'tasks_by_assignee', title: 'Tasks by assignee' }] });
  });

  it('appends the chosen widget type from the add widget select', () => {
    renderWithProviders(<DashboardsScreen />);
    chooseOption(screen.getByLabelText('Add widget'), 'Overdue tasks');
    expect(workspaceService.updateDashboard).toHaveBeenCalledWith('d1', {
      name: 'Team',
      widgets: [
        { type: 'tasks_by_status', title: 'Tasks by status' },
        { type: 'tasks_by_assignee', title: 'Tasks by assignee' },
        { type: 'overdue', title: 'Overdue tasks' },
      ],
    });
  });

  it('creates a dashboard with the default widgets and ignores a blank name', () => {
    renderWithProviders(<DashboardsScreen />);
    const create = screen.getByRole('button', { name: 'Create dashboard' }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Dashboard name'), { target: { value: ' Ops ' } });
    fireEvent.click(create);
    const call = vi.mocked(workspaceService.createDashboard).mock.calls[0][0];
    expect(call.name).toBe('Ops');
    expect(call.widgets.map((w) => w.type)).toEqual(['tasks_by_status', 'tasks_by_assignee', 'overdue', 'time_tracked']);
  });

  it('asks before deleting a dashboard and deletes only after the confirmation', async () => {
    renderWithProviders(<DashboardsScreen />);
    fireEvent.click(screen.getByLabelText('Delete dashboard Team'));
    expect(screen.getByRole('dialog', { name: 'Delete dashboard' })).toBeTruthy();
    expect(screen.getByText('Delete the dashboard "Team"? Its widgets go with it.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(workspaceService.deleteDashboard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Delete dashboard Team'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete dashboard' })).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(workspaceService.deleteDashboard).toHaveBeenCalledWith('d1'));
  });
});

describe('DashboardWidget', () => {
  it('shows the no data message for an empty result and calls onRemove', () => {
    const onRemove = vi.fn();
    renderWithProviders(<DashboardWidget widget={{ id: 'w', type: 'overdue', title: 'Overdue tasks', listId: null, result: {} }} label={(k) => k} onRemove={onRemove} />);
    expect(screen.getByText('No data')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Remove widget'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
