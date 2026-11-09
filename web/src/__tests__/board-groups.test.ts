import { describe, expect, it } from 'vitest';
import { makeSpace, makeTask } from './helpers/fixtures';
import { boardAnchor, boardDropPatch, buildBoardLayout, cellPresets, countInColumn, sortTasks, sumPoints } from '@/components/tasks/board-groups';
import { BOARD_NO_LANE, BOARD_NONE_KEY } from '@/components/tasks/board.constants';
import { BoardGroupBy, BoardSwimlane } from '@/types/view-display.types';

const space = makeSpace();
const people = [{ id: 'u1', name: 'Ana' }, { id: 'u2', name: 'Bruno' }];
const layout = (tasks: ReturnType<typeof makeTask>[], groupBy: BoardGroupBy, swimlane: BoardSwimlane = 'none') => buildBoardLayout({ tasks, statuses: space.statuses, groupBy, swimlane, people });
const keys = (lanes: ReturnType<typeof layout>) => lanes[0].columns.map((column) => column.key);

describe('buildBoardLayout', () => {
  it('keeps every status column in order and an orphan status at the end', () => {
    const lanes = layout([makeTask({ id: 'a', status: 'legacy' }), makeTask({ id: 'b', status: 'doing' })], 'status');
    expect(lanes).toHaveLength(1);
    expect(lanes[0].key).toBe(BOARD_NO_LANE);
    expect(keys(lanes)).toEqual(['to-do', 'doing', 'completed', 'legacy']);
    expect(lanes[0].columns[3].status).toBeUndefined();
  });

  it('puts a task in each assignee column, members first and the unassigned column last', () => {
    const lanes = layout([makeTask({ id: 'a', assigneeIds: ['u2', 'u1'] }), makeTask({ id: 'b', assigneeIds: ['gone'] }), makeTask({ id: 'c' })], 'assignee');
    expect(keys(lanes)).toEqual(['u1', 'u2', 'gone', BOARD_NONE_KEY]);
    expect(lanes[0].columns[0].tasks.map((task) => task.id)).toEqual(['a']);
    expect(lanes[0].columns[1].tasks.map((task) => task.id)).toEqual(['a']);
    expect(lanes[0].columns[3].tasks.map((task) => task.id)).toEqual(['c']);
  });

  it('sorts tag columns and leaves the no tag column last', () => {
    expect(keys(layout([makeTask({ id: 'a', tags: ['z', 'b'] }), makeTask({ id: 'c' })], 'tag'))).toEqual(['b', 'z', BOARD_NONE_KEY]);
  });

  it('always shows every priority column, even empty', () => {
    expect(keys(layout([], 'priority'))).toEqual(['urgent', 'high', 'normal', 'low', BOARD_NONE_KEY]);
  });

  it('builds one lane per value, each with the same columns', () => {
    const lanes = layout([makeTask({ id: 'a', assigneeIds: ['u1'], status: 'doing' }), makeTask({ id: 'b', status: 'doing' })], 'status', 'assignee');
    expect(lanes.map((lane) => lane.key)).toEqual(['u1', BOARD_NONE_KEY]);
    expect(lanes[0].columns.map((column) => column.key)).toEqual(['to-do', 'doing', 'completed']);
    expect(lanes[0].columns[1].tasks.map((task) => task.id)).toEqual(['a']);
    expect(lanes[1].columns[1].tasks.map((task) => task.id)).toEqual(['b']);
  });
});

describe('boardDropPatch', () => {
  const task = makeTask({ assigneeIds: ['u1', 'u2'], tags: ['a', 'b'], priority: 'high' });
  const cell = (column: string, lane = BOARD_NO_LANE) => ({ column, lane });

  it('returns nothing when the cell did not change', () => {
    expect(boardDropPatch(task, 'status', 'none', cell('to-do'), cell('to-do'))).toBeNull();
    expect(boardDropPatch(task, 'assignee', 'priority', cell('u1', 'high'), cell('u1', 'high'))).toBeNull();
  });

  it('changes the status and the priority by column', () => {
    expect(boardDropPatch(task, 'status', 'none', cell('to-do'), cell('doing'))).toEqual({ status: 'doing' });
    expect(boardDropPatch(task, 'priority', 'none', cell('high'), cell('low'))).toEqual({ priority: 'low' });
    expect(boardDropPatch(task, 'priority', 'none', cell('high'), cell(BOARD_NONE_KEY))).toEqual({ priority: null });
  });

  it('swaps only the dragged assignee or tag, and keeps the others', () => {
    expect(boardDropPatch(task, 'assignee', 'none', cell('u1'), cell('u3'))).toEqual({ addAssigneeIds: ['u3'], removeAssigneeIds: ['u1'] });
    expect(boardDropPatch(task, 'assignee', 'none', cell('u1'), cell('u2'))).toEqual({ addAssigneeIds: [], removeAssigneeIds: ['u1'] });
    expect(boardDropPatch(task, 'tag', 'none', cell('a'), cell('c'))).toEqual({ addTags: ['c'], removeTags: ['a'] });
  });

  it('removes every value on a drop on the empty column, and adds from it', () => {
    expect(boardDropPatch(task, 'assignee', 'none', cell('u1'), cell(BOARD_NONE_KEY))).toEqual({ addAssigneeIds: [], removeAssigneeIds: ['u1', 'u2'] });
    expect(boardDropPatch(makeTask(), 'tag', 'none', cell(BOARD_NONE_KEY), cell('c'))).toEqual({ addTags: ['c'], removeTags: [] });
  });

  it('applies the column and the lane together', () => {
    expect(boardDropPatch(task, 'status', 'assignee', cell('to-do', 'u1'), cell('doing', 'u3'))).toEqual({ status: 'doing', addAssigneeIds: ['u3'], removeAssigneeIds: ['u1'] });
    expect(boardDropPatch(task, 'status', 'priority', cell('to-do', 'high'), cell('to-do', BOARD_NONE_KEY))).toEqual({ priority: null });
  });

  it('does not let the lane undo the column when both group by the same field', () => {
    expect(boardDropPatch(task, 'assignee', 'assignee', cell('u1', 'u1'), cell('u3', 'u1'))).toEqual({ addAssigneeIds: ['u3'], removeAssigneeIds: ['u1'] });
    expect(boardDropPatch(task, 'priority', 'priority', cell('high', 'high'), cell('low', 'high'))).toEqual({ priority: 'low' });
  });
});

describe('sortTasks', () => {
  const tasks = [makeTask({ id: 'a', title: 'beta', priority: 'low', points: 2, dueDate: '2026-02-01', updatedAt: '2026-01-02' }), makeTask({ id: 'b', title: 'Alfa', priority: 'urgent', points: null, dueDate: null, updatedAt: '2026-01-01' }), makeTask({ id: 'c', title: 'gama', priority: null, points: 5, dueDate: '2026-01-01', updatedAt: '2026-01-03' })];
  const ids = (list: typeof tasks) => list.map((task) => task.id);

  it('keeps the server order on manual', () => {
    expect(sortTasks(tasks, 'manual', 'desc')).toBe(tasks);
  });

  it('sorts by title ignoring case, in both directions', () => {
    expect(ids(sortTasks(tasks, 'title', 'asc'))).toEqual(['b', 'a', 'c']);
    expect(ids(sortTasks(tasks, 'title', 'desc'))).toEqual(['c', 'a', 'b']);
  });

  it('sorts priority by rank, not by name', () => {
    expect(ids(sortTasks(tasks, 'priority', 'asc'))).toEqual(['b', 'a', 'c']);
  });

  it('keeps empty values last in both directions', () => {
    expect(ids(sortTasks(tasks, 'points', 'asc'))).toEqual(['a', 'c', 'b']);
    expect(ids(sortTasks(tasks, 'points', 'desc'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortTasks(tasks, 'dueDate', 'desc'))).toEqual(['a', 'c', 'b']);
  });

  it('sorts by last update and does not change the input', () => {
    expect(ids(sortTasks(tasks, 'updatedAt', 'desc'))).toEqual(['c', 'a', 'b']);
    expect(ids(tasks)).toEqual(['a', 'b', 'c']);
  });
});

describe('column totals and presets', () => {
  it('sums points treating empty as zero', () => {
    expect(sumPoints([makeTask({ points: 2 }), makeTask({ points: null }), makeTask({ points: 0.5 })])).toBe(2.5);
  });

  it('counts a task in several lanes once', () => {
    const lanes = layout([makeTask({ id: 'a', assigneeIds: ['u1', 'u2'] }), makeTask({ id: 'b', assigneeIds: ['u2'] })], 'status', 'assignee');
    expect(countInColumn(lanes, 'to-do')).toBe(2);
    expect(countInColumn(lanes, 'doing')).toBe(0);
  });

  it('builds the anchor from lane and column', () => {
    expect(boardAnchor('a', 'b')).not.toBe(boardAnchor('b', 'a'));
  });

  it('presets the status of a status column', () => {
    expect(cellPresets('status', 'none', 'doing', BOARD_NO_LANE, space)).toEqual({ status: 'doing', assigneeIds: [], priority: null, tags: [] });
  });

  it('presets the group and lane values, and leaves the status to the server otherwise', () => {
    expect(cellPresets('assignee', 'priority', 'u1', 'high', space)).toEqual({ assigneeIds: ['u1'], priority: 'high', tags: [] });
    expect(cellPresets('priority', 'assignee', 'low', 'u2', space)).toEqual({ assigneeIds: ['u2'], priority: 'low', tags: [] });
    expect(cellPresets('tag', 'none', 'infra', BOARD_NO_LANE, space)).toEqual({ assigneeIds: [], priority: null, tags: ['infra'] });
  });

  it('presets nothing from an empty column or lane', () => {
    expect(cellPresets('assignee', 'priority', BOARD_NONE_KEY, BOARD_NONE_KEY, space)).toEqual({ assigneeIds: [], priority: null, tags: [] });
    expect(cellPresets('tag', 'none', BOARD_NONE_KEY, BOARD_NO_LANE, space).tags).toEqual([]);
  });

  it('presets a required tag only when there is exactly one to choose', () => {
    expect(cellPresets('status', 'none', 'doing', BOARD_NO_LANE, makeSpace({ requiredTags: ['P4T'] })).tags).toEqual(['p4t']);
    expect(cellPresets('status', 'none', 'doing', BOARD_NO_LANE, makeSpace({ requiredTags: ['a', 'b'] })).tags).toEqual([]);
    expect(cellPresets('tag', 'none', 'p4t', BOARD_NO_LANE, makeSpace({ requiredTags: ['p4t'] })).tags).toEqual(['p4t']);
  });
});
