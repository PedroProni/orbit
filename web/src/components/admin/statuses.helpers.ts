import { StatusInput } from '@/services/admin.types';
import { StatusDefinition } from '@/types/api.types';
import { DEFAULT_STATUS_COUNT, STATUS_COLOR_CHOICES } from './admin.constants';
import { StatusDraftProblem } from './admin.types';

export const toStatusInputs = (statuses: StatusDefinition[]): StatusInput[] => [...statuses].sort((a, b) => a.order - b.order).map(({ name, color, type }) => ({ name, color, type }));

export const moveStatus = (statuses: StatusInput[], index: number, step: number): StatusInput[] => {
  const target = index + step;
  if (index < DEFAULT_STATUS_COUNT || target < DEFAULT_STATUS_COUNT || target >= statuses.length) return statuses;
  const next = [...statuses];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const newExtraStatus = (name: string, statuses: StatusInput[]): StatusInput => ({
  name,
  color: STATUS_COLOR_CHOICES[statuses.length % STATUS_COLOR_CHOICES.length],
  type: 'active',
});

export const statusDraftProblem = (statuses: StatusInput[]): StatusDraftProblem => {
  const names = statuses.map((status) => status.name.trim().toLowerCase());
  if (names.some((name) => !name)) return 'nameMissing';
  if (new Set(names).size !== names.length) return 'nameRepeated';
  return null;
};

export const sameStatuses = (a: StatusInput[], b: StatusInput[]): boolean => a.length === b.length && a.every((status, index) => status.name === b[index].name && status.color === b[index].color && status.type === b[index].type);

export const statusesEditorKey = (space: { id: string; statuses: StatusDefinition[] }): string => `${space.id}:${JSON.stringify(space.statuses)}`;

export const rulesEditorKey = (space: { id: string; requiredTags: string[]; titlePrefixes: string[] }): string => `${space.id}:${JSON.stringify([space.requiredTags, space.titlePrefixes])}`;
