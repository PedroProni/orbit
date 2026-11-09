// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TaskStatusPill } from '@/components/tasks/task-status-pill';
import { completeStatus, nextStatus, orderedStatuses } from '@/components/tasks/task-status-pill.helpers';
import { StatusDefinition } from '@/types/api.types';

const STATUSES: StatusDefinition[] = [
  { name: 'review', color: '#aa00aa', type: 'review', order: 2 },
  { name: 'to-do', color: '#888888', type: 'open', order: 0 },
  { name: 'closed', color: '#00aa00', type: 'closed', order: 4 },
  { name: 'doing', color: '#0000ff', type: 'active', order: 1 },
  { name: 'done', color: '#00ff00', type: 'done', order: 3 },
];

describe('status pill helpers', () => {
  it('follows the space order, stops at the last status and finds the first status that completes the task', () => {
    expect(orderedStatuses(STATUSES).map((status) => status.name)).toEqual(['to-do', 'doing', 'review', 'done', 'closed']);
    expect(nextStatus(STATUSES, 'doing')?.name).toBe('review');
    expect(nextStatus(STATUSES, 'closed')).toBeNull();
    expect(nextStatus(STATUSES, 'unknown')).toBeNull();
    expect(completeStatus(STATUSES)?.name).toBe('done');
    expect(completeStatus(STATUSES.filter((status) => status.type !== 'done'))?.name).toBe('closed');
    expect(completeStatus(STATUSES.filter((status) => status.type !== 'closed' && status.type !== 'done'))).toBeNull();
  });
});

describe('TaskStatusPill', () => {
  it('paints the pill in the status color and moves to the next status or completes the task', () => {
    const onChange = vi.fn();
    renderWithProviders(<TaskStatusPill statuses={STATUSES} value="doing" readOnly={false} onChange={onChange} />);
    expect(screen.getByTestId('status-pill').style.backgroundColor).toBe('rgb(0, 0, 255)');
    fireEvent.click(screen.getByRole('button', { name: 'Move to review' }));
    expect(onChange).toHaveBeenLastCalledWith('review');
    fireEvent.click(screen.getByRole('button', { name: 'Mark as done' }));
    expect(onChange).toHaveBeenLastCalledWith('done');
  });

  it('has no next arrow on the last status and no check once the task is complete', () => {
    const { unmount } = renderWithProviders(<TaskStatusPill statuses={STATUSES} value="closed" readOnly={false} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Move to/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark as/ })).toBeNull();
    unmount();
    renderWithProviders(<TaskStatusPill statuses={STATUSES} value="done" readOnly={false} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Move to closed' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Mark as/ })).toBeNull();
  });

  it('gives a guest a disabled pill with no shortcuts', () => {
    renderWithProviders(<TaskStatusPill statuses={STATUSES} value="to-do" readOnly onChange={vi.fn()} />);
    expect((screen.getByRole('combobox', { name: 'Status' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /Move to/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark as/ })).toBeNull();
  });
});
