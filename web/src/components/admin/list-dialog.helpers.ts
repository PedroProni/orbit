import { ListInput } from '@/services/admin.types';
import { ListDialogProblem } from './admin.types';

export function listDialogProblem(input: ListInput, creating: boolean): ListDialogProblem {
  if (!input.name.trim()) return 'nameRequired';
  if (input.kind === 'sprint' && creating && (!input.startDate || !input.endDate)) return 'datesRequired';
  if (input.startDate && input.endDate && input.endDate < input.startDate) return 'datesOrder';
  return null;
}
