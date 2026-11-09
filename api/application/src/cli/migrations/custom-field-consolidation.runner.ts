import { ClientSession, Connection } from 'mongoose';
import { newId } from '@common/helpers/functions/id.helper';
import { CustomFieldConsolidationPlanner } from './custom-field-consolidation.planner';
import { CustomFieldConsolidationPlan, FieldAuditDoc, FieldDefinitionDoc, FieldTaskDoc } from './custom-field-consolidation.type';
import { FIELD_DELETED_AUDIT_ACTION, FIELD_MIGRATION_NAME, FIELD_SYSTEM_ACTOR_TYPE, FIELD_TASK_AUDIT_ACTION } from './custom-field-consolidation.constant';

export const loadFieldConsolidationInput = async (connection: Connection, session?: ClientSession): Promise<{ definitions: FieldDefinitionDoc[]; tasks: FieldTaskDoc[] }> => {
  const definitions = (await connection.collection('custom_field_definitions').find({}, { session }).toArray()) as unknown as FieldDefinitionDoc[];
  const tasks = (await connection
    .collection('tasks')
    .find({ 'custom_fields.0': { $exists: true } }, { session, projection: { _id: 1, workspace_id: 1, space_id: 1, custom_fields: 1, links: 1 } })
    .toArray()) as unknown as FieldTaskDoc[];
  return { definitions, tasks };
};

export const summarizeFieldConsolidation = (plan: CustomFieldConsolidationPlan) => ({
  definitionsToDelete: plan.remove.map(r => ({ id: r.id, name: r.name, reason: r.reason, into: r.into })),
  tasksToChange: plan.tasks.length,
  valuesToLinks: plan.backedUpValues.filter(v => v.reason === 'link').length,
  valuesRemoved: plan.backedUpValues.filter(v => v.reason === 'removed').length,
  conflicts: plan.conflicts,
  typeMismatches: plan.typeMismatches,
  valuesBefore: plan.valuesBefore,
  tasksWithLinkAfter: plan.linksAfter,
});

export const fieldConsolidationFingerprint = (plan: CustomFieldConsolidationPlan): string => JSON.stringify({ remove: plan.remove, values: plan.backedUpValues });

export const applyFieldConsolidation = async (connection: Connection, actorId: string, expectedFingerprint: string): Promise<CustomFieldConsolidationPlan> => {
  const session = await connection.startSession();
  try {
    let applied!: CustomFieldConsolidationPlan;
    await session.withTransaction(async () => {
      const now = new Date();
      const { definitions, tasks } = await loadFieldConsolidationInput(connection, session);
      const plan = CustomFieldConsolidationPlanner.plan(definitions, tasks);
      if (plan.conflicts.length > 0) throw new Error(`Aborted: ${plan.conflicts.length} tasks have two different values for the same link`);
      if (plan.typeMismatches.length > 0) throw new Error(`Aborted: ${plan.typeMismatches.length} fields are not URL fields and cannot become links`);
      if (fieldConsolidationFingerprint(plan) !== expectedFingerprint) throw new Error('Aborted: data changed after the backup was written, run again');
      if (plan.tasks.length > 0) {
        const res = await connection.collection('tasks').bulkWrite(
          plan.tasks.map(t => ({
            updateOne: { filter: { _id: t.id, custom_fields: t.before.customFields } as never, update: { $set: { custom_fields: t.after.customFields, links: t.after.links } } },
          })),
          { session },
        );
        if (res.matchedCount !== plan.tasks.length) throw new Error(`Aborted: tasks matched ${res.matchedCount} of ${plan.tasks.length}`);
      }
      if (plan.remove.length > 0) {
        const res = await connection.collection('custom_field_definitions').deleteMany({ _id: { $in: plan.remove.map(r => r.id) } } as never, { session });
        if (res.deletedCount !== plan.remove.length) throw new Error(`Aborted: deleted ${res.deletedCount} of ${plan.remove.length} fields`);
      }
      const audit = (workspaceId: string, action: string, entityType: string, entityId: string, meta: Record<string, unknown>): FieldAuditDoc => ({
        _id: newId(),
        workspace_id: workspaceId,
        actor_type: FIELD_SYSTEM_ACTOR_TYPE,
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        meta: { ...meta, migration: FIELD_MIGRATION_NAME },
        created_at: now,
        updated_at: now,
      });
      const records = [
        ...plan.remove.map(r => audit(r.workspaceId, FIELD_DELETED_AUDIT_ACTION, 'custom_field', r.id, { name: r.name, reason: r.reason, into: r.into })),
        ...plan.tasks.map(t => {
          const changed = (['customFields', 'links'] as const).filter(k => JSON.stringify(t.before[k]) !== JSON.stringify(t.after[k]));
          return audit(t.workspaceId, FIELD_TASK_AUDIT_ACTION, 'task', t.id, { changed, diff: Object.fromEntries(changed.map(k => [k, { before: t.before[k], after: t.after[k] }])) });
        }),
      ];
      if (records.length > 0) await connection.collection('audit_logs').insertMany(records as never[], { session });
      applied = plan;
    });
    return applied;
  } finally {
    await session.endSession();
  }
};
