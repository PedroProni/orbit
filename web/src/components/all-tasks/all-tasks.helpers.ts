import { ALL_TASKS_KEY } from '@/config/app.constants';
import { SpaceNode, StatusDefinition, Task } from '@/types/api.types';
import { STATUS_TYPE_RANK } from './all-tasks.constants';
import { BoardTarget } from '@/components/tasks/kanban-board.types';

export function unionStatuses(spaces: SpaceNode[]): StatusDefinition[] {
  const byName = new Map<string, { status: StatusDefinition; rank: number; orders: number[] }>();
  for (const space of spaces) {
    for (const status of space.statuses) {
      const known = byName.get(status.name);
      if (known) {
        known.orders.push(status.order);
        known.rank = Math.min(known.rank, STATUS_TYPE_RANK[status.type]);
      } else {
        byName.set(status.name, { status, rank: STATUS_TYPE_RANK[status.type], orders: [status.order] });
      }
    }
  }
  const average = (orders: number[]) => orders.reduce((sum, value) => sum + value, 0) / orders.length;
  return [...byName.values()].sort((a, b) => a.rank - b.rank || average(a.orders) - average(b.orders) || a.status.name.localeCompare(b.status.name)).map((entry, order) => ({ ...entry.status, order }));
}

export const allTasksSpace = (spaces: SpaceNode[]): SpaceNode => ({ id: ALL_TASKS_KEY, name: '', statuses: unionStatuses(spaces), requiredTags: [], titlePrefixes: [], folders: [], lists: spaces.flatMap((space) => space.lists) });

export function defaultTarget(spaces: SpaceNode[], status: string | undefined, recent: string[]): BoardTarget | null {
  const fits = (space: SpaceNode) => !status || space.statuses.some((item) => item.name === status);
  for (const listId of recent) {
    const space = spaces.find((item) => item.lists.some((list) => list.id === listId));
    if (space && fits(space)) return { listId, space };
  }
  for (const space of spaces) {
    const list = space.lists[0];
    if (list && fits(space)) return { listId: list.id, space };
  }
  return null;
}

export const spaceOfTask = (spaces: SpaceNode[], task: Pick<Task, 'spaceId'>): SpaceNode | undefined => spaces.find((space) => space.id === task.spaceId);

export const listNameOf = (spaces: SpaceNode[], task: Pick<Task, 'spaceId' | 'listId'>): string => {
  const space = spaceOfTask(spaces, task);
  return space ? (space.lists.find((list) => list.id === task.listId)?.name ?? '') : '';
};
