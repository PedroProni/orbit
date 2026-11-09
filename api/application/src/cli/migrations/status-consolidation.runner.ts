import { ClientSession, Connection } from 'mongoose';
import { newId } from '@common/helpers/functions/id.helper';
import { StatusConsolidationPlanner } from './status-consolidation.planner';
import { ConsolidationSpaceDoc, ConsolidationTaskDoc, StatusConsolidationPlan } from './status-consolidation.type';
import { MIGRATION_NAME, SPACE_AUDIT_ACTION, SYSTEM_ACTOR_TYPE, TASK_AUDIT_ACTION } from './status-consolidation.constant';

export const loadConsolidationInput = async (connection: Connection, session?: ClientSession): Promise<{ spaces: ConsolidationSpaceDoc[]; tasks: ConsolidationTaskDoc[] }> => {
  const spaces = (await connection
    .collection('spaces')
    .find({}, { session, projection: { _id: 1, workspace_id: 1, statuses: 1 } })
    .toArray()) as unknown as ConsolidationSpaceDoc[];
  const tasks = (await connection
    .collection('tasks')
    .find({}, { session, projection: { _id: 1, workspace_id: 1, space_id: 1, status: 1, tags: 1, date_closed: 1, updated_at: 1 } })
    .toArray()) as unknown as ConsolidationTaskDoc[];
  return { spaces, tasks: tasks.map(t => ({ ...t, tags: t.tags ?? [], date_closed: t.date_closed ?? null })) };
};

export const summarizeConsolidation = (plan: StatusConsolidationPlan) => ({
  spacesToRewrite: plan.spaces.map(s => ({ id: s.id, before: s.before, after: s.after.map(st => `${st.name} (${st.type})`) })),
  tasksToChange: plan.tasks.length,
  cancelledTagged: plan.cancelledTagged,
  dateClosedChanged: plan.dateClosedChanged,
  unmapped: plan.unmapped,
  transitions: plan.transitions,
  countsBefore: plan.countsBefore,
  countsAfter: plan.countsAfter,
});

export const applyStatusConsolidation = async (connection: Connection, actorId: string): Promise<StatusConsolidationPlan> => {
  const session = await connection.startSession();
  try {
    let applied!: StatusConsolidationPlan;
    await session.withTransaction(async () => {
      const { spaces, tasks } = await loadConsolidationInput(connection, session);
      const plan = StatusConsolidationPlanner.plan(spaces, tasks);
      if (plan.unmapped.length > 0) throw new Error(`Aborted: ${plan.unmapped.length} tasks have a status without a target`);
      const now = new Date();
      if (plan.spaces.length > 0) {
        const res = await connection.collection('spaces').bulkWrite(
          plan.spaces.map(s => ({ updateOne: { filter: { _id: s.id } as never, update: { $set: { statuses: s.after, updated_at: now } } } })),
          { session },
        );
        if (res.matchedCount !== plan.spaces.length) throw new Error(`Aborted: spaces matched ${res.matchedCount} of ${plan.spaces.length}`);
      }
      if (plan.tasks.length > 0) {
        const res = await connection.collection('tasks').bulkWrite(
          plan.tasks.map(t => ({
            updateOne: { filter: { _id: t.id, status: t.before.status } as never, update: { $set: { status: t.after.status, tags: t.after.tags, date_closed: t.after.dateClosed } } },
          })),
          { session },
        );
        if (res.matchedCount !== plan.tasks.length) throw new Error(`Aborted: tasks matched ${res.matchedCount} of ${plan.tasks.length}`);
      }
      const audit = [
        ...plan.spaces.map(s => ({
          _id: newId(),
          workspace_id: s.workspaceId,
          actor_type: SYSTEM_ACTOR_TYPE,
          actor_id: actorId,
          action: SPACE_AUDIT_ACTION,
          entity_type: 'space',
          entity_id: s.id,
          meta: { fields: ['statuses'], migration: MIGRATION_NAME, before: s.before, after: s.after.map(st => st.name) },
          created_at: now,
          updated_at: now,
        })),
        ...plan.tasks.map(t => {
          const changed = (['status', 'tags', 'dateClosed'] as const).filter(k => JSON.stringify(t.before[k]) !== JSON.stringify(t.after[k]));
          const diff = Object.fromEntries(changed.map(k => [k, { before: t.before[k], after: t.after[k] }]));
          return {
            _id: newId(),
            workspace_id: t.workspaceId,
            actor_type: SYSTEM_ACTOR_TYPE,
            actor_id: actorId,
            action: TASK_AUDIT_ACTION,
            entity_type: 'task',
            entity_id: t.id,
            meta: { changed, diff, migration: MIGRATION_NAME },
            created_at: now,
            updated_at: now,
          };
        }),
      ];
      if (audit.length > 0) await connection.collection('audit_logs').insertMany(audit as never[], { session });
      applied = plan;
    });
    return applied;
  } finally {
    await session.endSession();
  }
};
