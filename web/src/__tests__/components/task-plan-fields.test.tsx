// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { makeTask } from '../helpers/fixtures';
import { TaskDependencies } from '@/components/tasks/task-dependencies';
import { TaskEstimateField } from '@/components/tasks/task-estimate-field';
import { TaskKindField } from '@/components/tasks/task-kind-field';
import { TaskRepeatSection } from '@/components/tasks/task-repeat-section';
import { TaskTrackTimeField } from '@/components/tasks/task-track-time-field';
import { workspaceService } from '@/services/workspace.service';
import { useSessionStore } from '@/stores/session.store';
import { TaskPlan } from '@/types/workspace.types';

const plan = (over: Partial<TaskPlan> = {}): TaskPlan => ({ taskId: 't1', taskKind: 'task', estimateMinutes: null, trackedMinutes: 0, remainingMinutes: null, ...over });

describe('task plan fields', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    vi.spyOn(workspaceService, 'plan').mockResolvedValue(plan({ estimateMinutes: 90, trackedMinutes: 30 }));
    vi.spyOn(workspaceService, 'time').mockResolvedValue({ totalMinutes: 30, entries: [] });
    vi.spyOn(workspaceService, 'dependencies').mockResolvedValue({ blockedBy: [], blocking: [] });
    vi.spyOn(workspaceService, 'recurrence').mockResolvedValue(null);
  });

  it('shows the estimate as a placeholder and saves a new one on blur, skipping a blank field', async () => {
    const change = vi.spyOn(workspaceService, 'changePlan').mockResolvedValue(plan({ estimateMinutes: 45 }));
    renderWithProviders(<TaskEstimateField taskId="t1" onError={vi.fn()} />);
    const input = screen.getByRole('spinbutton', { name: 'Estimate (min)' }) as HTMLInputElement;
    await waitFor(() => expect(input.placeholder).toBe('90 min'));
    fireEvent.blur(input);
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.blur(input);
    await waitFor(() => expect(change).toHaveBeenCalledWith('t1', { estimateMinutes: 45 }));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('reports a refused estimate to the modal and keeps what was typed', async () => {
    const failure = new Error('nope');
    vi.spyOn(workspaceService, 'changePlan').mockRejectedValue(failure);
    const onError = vi.fn();
    renderWithProviders(<TaskEstimateField taskId="t1" onError={onError} />);
    const input = screen.getByRole('spinbutton', { name: 'Estimate (min)' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);
    await waitFor(() => expect(onError.mock.calls[0]?.[0]).toBe(failure));
    expect(input.value).toBe('15');
  });

  it('starts and stops the timer and adds manual minutes from the plus', async () => {
    const start = vi.spyOn(workspaceService, 'startTimer').mockResolvedValue({});
    const stop = vi.spyOn(workspaceService, 'stopTimer').mockResolvedValue({});
    const add = vi.spyOn(workspaceService, 'addTime').mockResolvedValue({});
    const { unmount } = renderWithProviders(<TaskTrackTimeField taskId="t1" onError={vi.fn()} />);
    expect(await screen.findByText('30 min')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }));
    await waitFor(() => expect(start).toHaveBeenCalledWith('t1'));
    fireEvent.click(screen.getByRole('button', { name: 'Add time' }));
    const dialog = screen.getByRole('dialog', { name: 'Add time' });
    expect((within(dialog).getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Minutes' }), { target: { value: '20' } });
    fireEvent.submit(within(dialog).getByRole('spinbutton', { name: 'Minutes' }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(add).toHaveBeenCalledWith('t1', 20));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add time' })).toBeNull());
    unmount();
    vi.mocked(workspaceService.time).mockResolvedValue({ totalMinutes: 30, entries: [{ id: 'e1', userId: 'u1', minutes: 0, running: true }] });
    renderWithProviders(<TaskTrackTimeField taskId="t1" onError={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Stop timer' }));
    await waitFor(() => expect(stop).toHaveBeenCalledWith('t1'));
  });

  it('saves the chosen frequency and interval from the Repeat section, and shows and removes an existing one', async () => {
    const set = vi.spyOn(workspaceService, 'setRecurrence').mockResolvedValue({ frequency: 'monthly', interval: 2, nextRunAt: '2026-12-01T00:00:00Z', active: true });
    const { unmount } = renderWithProviders(<TaskRepeatSection taskId="t1" onError={vi.fn()} />);
    const section = screen.getByRole('region', { name: 'Repeat' });
    expect(within(section).queryByRole('button', { name: 'Remove repeat' })).toBeNull();
    chooseOption(within(section).getByRole('combobox', { name: 'Frequency' }), 'Monthly');
    fireEvent.change(within(section).getByRole('spinbutton', { name: 'Interval' }), { target: { value: '2' } });
    fireEvent.click(within(section).getByRole('button', { name: 'Save repeat' }));
    await waitFor(() => expect(set).toHaveBeenCalledWith('t1', { frequency: 'monthly', interval: 2 }));
    unmount();
    vi.mocked(workspaceService.recurrence).mockResolvedValue({ frequency: 'weekly', interval: 3, nextRunAt: '2026-12-01T00:00:00Z', active: true });
    const remove = vi.spyOn(workspaceService, 'removeRecurrence').mockResolvedValue(undefined);
    renderWithProviders(<TaskRepeatSection taskId="t1" onError={vi.fn()} />);
    expect(await screen.findByText('Weekly, every 3')).toBeTruthy();
    expect((screen.getByRole('spinbutton', { name: 'Interval' }) as HTMLInputElement).value).toBe('3');
    fireEvent.click(screen.getByRole('button', { name: 'Remove repeat' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('t1'));
  });

  it('changes the task type from the inline select', async () => {
    const change = vi.spyOn(workspaceService, 'changePlan').mockResolvedValue(plan({ taskKind: 'milestone' }));
    renderWithProviders(<TaskKindField taskId="t1" onError={vi.fn()} />);
    chooseOption(screen.getByRole('combobox', { name: 'Type' }), 'Milestone');
    await waitFor(() => expect(change).toHaveBeenCalledWith('t1', { taskKind: 'milestone' }));
  });

  it('shows blockers only when there are some or the modal asks, never offers the task itself, and closes on cancel', async () => {
    const siblings = [makeTask({ id: 't1', title: 'Self' }), makeTask({ id: 't2', title: 'Other' })];
    const add = vi.spyOn(workspaceService, 'addDependency').mockResolvedValue({ blockedBy: ['t2'], blocking: [] });
    const onClose = vi.fn();
    const { container, rerender } = renderWithProviders(<TaskDependencies taskId="t1" siblings={siblings} open={false} onClose={onClose} onError={vi.fn()} />);
    await waitFor(() => expect(workspaceService.dependencies).toHaveBeenCalled());
    expect(container.textContent).toBe('');
    rerender(<TaskDependencies taskId="t1" siblings={siblings} open onClose={onClose} onError={vi.fn()} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Add blocker' }));
    expect(screen.queryByRole('option', { name: 'Self' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'Other' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(add).toHaveBeenCalledWith('t1', 't2'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps listed blockers visible after the editor closes and removes one', async () => {
    vi.mocked(workspaceService.dependencies).mockResolvedValue({ blockedBy: ['t2'], blocking: [] });
    const remove = vi.spyOn(workspaceService, 'removeDependency').mockResolvedValue(undefined);
    renderWithProviders(<TaskDependencies taskId="t1" siblings={[makeTask({ id: 't2', title: 'Other' })]} open={false} onClose={vi.fn()} onError={vi.fn()} />);
    expect(await screen.findByText('Other')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove blocker' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('t1', 't2'));
  });
});
