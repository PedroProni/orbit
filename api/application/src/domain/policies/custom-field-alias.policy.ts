import { CUSTOM_FIELD_LINK_ALIASES, REMOVED_CUSTOM_FIELD_NAMES } from '@domain/constants/custom-field-aliases.constant';
import { TaskLinkKey } from '@domain/types/task-link-key.type';

const normalize = (name: string): string => name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();

export class CustomFieldAliasPolicy {
  static linkOf(name: string): TaskLinkKey | null {
    return CUSTOM_FIELD_LINK_ALIASES[normalize(name)] ?? null;
  }

  static isRemoved(name: string): boolean {
    return REMOVED_CUSTOM_FIELD_NAMES.includes(normalize(name));
  }
}
