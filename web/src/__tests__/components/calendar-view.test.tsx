// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeTask, resetUiStore } from '../helpers/fixtures';
import { CalendarView } from '@/components/tasks/calendar-view';
import { useUiStore } from '@/stores/ui.store';

describe('CalendarView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 4, 12));
    resetUiStore();
  });

  afterEach(() => vi.useRealTimers());

  it('shows the current month title with only the first letter capitalized', () => {
    renderWithProviders(<CalendarView tasks={[]} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('November 2026');
  });

  it('keeps the rest of a localized title lowercase', () => {
    renderWithProviders(<CalendarView tasks={[]} />, 'pt');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Novembro de 2026');
  });

  it('navigates to the previous and next month', () => {
    renderWithProviders(<CalendarView tasks={[]} />);
    fireEvent.click(screen.getByLabelText('Next month'));
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('January 2027');
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('December 2026');
  });

  it('places tasks on their due day, opens them and collapses overflow', () => {
    const tasks = [makeTask({ id: 'a', title: 'Alpha', dueDate: '2026-11-10T12:00:00Z' }), ...['b', 'c', 'd', 'e'].map((id) => makeTask({ id, title: `Many ${id}`, dueDate: '2026-11-20T12:00:00Z' }))];
    renderWithProviders(<CalendarView tasks={tasks} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(useUiStore.getState().openTaskId).toBe('a');
    expect(screen.getByText('+1 more')).toBeTruthy();
    expect(screen.queryByText('Many e')).toBeNull();
  });

  it('tells when no task has a due date', () => {
    renderWithProviders(<CalendarView tasks={[makeTask()]} />);
    expect(screen.getByText('No task in this list has a due date')).toBeTruthy();
  });
});
