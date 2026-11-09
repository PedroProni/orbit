// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { GoalsScreen } from '@/components/workspace/goals-screen';
import { workspaceService } from '@/services/workspace.service';

vi.mock('@/services/workspace.service', () => ({ workspaceService: { createGoal: vi.fn(), deleteGoal: vi.fn() } }));

const state = vi.hoisted(() => ({ goals: [] as unknown[] }));

vi.mock('@/hooks/use-workspace', () => ({
  useGoals: () => ({ data: state.goals }),
  useInvalidating: (fn: (args: unknown) => unknown) => ({ mutate: (args: unknown) => fn(args), isPending: false }),
}));

describe('GoalsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.goals = [];
  });

  it('shows the empty state and keeps create disabled without a name', () => {
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByText('No goals yet')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Create goal' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('creates a goal with a numeric main target', () => {
    renderWithProviders(<GoalsScreen />);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: ' Launch ' } });
    fireEvent.change(screen.getByLabelText('Target value'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Current value'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));
    expect(workspaceService.createGoal).toHaveBeenCalledWith({ name: 'Launch', description: '', targets: [{ name: 'Main target', kind: 'number', targetValue: 50, currentValue: 5 }] });
  });

  it('renders goal progress and deletes a goal', () => {
    state.goals = [{ id: 'g1', name: 'Ship v2', description: '', progress: 40, dueDate: null, targets: [] }];
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByRole('progressbar', { name: 'Ship v2' }).getAttribute('aria-valuenow')).toBe('40');
    expect(screen.getByText('40%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(workspaceService.deleteGoal).toHaveBeenCalledWith('g1');
  });

  it('keeps create disabled when the target is not positive', () => {
    renderWithProviders(<GoalsScreen />);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Target value'), { target: { value: '0' } });
    expect((screen.getByRole('button', { name: 'Create goal' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
