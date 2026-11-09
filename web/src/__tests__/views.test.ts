import { describe, expect, it } from 'vitest';
import { buildMonthGrid } from '@/components/tasks/calendar-grid';
import { dayKey } from '@/lib/calendar-day';
import { barGeometry, timelineStart } from '@/components/tasks/timeline-geometry';
import { computeWorkload } from '@/components/tasks/workload';
import { sortTasks } from '@/components/tasks/table-sort';
import { Member, Task } from '@/types/api.types';

const task = (over: Partial<Task>): Task => ({
  id: 'x',
  listId: 'l',
  spaceId: 's',
  parentId: null,
  title: 't',
  descriptionMd: '',
  status: 'to-do',
  priority: null,
  tags: [],
  assigneeIds: [],
  watcherIds: [],
  points: null,
  startDate: null,
  dueDate: null,
  checklists: [],
  customFields: [],
  links: { figma: null, notion: null, printsFolder: null },
  creatorId: 'u',
  dateClosed: null,
  archived: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('calendar grid', () => {
  it('always has 42 cells starting on a Sunday and contains the whole month', () => {
    const grid = buildMonthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(new Date(grid[0].key + 'T12:00:00').getDay()).toBe(0);
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30);
    expect(grid.map((c) => c.key)).toContain(dayKey(new Date(2026, 10, 4)));
  });
});

describe('timeline geometry', () => {
  const start = timelineStart(new Date(2026, 10, 4), 0);
  it('places a task inside the window with a minimum width', () => {
    const bar = barGeometry(task({ dueDate: '2026-11-10T12:00:00.000Z' }), start);
    expect(bar).not.toBeNull();
    expect(bar!.left).toBeGreaterThan(0);
    expect(bar!.width).toBeGreaterThanOrEqual(2);
  });
  it('hides tasks outside the window or without a due date', () => {
    expect(barGeometry(task({ dueDate: '2027-06-01T12:00:00.000Z' }), start)).toBeNull();
    expect(barGeometry(task({ dueDate: null }), start)).toBeNull();
  });
});

describe('workload', () => {
  const members = [{ id: 'a', name: 'Ana' }] as Member[];
  it('counts open tasks, points and overdue per assignee and ignores closed ones', () => {
    const rows = computeWorkload([task({ assigneeIds: ['a'], points: 3, dueDate: '2026-11-01T00:00:00Z' }), task({ assigneeIds: ['a'], points: 2 }), task({ assigneeIds: ['a'], dateClosed: '2026-11-02T00:00:00Z' }), task({})], members, '2026-11-04');
    const ana = rows.find((r) => r.id === 'a')!;
    expect(ana).toMatchObject({ name: 'Ana', open: 2, points: 5, overdue: 1 });
    expect(rows.find((r) => r.id === '')!.open).toBe(1);
  });
});

describe('table sort', () => {
  it('sorts by priority rank and respects direction', () => {
    const list = [task({ id: '1', priority: 'low' }), task({ id: '2', priority: 'urgent' }), task({ id: '3', priority: null })];
    expect(sortTasks(list, 'priority', 1).map((t) => t.id)).toEqual(['2', '1', '3']);
    expect(sortTasks(list, 'priority', -1).map((t) => t.id)).toEqual(['3', '1', '2']);
  });
});
