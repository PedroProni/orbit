import { FormField } from '@domain/types/form-field.type';

export interface FormEntityProps {
  _id: string;
  workspaceId: string;
  listId: string;
  name: string;
  publicKey: string;
  fields: FormField[];
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
