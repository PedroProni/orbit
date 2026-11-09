import { Checklist } from '@domain/types/checklist.type';
import { newId } from '@common/helpers/functions/id.helper';

export class ChecklistNormalizer {
  static normalize(checklists: Partial<Checklist>[]): Checklist[] {
    return checklists.map((checklist) => ({
      id: checklist.id || newId(),
      name: (checklist.name ?? '').trim(),
      items: (checklist.items ?? []).map((item) => ({ id: item.id || newId(), name: (item.name ?? '').trim(), resolved: !!item.resolved, assigneeId: item.assigneeId ?? null })),
    }));
  }
}
