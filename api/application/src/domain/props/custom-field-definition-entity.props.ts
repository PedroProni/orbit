import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { CustomFieldOption } from '@domain/types/custom-field-option.type';

export interface CustomFieldDefinitionEntityProps {
  _id: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  type: CustomFieldType;
  options: CustomFieldOption[];
  createdAt: Date;
  updatedAt: Date;
}
