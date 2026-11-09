// @vitest-environment jsdom
process.env.TZ = 'America/Sao_Paulo';

import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMonthGrid } from '@/components/tasks/calendar-grid';
import { CalendarView } from '@/components/tasks/calendar-view';
import { sortTasks } from '@/components/tasks/table-sort';
import { barGeometry, timelineStart } from '@/components/tasks/timeline-geometry';
import { formatInstantDay } from '@/components/tasks/task-helpers';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskTableView } from '@/components/tasks/task-table-view';
import { computeWorkload } from '@/components/tasks/workload';
import { DateField } from '@/components/ui/date-field';
import { dayFromIso, formatDay, formatShortDay, isOverdueDay, isoFromDay } from '@/lib/calendar-day';
import { Member } from '@/types/api.types';
import { MEMBERS, makeSpace, makeTask } from './helpers/fixtures';
import { renderWithProviders } from './helpers/render-with-providers';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }), useUpdateTask: () => ({ mutate: vi.fn() }) }));

const LATE_UTC = '2026-11-15T01:00:00.000Z';
const MIDNIGHT_UTC = '2026-11-15T00:00:00.000Z';
const END_OF_UTC_DAY = '2026-11-15T23:59:59.000Z';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 15, 21));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('calendar days in a negative offset zone', () => {
  it('really runs in the negative zone', () => {
    expect(new Date(LATE_UTC).getTimezoneOffset()).toBe(180);
    expect(new Date(LATE_UTC).getDate()).toBe(14);
  });

  it('shows the same day in the short and the full format for every hour of the UTC day', () => {
    for (const iso of [LATE_UTC, MIDNIGHT_UTC, END_OF_UTC_DAY]) {
      expect(dayFromIso(iso)).toBe('2026-11-15');
      expect(formatShortDay(iso, 'pt')).toBe('15/11');
      expect(formatShortDay(iso, 'en')).toBe('11/15');
      expect(formatDay(dayFromIso(iso), 'pt')).toBe('15/11/2026');
    }
  });

  it('keeps the day when it is saved and read back', () => {
    expect(dayFromIso(isoFromDay('2026-11-15'))).toBe('2026-11-15');
    expect(formatShortDay(isoFromDay('2026-11-15'), 'pt')).toBe('15/11');
  });

  it('shows the due day in the date field', () => {
    renderWithProviders(<DateField ariaLabel="Due" value={dayFromIso(LATE_UTC)} onChange={() => undefined} />, 'pt');
    expect(screen.getByRole('button', { name: 'Due' }).textContent).toContain('15/11/2026');
  });

  it('keeps the update time in the browser zone because it is an instant, not a day', () => {
    expect(formatInstantDay(LATE_UTC, 'pt')).toBe('14/11');
  });

  it('places the task in the calendar cell of its own day', () => {
    renderWithProviders(<CalendarView tasks={[makeTask({ id: 'a', title: 'Alpha', dueDate: LATE_UTC })]} />);
    const cell = screen.getByRole('button', { name: 'Alpha' }).parentElement as HTMLElement;
    expect(cell.firstElementChild?.textContent).toBe('15');
    expect(buildMonthGrid(2026, 10).map((item) => item.key)).toContain('2026-11-15');
  });

  it('shows the due day in the table', () => {
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', dueDate: LATE_UTC })]} statusesOf={() => []} readOnly />, 'pt');
    expect(screen.getByRole('table').textContent).toContain('15/11');
  });

  it('shows the due day on the board card and does not mark a task due today as overdue', () => {
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'a', title: 'Alpha', dueDate: LATE_UTC })]} space={makeSpace()} listId="l1" />, 'pt');
    const day = screen.getByText('15/11');
    expect(day.className).not.toContain('text-danger');
  });

  it('marks the board card as overdue once the due day has passed', () => {
    vi.setSystemTime(new Date(2026, 10, 16, 0, 30));
    renderWithProviders(<KanbanBoard tasks={[makeTask({ id: 'a', title: 'Alpha', dueDate: LATE_UTC })]} space={makeSpace()} listId="l1" />, 'pt');
    expect(screen.getByText('15/11').className).toContain('text-danger');
  });

  it('is overdue only after the due day ends', () => {
    expect(isOverdueDay(LATE_UTC, '2026-11-14')).toBe(false);
    expect(isOverdueDay(LATE_UTC, '2026-11-15')).toBe(false);
    expect(isOverdueDay(LATE_UTC, '2026-11-16')).toBe(true);
    expect(isOverdueDay(null, '2026-11-16')).toBe(false);
  });

  it('counts workload overdue by day', () => {
    const members = [{ id: 'u', name: 'Ana' }] as Member[];
    const tasks = [makeTask({ assigneeIds: ['u'], dueDate: LATE_UTC })];
    expect(computeWorkload(tasks, members, '2026-11-15')[0].overdue).toBe(0);
    expect(computeWorkload(tasks, members, '2026-11-16')[0].overdue).toBe(1);
  });

  it('draws the timeline bar over the whole due day, whatever the hour stored', () => {
    const start = timelineStart(new Date(2026, 10, 15), 0);
    const expected = barGeometry(makeTask({ dueDate: '2026-11-15T12:00:00.000Z' }), start);
    expect(barGeometry(makeTask({ dueDate: LATE_UTC }), start)).toEqual(expected);
    expect(barGeometry(makeTask({ dueDate: END_OF_UTC_DAY }), start)).toEqual(expected);
    expect(start.toISOString()).toBe('2026-11-08T00:00:00.000Z');
  });

  it('sorts two tasks of the same day as equal, whatever the hour stored', () => {
    const first = makeTask({ id: 'first', dueDate: END_OF_UTC_DAY });
    const second = makeTask({ id: 'second', dueDate: LATE_UTC });
    expect(sortTasks([first, second], 'dueDate', 1).map((task) => task.id)).toEqual(['first', 'second']);
  });
});
