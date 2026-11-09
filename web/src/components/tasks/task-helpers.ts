import { dayFromIso, formatDay } from '@/lib/calendar-day';
import { CustomFieldDefinition, SpaceNode, StatusDefinition, Task, TaskCustomFieldValue } from '@/types/api.types';
import { CustomFieldChange } from './task-activity.types';
import { STATUS_COLOR_TOKENS } from './tasks.constants';
import { TaskPatch } from '@/services/orbit.types';

export const findSpaceByList = (hierarchy: SpaceNode[] | undefined, listId: string): SpaceNode | undefined => hierarchy?.find((space) => space.lists.some((l) => l.id === listId));

export const groupByStatus = (tasks: Task[], statuses: string[]): Record<string, Task[]> => {
  const groups: Record<string, Task[]> = Object.fromEntries(statuses.map((s) => [s, []]));
  for (const task of tasks) (groups[task.status] ??= []).push(task);
  return groups;
};

export const statusColor = (status: StatusDefinition): string => STATUS_COLOR_TOKENS[status.name.toLowerCase()] ?? status.color;

export const formatInstantDay = (iso: string | null, locale: string): string => (iso ? new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }) : '');

export const formatActivityValue = (value: unknown, resolve?: (id: string) => string, locale?: string): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.map((v) => (resolve ? resolve(String(v)) : String(v))).join(', ') : '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return locale ? formatDay(dayFromIso(value), locale) : dayFromIso(value);
  return String(value);
};

const customFieldValueList = (value: unknown): TaskCustomFieldValue[] => (Array.isArray(value) ? value.filter((item): item is TaskCustomFieldValue => typeof item === 'object' && item !== null && typeof (item as TaskCustomFieldValue).fieldId === 'string') : []);

const formatCustomFieldValue = (value: string | number | null | undefined, definition: CustomFieldDefinition | undefined, locale: string): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (definition?.type === 'dropdown') return definition.options.find((option) => option.id === value)?.label ?? String(value);
  if (definition?.type === 'date' && typeof value === 'string') return formatDay(dayFromIso(value), locale);
  return String(value);
};

export const customFieldChanges = (before: unknown, after: unknown, definitions: CustomFieldDefinition[] | undefined, locale: string): CustomFieldChange[] => {
  const previous = new Map(customFieldValueList(before).map((item) => [item.fieldId, item.value]));
  const next = new Map(customFieldValueList(after).map((item) => [item.fieldId, item.value]));
  const changes: CustomFieldChange[] = [];
  for (const fieldId of new Set([...previous.keys(), ...next.keys()])) {
    const oldValue = previous.get(fieldId) ?? null;
    const newValue = next.get(fieldId) ?? null;
    if (oldValue === newValue) continue;
    const definition = definitions?.find((item) => item.id === fieldId);
    changes.push({ fieldId, name: definition?.name ?? null, before: formatCustomFieldValue(oldValue, definition, locale), after: formatCustomFieldValue(newValue, definition, locale) });
  }
  return changes;
};

const applyIdChanges = (current: string[], added: string[] = [], removed: string[] = []): string[] => [...new Set([...current.filter((value) => !removed.includes(value)), ...added])];

export const applyTaskPatch = (task: Task, patch: TaskPatch): Task => ({
  ...task,
  ...(patch.title !== undefined ? { title: patch.title } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.priority !== undefined ? { priority: patch.priority as Task['priority'] } : {}),
  ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
  ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
  ...(patch.points !== undefined ? { points: patch.points } : {}),
  ...(patch.watcherIds !== undefined ? { watcherIds: patch.watcherIds } : {}),
  ...(patch.customFields !== undefined ? { customFields: patch.customFields } : {}),
  ...(patch.checklists !== undefined ? { checklists: patch.checklists } : {}),
  ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
  ...(patch.addTags || patch.removeTags ? { tags: applyIdChanges(task.tags, patch.addTags, patch.removeTags) } : {}),
  ...(patch.addAssigneeIds || patch.removeAssigneeIds ? { assigneeIds: applyIdChanges(task.assigneeIds, patch.addAssigneeIds, patch.removeAssigneeIds) } : {}),
});
