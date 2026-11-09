import mongoose, { Connection } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { applyInlineFiles, loadInlineFilesPlan, summarizeInlineFilesPlan } from '../src/cli/migrations/inline-files.runner';
import { InlineFilesPlanner } from '../src/cli/migrations/inline-files.planner';

const URL_A = 'https://t9.p.clickup-attachments.com/t9/a/shot.png';
const URL_B = 'https://t9.p.clickup-attachments.com/t9/b/other.png';

describe('inline files migration (replica set, transactions)', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;
  const stamp = new Date('2026-10-01T10:00:00Z');

  const seed = async () => {
    await connection.dropDatabase();
    await connection.collection('tasks').insertMany([
      { _id: 't1', workspace_id: 'w1', description_md: `![tela](${URL_A})`, updated_at: stamp },
      { _id: 't2', workspace_id: 'w1', description_md: 'sem arquivo', updated_at: stamp },
    ] as never[]);
    await connection.collection('comments').insertMany([{ _id: 'c1', workspace_id: 'w1', task_id: 't1', body_md: `veja ${URL_A}`, updated_at: stamp }, { _id: 'c2', workspace_id: 'w1', task_id: 't2', body_md: `de outra ${URL_B}`, updated_at: stamp }] as never[]);
    await connection.collection('import_attachment_sources').insertMany([{ _id: 'a1', task_id: 't1', url: URL_A }, { _id: 'b1', task_id: 't1', url: URL_B }] as never[]);
    await connection.collection('attachments').insertMany([{ _id: 'a1', task_id: 't1', filename: 'shot.png', mime_type: 'image/png', confirmed: true }, { _id: 'b1', task_id: 't1', filename: 'other.png', mime_type: 'image/png', confirmed: true }] as never[]);
  };

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
  }, 120000);

  afterAll(async () => {
    await connection.close();
    await replSet.stop();
  });

  beforeEach(seed);

  it('the dry run counts without writing anything', async () => {
    const summary = summarizeInlineFilesPlan(await loadInlineFilesPlan(connection));
    expect(summary).toEqual({ tasksToChange: 1, commentsToChange: 1, links: 2, unmatched: [{ kind: 'comment', id: 'c2', reason: 'other-task' }] });
    expect((await connection.collection('tasks').findOne({ _id: 't1' as never }))?.description_md).toBe(`![tela](${URL_A})`);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(0);
  });

  it('rewrites tasks and comments, keeps their dates and leaves one audit record each', async () => {
    await applyInlineFiles(connection, 'actor-1');
    const task = await connection.collection('tasks').findOne({ _id: 't1' as never });
    expect(task?.description_md).toBe('![tela](/attachments/a1/content)');
    expect(task?.updated_at).toEqual(stamp);
    expect((await connection.collection('comments').findOne({ _id: 'c1' as never }))?.body_md).toBe('veja ![shot.png](/attachments/a1/content)');
    expect((await connection.collection('comments').findOne({ _id: 'c2' as never }))?.body_md).toBe(`de outra ${URL_B}`);
    const audit = await connection.collection('audit_logs').find({}).sort({ entity_type: 1 }).toArray();
    expect(audit.map((row) => [row.entity_type, row.entity_id, row.action, row.actor_id, row.actor_type])).toEqual([
      ['comment', 'c1', 'comment.updated', 'actor-1', 'system'],
      ['task', 't1', 'task.updated', 'actor-1', 'system'],
    ]);
    expect(audit[1].meta).toEqual({ migration: 'inline-files-to-attachments', taskId: 't1', links: [{ url: URL_A, attachmentId: 'a1' }] });
  });

  it('running it again changes nothing and adds no audit record', async () => {
    await applyInlineFiles(connection, 'actor-1');
    const second = await applyInlineFiles(connection, 'actor-1');
    expect(second.changes).toEqual([]);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(2);
  });

  it('rolls the tasks back when a comment changed under the run', async () => {
    const real = InlineFilesPlanner.plan.bind(InlineFilesPlanner);
    const spy = jest.spyOn(InlineFilesPlanner, 'plan').mockImplementation((...args) => {
      const plan = real(...args);
      const comment = plan.changes.find((change) => change.kind === 'comment');
      if (comment) comment.before = 'texto antigo';
      return plan;
    });
    await expect(applyInlineFiles(connection, 'actor-1')).rejects.toThrow('Aborted: comments matched 0 of 1');
    spy.mockRestore();
    expect((await connection.collection('tasks').findOne({ _id: 't1' as never }))?.description_md).toBe(`![tela](${URL_A})`);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(0);
  });
});
