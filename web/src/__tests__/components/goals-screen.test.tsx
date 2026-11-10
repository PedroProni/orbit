// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { GoalsScreen } from '@/components/workspace/goals-screen';
import { workspaceService } from '@/services/workspace.service';

vi.mock('@/services/workspace.service', () => ({ workspaceService: { createGoal: vi.fn(), deleteGoal: vi.fn() } }));

const state = vi.hoisted(() => ({ goals: [] as unknown[] }));

vi.mock('@/hooks/use-workspace', () => ({
  useGoals: () => ({ data: state.goals }),
  useInvalidating: (fn: (args: unknown) => unknown) => ({ mutate: (args: unknown) => fn(args), mutateAsync: async (args: unknown) => fn(args), isPending: false }),
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

  it('renders goal progress and deletes a goal only after the confirmation', async () => {
    state.goals = [{ id: 'g1', name: 'Ship v2', description: '', progress: 40, dueDate: null, targets: [] }];
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByRole('progressbar', { name: 'Ship v2' }).getAttribute('aria-valuenow')).toBe('40');
    expect(screen.getByText('40%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete goal Ship v2' }));
    expect(screen.getByText('Delete the goal "Ship v2"? Its progress goes with it.')).toBeTruthy();
    expect(workspaceService.deleteGoal).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete goal' })).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(workspaceService.deleteGoal).toHaveBeenCalledWith('g1'));
  });

  it('gives the goal name its own full row on narrow screens and shares the row from sm up', () => {
    renderWithProviders(<GoalsScreen />);
    const classes = screen.getByLabelText('Goal name').className.split(' ');
    expect(classes).toContain('basis-full');
    expect(classes).toContain('sm:flex-1');
    expect(classes).toContain('sm:basis-0');
    expect(classes).not.toContain('flex-1');
  });

  it('keeps create disabled when the target is not positive', () => {
    renderWithProviders(<GoalsScreen />);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Target value'), { target: { value: '0' } });
    expect((screen.getByRole('button', { name: 'Create goal' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
