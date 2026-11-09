import { CUSTOM_FIELD_LINK_TYPE } from '@domain/constants/custom-field-aliases.constant';
import { CustomFieldAliasPolicy } from '@domain/policies/custom-field-alias.policy';
import { TaskLinkKey } from '@domain/types/task-link-key.type';
import { ClickupCustomFieldMapper } from './clickup-custom-field.mapper';
import { ClickupListField, CollectedField, FieldAliasMismatch } from './clickup-field-lists.type';

const nameOf = (field: CollectedField): string => String((field.raw as ClickupListField | null)?.name ?? '');

export class ClickupFieldAliasResolver {
  readonly definitions = new Map<string, CollectedField>();
  readonly removed = new Set<string>();
  readonly links = new Map<string, TaskLinkKey>();
  readonly mismatches: FieldAliasMismatch[] = [];

  static build(raws: Map<string, CollectedField>): ClickupFieldAliasResolver {
    const resolver = new ClickupFieldAliasResolver();
    for (const [id, field] of raws) {
      const name = nameOf(field);
      if (CustomFieldAliasPolicy.isRemoved(name)) {
        resolver.removed.add(id);
        continue;
      }
      const link = CustomFieldAliasPolicy.linkOf(name);
      if (!link) {
        resolver.definitions.set(id, field);
        continue;
      }
      if (ClickupCustomFieldMapper.type(field.raw) !== CUSTOM_FIELD_LINK_TYPE) {
        resolver.removed.add(id);
        resolver.mismatches.push({ fieldId: id, name, link });
        continue;
      }
      resolver.links.set(id, link);
    }
    return resolver;
  }
}
