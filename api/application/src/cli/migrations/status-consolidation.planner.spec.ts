import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { StatusType } from '@domain/enums/space.enums';
import { StatusConsolidationPlanner } from './status-consolidation.planner';
import { ConsolidationSpaceDoc, ConsolidationTaskDoc } from './status-consolidation.type';

const legacySpace: ConsolidationSpaceDoc = {
  _id: 'sp1',
  workspace_id: 'w1',
  statuses: ['backlog', 'to-do', 'stuck', 'in development', 'waiting review', 'in review', 'testing', 'ready for deploy']
    .map((name, order) => ({ name, color: '#000', type: order < 2 ? StatusType.OPEN : StatusType.ACTIVE, order }))
    .concat([
      { name: 'deployed', color: '#000', type: StatusType.DONE, order: 8 },
      { name: 'cancelled', color: '#000', type: StatusType.CLOSED, order: 9 },
      { name: 'complete', color: '#000', type: StatusType.DONE, order: 10 },
      { name: 'closed', color: '#000', type: StatusType.CLOSED, order: 11 },
      { name: 'open', color: '#000', type: StatusType.OPEN, order: 12 },
      { name: 'in progress', color: '#000', type: StatusType.ACTIVE, order: 13 },
    ]),
};

const updated = new Date('2026-10-01T10:00:00Z');
const task = (id: string, status: string, extra: Partial<ConsolidationTaskDoc> = {}): ConsolidationTaskDoc => ({
  _id: id,
  workspace_id: 'w1',
  space_id: 'sp1',
  status,
  tags: [],
  date_closed: null,
  updated_at: updated,
  ...extra,
});

describe('StatusConsolidationPlanner', () => {
  const legacy = ['backlog', 'to-do', 'open', 'in development', 'in progress', 'stuck', 'waiting review', 'in review', 'testing', 'ready for deploy', 'deployed', 'complete', 'closed', 'cancelled'];
  const fiveStatuses = ['To do', 'In progress', 'In review', 'Done', 'Cancelled'];

  it('moves every old status to its target and rewrites the space to the seven statuses', () => {
    const tasks = legacy.map((s, i) => task(`t${i}`, s, ['deployed', 'complete', 'closed', 'cancelled'].includes(s) ? { date_closed: new Date('2026-09-01T00:00:00Z') } : {}));
    const plan = StatusConsolidationPlanner.plan([legacySpace], tasks);
    expect(plan.unmapped).toEqual([]);
    expect(plan.countsAfter).toEqual({ backlog: 1, 'to-do': 2, stuck: 1, 'in development': 2, 'waiting review': 1, 'in review': 2, completed: 5 });
    expect(plan.spaces).toHaveLength(1);
    expect(plan.spaces[0].after.map(s => s.name)).toEqual(DEFAULT_STATUSES.map(s => s.name));
    expect(Object.values(plan.countsBefore).reduce((a, b) => a + b, 0)).toBe(Object.values(plan.countsAfter).reduce((a, b) => a + b, 0));
  });

  it('moves data already on the five statuses', () => {
    const closed = new Date('2026-09-01T00:00:00Z');
    const tasks = fiveStatuses.map((s, i) => task(`f${i}`, s, ['Done', 'Cancelled'].includes(s) ? { date_closed: closed } : {}));
    const plan = StatusConsolidationPlanner.plan([legacySpace], tasks);
    expect(plan.unmapped).toEqual([]);
    expect(plan.countsAfter).toEqual({ 'to-do': 1, 'in development': 1, 'in review': 1, completed: 2 });
    expect(plan.tasks.find(t => t.id === 'f4')!.after.tags).toEqual(['cancelado']);
    expect(plan.tasks.find(t => t.id === 'f3')!.after.tags).toEqual([]);
  });

  it('sends an In progress task tagged bloqueado back to stuck and keeps the tag', () => {
    const plan = StatusConsolidationPlanner.plan([legacySpace], [task('a', 'In progress', { tags: ['bloqueado', 'back-end'] }), task('b', 'In progress', { tags: ['back-end'] }), task('c', 'stuck')]);
    expect(plan.tasks.find(t => t.id === 'a')!.after).toMatchObject({ status: 'stuck', tags: ['bloqueado', 'back-end'] });
    expect(plan.tasks.find(t => t.id === 'b')!.after.status).toBe('in development');
    expect(plan.tasks.find(t => t.id === 'c')).toBeUndefined();
  });

  it('tags cancelled tasks with cancelado once and keeps their other tags', () => {
    const plan = StatusConsolidationPlanner.plan([legacySpace], [task('a', 'cancelled', { tags: ['back-end'] }), task('b', 'Cancelled', { tags: ['cancelado'] })]);
    expect(plan.tasks.find(t => t.id === 'a')!.after).toMatchObject({ status: 'completed', tags: ['back-end', 'cancelado'] });
    expect(plan.tasks.find(t => t.id === 'b')!.after.tags).toEqual(['cancelado']);
    expect(plan.cancelledTagged).toBe(1);
  });

  it('a completed task always has a closing date and an open one never has', () => {
    const kept = new Date('2026-09-02T00:00:00Z');
    const plan = StatusConsolidationPlanner.plan([legacySpace], [task('r', 'ready for deploy'), task('d', 'deployed', { date_closed: kept }), task('n', 'complete'), task('s', 'in progress', { date_closed: kept })]);
    expect(plan.tasks.find(t => t.id === 'r')!.after.dateClosed).toEqual(updated);
    expect(plan.tasks.find(t => t.id === 'd')!.after.dateClosed).toEqual(kept);
    expect(plan.tasks.find(t => t.id === 'n')!.after.dateClosed).toEqual(updated);
    expect(plan.tasks.find(t => t.id === 's')!.after.dateClosed).toBeNull();
    expect(plan.dateClosedChanged).toBe(3);
  });

  it('reports statuses with no target and never plans a change for them', () => {
    const plan = StatusConsolidationPlanner.plan([legacySpace], [task('x', 'shipping'), task('y', 'deployed', { date_closed: updated })]);
    expect(plan.unmapped).toEqual([{ taskId: 'x', status: 'shipping' }]);
    expect(plan.tasks.map(t => t.id)).toEqual(['y']);
  });

  it('keeps a status an admin added after the seven, with its tasks', () => {
    const space = { ...legacySpace, statuses: [...DEFAULT_STATUSES.map(s => ({ ...s })), { name: 'Homologação', color: '#222', type: StatusType.REVIEW, order: 7 }] };
    const plan = StatusConsolidationPlanner.plan([space], [task('h', 'Homologação')]);
    expect(plan.spaces).toEqual([]);
    expect(plan.tasks).toEqual([]);
    expect(plan.unmapped).toEqual([]);
    expect(plan.countsAfter).toEqual({ 'Homologação': 1 });
  });

  it('is idempotent: a second plan over the migrated data changes nothing', () => {
    const tasks = [...legacy, ...fiveStatuses].map((s, i) => task(`t${i}`, s));
    const first = StatusConsolidationPlanner.plan([legacySpace], tasks);
    const migratedTasks = tasks.map(t => {
      const change = first.tasks.find(c => c.id === t._id);
      return change ? { ...t, status: change.after.status, tags: change.after.tags, date_closed: change.after.dateClosed } : t;
    });
    const migratedSpace = { ...legacySpace, statuses: first.spaces[0].after };
    const second = StatusConsolidationPlanner.plan([migratedSpace], migratedTasks);
    expect(second.spaces).toEqual([]);
    expect(second.tasks).toEqual([]);
    expect(second.countsAfter).toEqual(first.countsAfter);
  });
});
