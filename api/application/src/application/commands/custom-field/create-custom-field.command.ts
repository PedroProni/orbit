import { CustomFieldType } from '@domain/enums/custom-field.enums';

export interface CreateCustomFieldCommand {
  spaceId: string;
  name: string;
  type: CustomFieldType;
  options: string[];
  listIds: string[] | null;
}
