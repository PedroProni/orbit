import { SpaceNode, Task, TaskPriority } from '@/types/api.types';
import { TaskPatch } from '@/services/orbit.types';
import { BoardGroupBy, BoardSwimlane, ViewSortBy, ViewSortDirection } from '@/types/view-display.types';
import { BOARD_DRAG_SEPARATOR, BOARD_NO_LANE, BOARD_NONE_KEY, BOARD_PRIORITY_KEYS, PRIORITY_RANK } from './board.constants';
import { BoardColumnModel, BoardLaneModel, BoardLayoutInput, BoardPerson, MoveValueResult } from './board.types';
import { ComposerPresets } from './task-composer.types';

const keysFor = (task: Task, by: BoardGroupBy | Exclude<BoardSwimlane, 'none'>): string[] => {
  if (by === 'status') return [task.status];
  if (by === 'priority') return [task.priority ?? BOARD_NONE_KEY];
  const values = by === 'assignee' ? task.assigneeIds : task.tags;
  return values.length ? values : [BOARD_NONE_KEY];
};

const orderedKeys = (tasks: Task[], by: 'assignee' | 'tag', people: BoardPerson[]): string[] => {
  const used = new Set(tasks.flatMap((task) => keysFor(task, by)));
  const hasNone = used.delete(BOARD_NONE_KEY);
  const known = by === 'assignee' ? people.map((p) => p.id).filter((id) => used.has(id)) : [];
  const rest = [...used].filter((key) => !known.includes(key)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest, ...(hasNone ? [BOARD_NONE_KEY] : [])];
};

const columnsFor = ({ tasks, statuses, groupBy, people }: BoardLayoutInput, laneTasks: Task[]): BoardColumnModel[] => {
  if (groupBy === 'status') {
    const known = statuses.map((status) => ({ key: status.name, status, tasks: laneTasks.filter((task) => task.status === status.name) }));
    const names = statuses.map((status) => status.name);
    const orphan = [...new Set(tasks.map((task) => task.status))].filter((name) => !names.includes(name));
    return [...known, ...orphan.map((key) => ({ key, tasks: laneTasks.filter((task) => task.status === key) }))];
  }
  const keys = groupBy === 'priority' ? [...BOARD_PRIORITY_KEYS] : orderedKeys(tasks, groupBy, people);
  return keys.map((key) => ({ key, tasks: laneTasks.filter((task) => keysFor(task, groupBy).includes(key)) }));
};

export function buildBoardLayout(input: BoardLayoutInput): BoardLaneModel[] {
  const { tasks, swimlane, people } = input;
  if (swimlane === 'none') return [{ key: BOARD_NO_LANE, columns: columnsFor(input, tasks) }];
  const laneKeys = swimlane === 'priority' ? [...BOARD_PRIORITY_KEYS] : orderedKeys(tasks, 'assignee', people);
  return laneKeys.map((key) => ({ key, columns: columnsFor(input, tasks.filter((task) => keysFor(task, swimlane).includes(key))) }));
};

const moveValue = (current: string[], from: string, to: string): MoveValueResult => {
  if (to === BOARD_NONE_KEY) return { add: [], remove: current };
  return { add: current.includes(to) ? [] : [to], remove: from === BOARD_NONE_KEY ? [] : [from] };
};

const patchFor = (task: Task, by: BoardGroupBy | BoardSwimlane, from: string, to: string): TaskPatch => {
  if (from === to || by === 'none') return {};
  if (by === 'status') return { status: to };
  if (by === 'priority') return { priority: to === BOARD_NONE_KEY ? null : to };
  if (by === 'tag') {
    const { add, remove } = moveValue(task.tags, from, to);
    return { addTags: add, removeTags: remove };
  }
  const { add, remove } = moveValue(task.assigneeIds, from, to);
  return { addAssigneeIds: add, removeAssigneeIds: remove };
};

export function boardDropPatch(task: Task, groupBy: BoardGroupBy, swimlane: BoardSwimlane, from: { column: string; lane: string }, to: { column: string; lane: string }): TaskPatch | null {
  const patch = { ...patchFor(task, groupBy, from.column, to.column), ...(swimlane === groupBy ? {} : patchFor(task, swimlane, from.lane, to.lane)) };
  return Object.keys(patch).length ? patch : null;
}

const sortValue = (task: Task, by: ViewSortBy): string | number | null => {
  if (by === 'priority') return task.priority ? PRIORITY_RANK[task.priority] : null;
  if (by === 'dueDate') return task.dueDate;
  if (by === 'title') return task.title.toLowerCase();
  if (by === 'points') return task.points;
  if (by === 'updatedAt') return task.updatedAt;
  return null;
};

export function sortTasks(tasks: Task[], by: ViewSortBy, direction: ViewSortDirection): Task[] {
  if (by === 'manual') return tasks;
  const sign = direction === 'asc' ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const left = sortValue(a, by);
    const right = sortValue(b, by);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    if (left === right) return 0;
    return (left < right ? -1 : 1) * sign;
  });
}

export const sumPoints = (tasks: Task[]): number => tasks.reduce((total, task) => total + (task.points ?? 0), 0);

export const countInColumn = (lanes: BoardLaneModel[], column: string): number => new Set(lanes.flatMap((lane) => lane.columns.filter((c) => c.key === column).flatMap((c) => c.tasks.map((task) => task.id)))).size;

export function cellPresets(groupBy: BoardGroupBy, swimlane: BoardSwimlane, column: string, lane: string, space: SpaceNode): ComposerPresets {
  const valueOf = (by: 'assignee' | 'priority'): string | null => {
    if (groupBy === by) return column === BOARD_NONE_KEY ? null : column;
    if (swimlane === by) return lane === BOARD_NONE_KEY ? null : lane;
    return null;
  };
  const assignee = valueOf('assignee');
  const tags = [...(groupBy === 'tag' && column !== BOARD_NONE_KEY ? [column] : []), ...(space.requiredTags.length === 1 ? [space.requiredTags[0].toLowerCase()] : [])];
  return { ...(groupBy === 'status' ? { status: column } : {}), assigneeIds: assignee ? [assignee] : [], priority: valueOf('priority') as TaskPriority | null, tags: [...new Set(tags)] };
}

export const boardAnchor = (lane: string, column: string): string => ['board', lane, column].join(BOARD_DRAG_SEPARATOR);
