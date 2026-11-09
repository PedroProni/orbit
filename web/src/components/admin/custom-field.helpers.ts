import { CustomFieldInput } from '@/services/admin.types';
import { CustomFieldProblem } from './admin.types';

export function nextFieldListIds(current: string[] | null, listId: string, allIds: string[]): string[] | null {
  if (current === null) return [listId];
  const next = current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId];
  return next.length === 0 || allIds.every((id) => next.includes(id)) ? null : next;
}

export function customFieldProblem(input: CustomFieldInput): CustomFieldProblem {
  if (!input.name.trim()) return 'nameRequired';
  if (input.type === 'dropdown' && input.options.length === 0) return 'optionsRequired';
  return null;
}
