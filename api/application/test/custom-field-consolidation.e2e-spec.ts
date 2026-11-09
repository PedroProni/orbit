import mongoose, { Connection } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { CustomFieldType } from '../src/domain/enums/custom-field.enums';
import { CustomFieldConsolidationPlanner } from '../src/cli/migrations/custom-field-consolidation.planner';
import { applyFieldConsolidation, fieldConsolidationFingerprint, loadFieldConsolidationInput } from '../src/cli/migrations/custom-field-consolidation.runner';
import { FieldAuditDoc, FieldTaskDoc } from '../src/cli/migrations/custom-field-consolidation.type';

describe('custom field consolidation migration (replica set, transactions)', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;
  const created = new Date('2026-01-01T00:00:00Z');
  const field = (id: string, name: string, type = CustomFieldType.URL) => ({
    _id: id,
    workspace_id: 'w1',
    space_id: 'sp1',
    name,
    type,
    options: [],
    list_ids: null,
    created_at: created,
    updated_at: created,
  });

  const seed = async (conflict = false) => {
    await connection.dropDatabase();
    await connection
      .collection('custom_field_definitions')
      .insertMany([
        field('it1', 'Item Type', CustomFieldType.DROPDOWN),
        field('it2', 'Item Type', CustomFieldType.DROPDOWN),
        field('fig', 'Figma'),
        field('ag', 'Agile Ceremony', CustomFieldType.DROPDOWN),
        field('ml', 'Meeting Location', CustomFieldType.DROPDOWN),
        field('dr', 'Date of Retrospective', CustomFieldType.DATE),
        field('rc', 'Retrospective Category', CustomFieldType.DROPDOWN),
        field('NO', 'NOTION'),
        field('no', 'Notion'),
        field('pf', 'Protótipo Figma'),
        field('keep', 'Owner URL'),
      ] as never[]);
    await connection.collection('tasks').insertMany([
      {
        _id: 't1',
        workspace_id: 'w1',
        space_id: 'sp1',
        custom_fields: [
          { fieldId: 'pf', value: 'https://figma.com/a' },
          { fieldId: 'it2', value: 'opt' },
        ],
      },
      {
        _id: 't2',
        workspace_id: 'w1',
        space_id: 'sp1',
        custom_fields: [{ fieldId: 'fig', value: conflict ? 'https://figma.com/other' : 'https://figma.com/b' }, ...(conflict ? [{ fieldId: 'pf', value: 'https://figma.com/c' }] : [])],
      },
      {
        _id: 't3',
        workspace_id: 'w1',
        space_id: 'sp1',
        custom_fields: [
          { fieldId: 'no', value: 'https://notion.so/x' },
          { fieldId: 'dr', value: 1700000000000 },
          { fieldId: 'keep', value: 'https://keep' },
        ],
      },
      { _id: 't4', workspace_id: 'w1', space_id: 'sp1', custom_fields: [] },
    ] as never[]);
  };

  const fingerprint = async () => {
    const input = await loadFieldConsolidationInput(connection);
    return fieldConsolidationFingerprint(CustomFieldConsolidationPlanner.plan(input.definitions, input.tasks));
  };

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    connection = await mongoose.createConnection(replSet.getUri('orbit_field_migration')).asPromise();
  });

  afterAll(async () => {
    await connection.close();
    await replSet.stop();
  });

  it('moves Figma, Protótipo Figma and Notion into task links, deletes the 10 fields, audits and is idempotent', async () => {
    await seed();
    const plan = await applyFieldConsolidation(connection, 'actor-test', await fingerprint());
    const names = (await connection.collection('custom_field_definitions').find().toArray()).map(d => `${d.name}:${String(d._id)}`);
    expect(names).toEqual(['Owner URL:keep']);
    const tasks = (await connection.collection('tasks').find().sort({ _id: 1 }).toArray()) as unknown as FieldTaskDoc[];
    expect(tasks.map(t => [t.custom_fields, t.links ?? null])).toEqual([
      [[], { figma: 'https://figma.com/a', notion: null, printsFolder: null }],
      [[], { figma: 'https://figma.com/b', notion: null, printsFolder: null }],
      [[{ fieldId: 'keep', value: 'https://keep' }], { figma: null, notion: 'https://notion.so/x', printsFolder: null }],
      [[], null],
    ]);
    expect(plan.backedUpValues.map(v => `${v.taskId}:${v.fieldName}:${v.reason}`)).toEqual([
      't1:Protótipo Figma:link',
      't1:Item Type:removed',
      't2:Figma:link',
      't3:Notion:link',
      't3:Date of Retrospective:removed',
    ]);
    const audits = (await connection.collection('audit_logs').find().toArray()) as unknown as FieldAuditDoc[];
    expect(audits.filter(a => a.action === 'custom_field.deleted')).toHaveLength(10);
    const t3 = audits.find(a => a.action === 'task.updated' && a.entity_id === 't3');
    expect(t3?.meta.diff?.links.after).toEqual({ figma: null, notion: 'https://notion.so/x', printsFolder: null });
    expect(t3?.meta.migration).toBe('custom-fields-to-task-links');
    const again = await applyFieldConsolidation(connection, 'actor-test', await fingerprint());
    expect(again.remove).toEqual([]);
    expect(again.tasks).toEqual([]);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(audits.length);
  });

  it('aborts without writing anything when a task has two different values', async () => {
    await seed(true);
    await expect(applyFieldConsolidation(connection, 'actor-test', await fingerprint())).rejects.toThrow('two different values for the same link');
    expect(await connection.collection('custom_field_definitions').countDocuments()).toBe(11);
    expect(await connection.collection('audit_logs').countDocuments()).toBe(0);
  });

  it('aborts without writing anything when the data changed after the backup', async () => {
    await seed();
    const stale = await fingerprint();
    await connection.collection('tasks').updateOne({ _id: 't4' } as never, { $set: { custom_fields: [{ fieldId: 'ag', value: 'late' }] } });
    await expect(applyFieldConsolidation(connection, 'actor-test', stale)).rejects.toThrow('data changed after the backup');
    expect(await connection.collection('custom_field_definitions').countDocuments()).toBe(11);
    expect((await connection.collection('tasks').findOne({ _id: 't1' } as never))?.custom_fields).toHaveLength(2);
  });
});
