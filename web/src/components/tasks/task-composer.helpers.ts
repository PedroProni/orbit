import { CreateTaskInput } from '@/services/orbit.types';
import { isoFromDay } from '@/lib/calendar-day';
import { SpaceNode, Task, TaskFilters, TaskPriority, StatusDefinition } from '@/types/api.types';
import { COMPOSER_PRIORITY_KEYS, TEMP_TASK_PREFIX } from './task-composer.constants';
import { EMPTY_TASK_LINKS } from './tasks.constants';
import { ComposerDraft, ComposerPresets, ComposerRule, ComposerTarget } from './task-composer.types';

const swapPreset = (values: string[], before: string[], after: string[]): string[] => [...new Set([...values.filter((value) => !before.includes(value)), ...after])];

export const draftFromPresets = (title: string, presets: ComposerPresets, listId: string | null = null): ComposerDraft => ({ title, listId, assigneeIds: presets.assigneeIds, priority: presets.priority, tags: presets.tags, startDate: '', dueDate: '', points: null, taskKind: null, customFields: [] });

export function moveDraft(draft: ComposerDraft, before: ComposerPresets, after: ComposerPresets): ComposerDraft {
  return {
    ...draft,
    assigneeIds: swapPreset(draft.assigneeIds, before.assigneeIds, after.assigneeIds),
    tags: swapPreset(draft.tags, before.tags, after.tags),
    priority: draft.priority === before.priority ? after.priority : draft.priority,
  };
}

export const toggleIn = (values: string[], value: string): string[] => (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

export const priorityFromKey = (event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): TaskPriority | null | undefined => ((event.ctrlKey || event.metaKey || event.altKey) && event.key in COMPOSER_PRIORITY_KEYS ? COMPOSER_PRIORITY_KEYS[event.key] : undefined);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const hasAllowedPrefix = (title: string, prefixes: string[]): boolean => prefixes.length === 0 || prefixes.some((prefix) => new RegExp(`^\\[${escapeRegex(prefix)}(?:[ .][^\\]]*)?\\]`, 'i').test(title.trim()));

export const hasRequiredTag = (tags: string[], required: string[]): boolean => required.length === 0 || required.some((tag) => tags.map((value) => value.trim().toLowerCase()).includes(tag.trim().toLowerCase()));

export function composerRule(draft: ComposerDraft, space: SpaceNode): ComposerRule | null {
  if (!hasAllowedPrefix(draft.title, space.titlePrefixes)) return { key: 'prefixError', values: { prefixes: space.titlePrefixes.map((p) => `[${p}]`).join(', ') } };
  if (!hasRequiredTag(draft.tags, space.requiredTags)) return { key: 'tagError', values: { tags: space.requiredTags.join(', ') } };
  if (draft.startDate && draft.dueDate && draft.startDate > draft.dueDate) return { key: 'datesError', values: {} };
  return null;
}

export function titlePrefixOf(title: string, prefixes: string[]): string {
  const found = prefixes.find((prefix) => hasAllowedPrefix(title, [prefix]));
  if (!found) return '';
  const match = /^\s*\[[^\]]*\]\s*/.exec(title);
  return match ? `${match[0].trim()} ` : '';
}

export const withTitlePrefix = (title: string, prefix: string): string => `[${prefix}] ${title.replace(/^\s*\[[^\]]*\]\s*/, '')}`;

export function inputFromDraft(draft: ComposerDraft, presets: ComposerPresets, keepStatus = true): CreateTaskInput {
  return {
    title: draft.title.trim(),
    ...(keepStatus && presets.status ? { status: presets.status } : {}),
    tags: draft.tags,
    assigneeIds: draft.assigneeIds,
    ...(draft.priority ? { priority: draft.priority } : {}),
    ...(draft.points !== null ? { points: draft.points } : {}),
    ...(draft.startDate ? { startDate: isoFromDay(draft.startDate) as string } : {}),
    ...(draft.dueDate ? { dueDate: isoFromDay(draft.dueDate) as string } : {}),
    ...(draft.taskKind ? { taskKind: draft.taskKind } : {}),
    ...(draft.customFields.length ? { customFields: draft.customFields } : {}),
  };
}

export function composerTarget(spaces: SpaceNode[], listId: string, fallback: SpaceNode): ComposerTarget {
  const space = spaces.find((item) => item.lists.some((list) => list.id === listId)) ?? fallback;
  return { listId, listName: space.lists.find((list) => list.id === listId)?.name ?? '', space };
}

export const isTempTask = (task: Pick<Task, 'id'>): boolean => task.id.startsWith(TEMP_TASK_PREFIX);

export function makeTempTask(id: string, listId: string, spaceId: string, status: string, input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  return {
    id: `${TEMP_TASK_PREFIX}${id}`,
    listId,
    spaceId,
    parentId: null,
    title: input.title,
    descriptionMd: '',
    status,
    priority: input.priority ?? null,
    tags: input.tags ?? [],
    assigneeIds: input.assigneeIds ?? [],
    watcherIds: [],
    points: input.points ?? null,
    startDate: input.startDate ?? null,
    dueDate: input.dueDate ?? null,
    checklists: [],
    customFields: input.customFields ?? [],
    links: { ...EMPTY_TASK_LINKS },
    creatorId: '',
    dateClosed: null,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function matchesFilters(task: Task, filters: TaskFilters, statuses: StatusDefinition[]): boolean {
  if (filters.statuses.length && !filters.statuses.includes(task.status)) return false;
  if (filters.assigneeIds.length || filters.unassigned) {
    const chosen = filters.assigneeIds.some((id) => task.assigneeIds.includes(id));
    if (!chosen && !(filters.unassigned && task.assigneeIds.length === 0)) return false;
  }
  if (filters.tags.length && !filters.tags.some((tag) => task.tags.includes(tag))) return false;
  if (filters.q.trim() && !task.title.toLowerCase().includes(filters.q.trim().toLowerCase())) return false;
  const closed = statuses.find((status) => status.name === task.status)?.type === 'closed';
  return filters.includeClosed || !closed;
}

export const seedTags = (space: Pick<SpaceNode, 'requiredTags'> | undefined): string[] => (space?.requiredTags.length === 1 ? [space.requiredTags[0].toLowerCase()] : []);
