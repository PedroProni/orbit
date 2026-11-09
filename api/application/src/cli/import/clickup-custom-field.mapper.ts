import { CustomFieldOption } from '@domain/types/custom-field-option.type';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { FALLBACK_OPTION_COLOR, SUPPORTED_FIELD_TYPES } from './import.constant';

export class ClickupCustomFieldMapper {
  static type(raw: any): CustomFieldType | null {
    return SUPPORTED_FIELD_TYPES[String(raw?.type)] ?? null;
  }

  static options(raw: any): CustomFieldOption[] {
    return (raw?.type_config?.options ?? []).map((o: any) => ({ id: String(o.id), label: String(o.name ?? o.label ?? ''), color: o.color ? String(o.color) : FALLBACK_OPTION_COLOR }));
  }

  static value(raw: any): TaskCustomFieldValue | null {
    if (raw?.value === undefined || raw?.value === null || raw?.value === '') return null;
    const type = ClickupCustomFieldMapper.type(raw);
    if (!type) return null;
    const fieldId = String(raw.id);
    if (type === CustomFieldType.DROPDOWN) {
      const options: any[] = raw.type_config?.options ?? [];
      const chosen = options.find((o) => String(o.id) === String(raw.value)) ?? options.find((o) => Number(o.orderindex) === Number(raw.value));
      return chosen ? { fieldId, value: String(chosen.id) } : null;
    }
    if (type === CustomFieldType.DATE) {
      const when = new Date(Number(raw.value));
      return Number.isNaN(when.getTime()) ? null : { fieldId, value: when.toISOString() };
    }
    return /^https?:\/\/\S+$/i.test(String(raw.value)) ? { fieldId, value: String(raw.value) } : null;
  }
}
