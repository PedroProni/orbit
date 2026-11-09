import { CustomFieldListScopePolicy } from '@domain/policies/custom-field-list-scope.policy';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ImportedList } from './clickup-importer.type';
import { ImportLedger } from './import-ledger';
import { LocalStore } from './local-store';
import { ClickupFieldAliasResolver } from './clickup-field-alias.resolver';
import { ClickupListField, CollectedField, FieldListsSummary, StoredFieldDefinitionRow, StoredListRow, StoredTaskListRef } from './clickup-field-lists.type';

export class ClickupFieldListsImporter {
  constructor(
    private readonly client: ClickupReadonlyClient,
    private readonly ledger: ImportLedger,
  ) {}

  static spaceLists(lists: ImportedList[]): Map<string, string[]> {
    const bySpace = new Map<string, string[]>();
    for (const list of lists) bySpace.set(list.spaceId, [...(bySpace.get(list.spaceId) ?? []), list.id]);
    return bySpace;
  }

  static scopeOf(field: CollectedField, bySpace: Map<string, string[]>): string[] | null {
    return CustomFieldListScopePolicy.resolve(field.listIds, bySpace.get(field.spaceId) ?? []);
  }

  async collect(lists: ImportedList[]): Promise<Map<string, CollectedField>> {
    const fields = new Map<string, CollectedField>();
    for (const list of lists) {
      try {
        const res = await this.client.get<{ fields?: ClickupListField[] }>(`/list/${list.id}/field`);
        for (const raw of res.fields ?? []) {
          const id = String(raw.id);
          const current = fields.get(id) ?? { raw, spaceId: list.spaceId, listIds: new Set<string>() };
          current.listIds.add(list.id);
          fields.set(id, current);
        }
      } catch (error) {
        this.ledger.mismatch('custom_field', list.id, `fields of the list could not be read: ${(error as Error).message}`);
      }
    }
    return fields;
  }

  async run(store: LocalStore, log: (message: string) => void): Promise<FieldListsSummary> {
    const rows = (await store.find('task_lists', { clickup_id: { $ne: null } })) as StoredListRow[];
    const lists: ImportedList[] = rows.map(row => ({ id: String(row._id), spaceId: String(row.space_id), archived: false }));
    const bySpace = ClickupFieldListsImporter.spaceLists(lists);
    const failedBefore = this.ledger.mismatches.length;
    const collected = ClickupFieldAliasResolver.build(await this.collect(lists)).definitions;
    const definitions = (await store.find('custom_field_definitions')) as StoredFieldDefinitionRow[];
    const summary: FieldListsSummary = {
      definitions: definitions.length,
      spaceWideBefore: 0,
      scopedBefore: 0,
      spaceWideAfter: 0,
      scopedAfter: 0,
      updated: 0,
      listsRead: lists.length - (this.ledger.mismatches.length - failedBefore),
      listsFailed: this.ledger.mismatches.length - failedBefore,
    };
    for (const definition of definitions) {
      const before = definition.list_ids ?? null;
      if (before === null) summary.spaceWideBefore++;
      else summary.scopedBefore++;
      const field = collected.get(String(definition._id)) ?? (await this.fromTasks(store, definition));
      const after = field ? ClickupFieldListsImporter.scopeOf(field, bySpace) : before;
      if (after === null) summary.spaceWideAfter++;
      else summary.scopedAfter++;
      if (JSON.stringify(after) === JSON.stringify(before)) continue;
      await store.setFields('custom_field_definitions', String(definition._id), { list_ids: after, updated_at: new Date() });
      summary.updated++;
    }
    this.ledger.track('custom_field_lists', definitions.length, summary.updated);
    log(`field lists: ${JSON.stringify(summary)}`);
    return summary;
  }

  private async fromTasks(store: LocalStore, definition: StoredFieldDefinitionRow): Promise<CollectedField | null> {
    const tasks = (await store.find('tasks', { 'custom_fields.fieldId': String(definition._id) })) as StoredTaskListRef[];
    const listIds = new Set(tasks.flatMap(task => (task.list_id ? [String(task.list_id)] : [])));
    return listIds.size ? { raw: null, spaceId: String(definition.space_id), listIds } : null;
  }
}
