import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { TaskLinkKey } from '@domain/types/task-link-key.type';

export const CUSTOM_FIELD_LINK_ALIASES: Readonly<Record<string, TaskLinkKey>> = {
  figma: 'figma',
  'prototipo figma': 'figma',
  notion: 'notion',
};

export const REMOVED_CUSTOM_FIELD_NAMES: readonly string[] = ['item type', 'agile ceremony', 'meeting location', 'date of retrospective', 'retrospective category'];

export const CUSTOM_FIELD_LINK_TYPE = CustomFieldType.URL;
