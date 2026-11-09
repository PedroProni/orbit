import { CUSTOM_FIELD_LINK_TYPE } from '@domain/constants/custom-field-aliases.constant';
import { TASK_LINK_KEYS } from '@domain/constants/task-links.constant';
import { CustomFieldAliasPolicy } from '@domain/policies/custom-field-alias.policy';
import { TaskLinksPolicy } from '@domain/policies/task-links.policy';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { TaskLinkKey } from '@domain/types/task-link-key.type';
import { TaskLinks } from '@domain/types/task-links.type';
import { CustomFieldConsolidationPlan, FieldDefinitionDoc, FieldTaskDoc } from './custom-field-consolidation.type';

const filled = (value: string | number | null | undefined): value is string | number => value !== null && value !== undefined && value !== '';

const label = (name: string, id: string): string => `${name} (${id})`;

const byCreation = (a: FieldDefinitionDoc, b: FieldDefinitionDoc): number => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a._id.localeCompare(b._id);

export class CustomFieldConsolidationPlanner {
  static plan(definitions: FieldDefinitionDoc[], tasks: FieldTaskDoc[]): CustomFieldConsolidationPlan {
    const linksAfter = Object.fromEntries(TASK_LINK_KEYS.map(key => [key, 0])) as Record<TaskLinkKey, number>;
    const plan: CustomFieldConsolidationPlan = { remove: [], tasks: [], conflicts: [], typeMismatches: [], backedUpValues: [], valuesBefore: {}, linksAfter };
    const names = new Map(definitions.map(d => [d._id, d.name]));
    const linkFields = new Map<string, TaskLinkKey>();
    const removed = new Set<string>();
    for (const d of [...definitions].sort(byCreation)) {
      if (CustomFieldAliasPolicy.isRemoved(d.name)) {
        removed.add(d._id);
        plan.remove.push({ id: d._id, workspaceId: d.workspace_id, spaceId: d.space_id, name: d.name, reason: 'removed', into: null });
        continue;
      }
      const link = CustomFieldAliasPolicy.linkOf(d.name);
      if (!link) continue;
      if (d.type !== CUSTOM_FIELD_LINK_TYPE) plan.typeMismatches.push({ fieldId: d._id, name: d.name, type: d.type, link });
      linkFields.set(d._id, link);
      plan.remove.push({ id: d._id, workspaceId: d.workspace_id, spaceId: d.space_id, name: d.name, reason: 'link', into: link });
    }
    for (const task of tasks) {
      const raw = task.custom_fields ?? [];
      for (const v of raw) {
        if (!filled(v.value)) continue;
        const key = label(names.get(v.fieldId) ?? '?', v.fieldId);
        plan.valuesBefore[key] = (plan.valuesBefore[key] ?? 0) + 1;
      }
      const beforeLinks = TaskLinksPolicy.normalize(task.links);
      const links: TaskLinks = { ...beforeLinks };
      const kept: TaskCustomFieldValue[] = [];
      for (const v of raw) {
        const link = linkFields.get(v.fieldId);
        if (!removed.has(v.fieldId) && !link) {
          kept.push(v);
          continue;
        }
        if (!filled(v.value)) continue;
        plan.backedUpValues.push({ taskId: task._id, fieldId: v.fieldId, fieldName: names.get(v.fieldId) ?? '?', value: v.value, reason: link ? 'link' : 'removed' });
        if (!link) continue;
        const value = String(v.value).trim();
        if (links[link] === null) links[link] = value;
        else if (links[link] !== value) plan.conflicts.push({ taskId: task._id, link, kept: links[link], dropped: value, fromField: label(names.get(v.fieldId) ?? '?', v.fieldId) });
      }
      for (const key of TASK_LINK_KEYS) if (links[key] !== null) plan.linksAfter[key]++;
      if (kept.length === raw.length && JSON.stringify(links) === JSON.stringify(beforeLinks)) continue;
      plan.tasks.push({ id: task._id, workspaceId: task.workspace_id, before: { customFields: raw, links: beforeLinks }, after: { customFields: kept, links } });
    }
    return plan;
  }
}
