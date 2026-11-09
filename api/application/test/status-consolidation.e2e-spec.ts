import mongoose, { Connection } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { StatusType } from '../src/domain/enums/space.enums';
import { applyStatusConsolidation, loadConsolidationInput } from '../src/cli/migrations/status-consolidation.runner';
import { StatusConsolidationPlanner } from '../src/cli/migrations/status-consolidation.planner';

const legacyNames: Array<[string, StatusType]> = [
  ['backlog', StatusType.OPEN],
  ['to-do', StatusType.OPEN],
  ['stuck', StatusType.ACTIVE],
  ['in development', StatusType.ACTIVE],
  ['waiting review', StatusType.ACTIVE],
  ['in review', StatusType.ACTIVE],
  ['testing', StatusType.ACTIVE],
  ['ready for deploy', StatusType.ACTIVE],
  ['deployed', StatusType.DONE],
  ['cancelled', StatusType.CLOSED],
  ['complete', StatusType.DONE],
  ['closed', StatusType.CLOSED],
  ['open', StatusType.OPEN],
  ['in progress', StatusType.ACTIVE],
];

describe('status consolidation migration (replica set, transactions)', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;
  const updated = new Date('2026-10-01T10:00:00Z');

  const seed = async (extraStatus?: string) => {
    await connection.dropDatabase();
    await connection.collection('spaces').insertOne({ _id: 'sp1', workspace_id: 'w1', name: 'S', statuses: legacyNames.map(([name, type], order) => ({ name, color: '#000', type, order })) } as never);
    const tasks = legacyNames.flatMap(([name], i) =>
      [0, 1].map(n => ({ _id: `t${i}-${n}`, workspace_id: 'w1', space_id: 'sp1', status: name, tags: name === 'cancelled' && n === 1 ? ['back-end'] : [], date_closed: null, updated_at: updated })),
    );
    if (extraStatus) tasks.push({ _id: 'odd', workspace_id: 'w1', space_id: 'sp1', status: extraStatus, tags: [], date_closed: null, updated_at: updated });
    await connection.collection('tasks').insertMany(tasks as never[]);
  };

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    connection = await mongoose.createConnection(replSet.getUri('orbit_migration')).asPromise();
  }, 120000);

  afterAll(async () => {
    await connection.close();
    await replSet.stop();
  });

  it('dry run plans every task without writing anything', async () => {
    await seed();
    const before = await connection.collection('tasks').find({}).toArray();
    const { spaces, tasks } = await loadConsolidationInput(connection);
    const plan = StatusConsolidationPlanner.plan(spaces, tasks);
    expect(plan.unmapped).toEqual([]);
    expect(plan.countsAfter).toEqual({ backlog: 2, 'to-do': 4, stuck: 2, 'in development': 4, 'waiting review': 2, 'in review': 4, completed: 10 });
    expect(await connection.collection('tasks').find({}).toArray()).toEqual(before);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(0);
  });

  it('applies in one transaction with one audit row per changed task and space, then a second run changes nothing', async () => {
    await seed();
    const plan = await applyStatusConsolidation(connection, 'actor-test');
    expect(plan.tasks).toHaveLength(16);
    const space = await connection.collection('spaces').findOne({ _id: 'sp1' as never });
    expect(space!.statuses.map((s: { name: string; type: string }) => `${s.name}:${s.type}`)).toEqual(['backlog:open', 'to-do:open', 'stuck:active', 'in development:active', 'waiting review:review', 'in review:review', 'completed:done']);
    const counts = await connection
      .collection('tasks')
      .aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])
      .toArray();
    expect(Object.fromEntries(counts.map(c => [c._id, c.n]))).toEqual({ backlog: 2, 'to-do': 4, stuck: 2, 'in development': 4, 'waiting review': 2, 'in review': 4, completed: 10 });
    const cancelled = await connection
      .collection('tasks')
      .find({ _id: { $in: ['t9-0', 't9-1'] } as never })
      .sort({ _id: 1 })
      .toArray();
    expect(cancelled.map(t => t.tags)).toEqual([['cancelado'], ['back-end', 'cancelado']]);
    const ready = await connection.collection('tasks').findOne({ _id: 't7-0' as never });
    expect(ready!.date_closed).toEqual(updated);
    expect((await connection.collection('tasks').findOne({ _id: 't0-0' as never }))!.updated_at).toEqual(updated);
    const audit = await connection.collection('audit_logs').find({}).toArray();
    expect(audit).toHaveLength(17);
    expect(audit.every(a => a.actor_type === 'system' && a.actor_id === 'actor-test' && a.meta.migration === 'status-consolidation-seven')).toBe(true);
    const cancelledAudit = audit.find(a => a.entity_id === 't9-1')!;
    expect(cancelledAudit.action).toBe('task.updated');
    expect(cancelledAudit.meta.diff.status).toEqual({ before: 'cancelled', after: 'completed' });
    expect(cancelledAudit.meta.diff.tags).toEqual({ before: ['back-end'], after: ['back-end', 'cancelado'] });
    const again = await applyStatusConsolidation(connection, 'actor-test');
    expect(again.tasks).toEqual([]);
    expect(again.spaces).toEqual([]);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(17);
  });

  it('aborts without writing anything when a task has a status with no target', async () => {
    await seed('shipping');
    await expect(applyStatusConsolidation(connection, 'actor-test')).rejects.toThrow('1 tasks have a status without a target');
    expect(await connection.collection('tasks').countDocuments({ status: 'completed' })).toBe(0);
    expect((await connection.collection('spaces').findOne({ _id: 'sp1' as never }))!.statuses).toHaveLength(legacyNames.length);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(0);
  });
});
