import { describe, expect, it } from 'vitest';
import { makeSpace, makeTask } from './helpers/fixtures';
import { allTasksSpace, defaultTarget, listNameOf, unionStatuses } from '@/components/all-tasks/all-tasks.helpers';
import { ALL_TASKS_KEY } from '@/config/app.constants';
import { ListNode, SpaceNode } from '@/types/api.types';

const list = (id: string, spaceId: string, name: string): ListNode => ({ id, spaceId, folderId: null, name, kind: 'list' });
const eng = makeSpace({ id: 's1', name: 'Engineering', lists: [list('l1', 's1', 'Backlog'), list('l2', 's1', 'Sprint')] });
const ops: SpaceNode = makeSpace({
  id: 's2',
  name: 'Ops',
  statuses: [
    { name: 'to-do', color: '#111111', type: 'open', order: 0 },
    { name: 'review', color: '#ff00ff', type: 'review', order: 1 },
    { name: 'shipped', color: '#00ffff', type: 'closed', order: 2 },
  ],
  lists: [list('l3', 's2', 'Runbook')],
});

describe('All tasks helpers', () => {
  it('joins statuses with the same name once, open first, then the middle ones, closed last', () => {
    const union = unionStatuses([eng, ops]);
    expect(union.map((status) => status.name)).toEqual(['to-do', 'doing', 'review', 'completed', 'shipped']);
    expect(union.find((status) => status.name === 'to-do')?.color).toBe('#888888');
    expect(union.map((status) => status.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it('builds one virtual space with every list and no creation rule of its own', () => {
    const space = allTasksSpace([eng, ops]);
    expect(space.id).toBe(ALL_TASKS_KEY);
    expect(space.lists.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
    expect(space.titlePrefixes).toEqual([]);
    expect(space.requiredTags).toEqual([]);
  });

  it('picks the most recent list whose space has the status, then the first list that has it', () => {
    expect(defaultTarget([eng, ops], 'review', ['l1', 'l3'])).toEqual({ listId: 'l3', space: ops });
    expect(defaultTarget([eng, ops], 'doing', ['l3', 'l2'])).toEqual({ listId: 'l2', space: eng });
    expect(defaultTarget([eng, ops], 'shipped', [])).toEqual({ listId: 'l3', space: ops });
    expect(defaultTarget([eng, ops], undefined, ['l3'])).toEqual({ listId: 'l3', space: ops });
    expect(defaultTarget([eng, ops], 'missing', ['l1'])).toBeNull();
    expect(defaultTarget([eng], 'doing', ['gone'])).toEqual({ listId: 'l1', space: eng });
  });

  it('names the list a task comes from', () => {
    expect(listNameOf([eng, ops], makeTask({ spaceId: 's2', listId: 'l3' }))).toBe('Runbook');
    expect(listNameOf([eng, ops], makeTask({ spaceId: 'sx', listId: 'l3' }))).toBe('');
  });
});
