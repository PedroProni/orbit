import { ClientSession, Connection } from 'mongoose';
import { newId } from '@common/helpers/functions/id.helper';
import { InlineFilesPlanner } from './inline-files.planner';
import { InlineFileOwner, InlineFilePlan } from './inline-files.type';
import { COMMENT_AUDIT_ACTION, FILE_HOST_FILTER, INLINE_FILES_MIGRATION_NAME } from './inline-files.constant';
import { ATTACHMENT_SOURCES_COLLECTION } from '../import/import.constant';
import { SYSTEM_ACTOR_TYPE, TASK_AUDIT_ACTION } from './status-consolidation.constant';

export const loadInlineFilesPlan = async (connection: Connection, session?: ClientSession): Promise<InlineFilePlan> => {
  const [tasks, comments, sources, attachments] = await Promise.all([
    connection
      .collection('tasks')
      .find({ description_md: FILE_HOST_FILTER }, { session, projection: { workspace_id: 1, description_md: 1 } })
      .toArray(),
    connection
      .collection('comments')
      .find({ body_md: FILE_HOST_FILTER }, { session, projection: { workspace_id: 1, task_id: 1, body_md: 1 } })
      .toArray(),
    connection
      .collection(ATTACHMENT_SOURCES_COLLECTION)
      .find({}, { session, projection: { url: 1 } })
      .toArray(),
    connection
      .collection('attachments')
      .find({}, { session, projection: { task_id: 1, filename: 1, mime_type: 1, confirmed: 1 } })
      .toArray(),
  ]);
  const owners: InlineFileOwner[] = [
    ...tasks.map(task => ({ kind: 'task' as const, id: String(task._id), workspaceId: String(task.workspace_id), taskId: String(task._id), text: String(task.description_md) })),
    ...comments.map(comment => ({ kind: 'comment' as const, id: String(comment._id), workspaceId: String(comment.workspace_id), taskId: String(comment.task_id), text: String(comment.body_md) })),
  ];
  return InlineFilesPlanner.plan(
    owners,
    sources.map(source => ({ id: String(source._id), url: String(source.url) })),
    attachments.map(attachment => ({
      id: String(attachment._id),
      taskId: String(attachment.task_id),
      filename: String(attachment.filename),
      mimeType: String(attachment.mime_type),
      confirmed: Boolean(attachment.confirmed),
    })),
  );
};

export const summarizeInlineFilesPlan = (plan: InlineFilePlan) => ({
  tasksToChange: plan.changes.filter(change => change.kind === 'task').length,
  commentsToChange: plan.changes.filter(change => change.kind === 'comment').length,
  links: plan.links,
  unmatched: plan.unmatched.map(({ kind, id, reason }) => ({ kind, id, reason })),
});

export const applyInlineFiles = async (connection: Connection, actorId: string): Promise<InlineFilePlan> => {
  const session = await connection.startSession();
  try {
    let applied!: InlineFilePlan;
    await session.withTransaction(async () => {
      const plan = await loadInlineFilesPlan(connection, session);
      const now = new Date();
      for (const [kind, collection, field] of [
        ['task', 'tasks', 'description_md'],
        ['comment', 'comments', 'body_md'],
      ] as const) {
        const changes = plan.changes.filter(change => change.kind === kind);
        if (changes.length === 0) continue;
        const res = await connection.collection(collection).bulkWrite(
          changes.map(change => ({ updateOne: { filter: { _id: change.id, [field]: change.before } as never, update: { $set: { [field]: change.after } } } })),
          { session },
        );
        if (res.matchedCount !== changes.length) throw new Error(`Aborted: ${collection} matched ${res.matchedCount} of ${changes.length}`);
      }
      if (plan.changes.length > 0) {
        await connection.collection('audit_logs').insertMany(
          plan.changes.map(change => ({
            _id: newId(),
            workspace_id: change.workspaceId,
            actor_type: SYSTEM_ACTOR_TYPE,
            actor_id: actorId,
            action: change.kind === 'task' ? TASK_AUDIT_ACTION : COMMENT_AUDIT_ACTION,
            entity_type: change.kind,
            entity_id: change.id,
            meta: { migration: INLINE_FILES_MIGRATION_NAME, taskId: change.taskId, links: change.links },
            created_at: now,
            updated_at: now,
          })) as never[],
          { session },
        );
      }
      applied = plan;
    });
    return applied;
  } finally {
    await session.endSession();
  }
};
