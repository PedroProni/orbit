import { CustomFieldInput } from '@/services/admin.types';
import { CustomFieldProblem } from './admin.types';

export function customFieldProblem(input: CustomFieldInput): CustomFieldProblem {
  if (!input.name.trim()) return 'nameRequired';
  if (input.type === 'dropdown' && input.options.length === 0) return 'optionsRequired';
  return null;
}
