export type FormFieldTarget = 'title' | 'description';

export interface FormField {
  id: string;
  label: string;
  required: boolean;
  target: FormFieldTarget;
}

export interface AdminForm {
  id: string;
  listId: string;
  name: string;
  publicKey: string;
  fields: FormField[];
  active: boolean;
  paused: boolean;
  ownerId: string;
  updatedAt: string;
}

export interface FormFieldInput {
  id?: string;
  label: string;
  required: boolean;
  target: FormFieldTarget;
}

export interface FormInput {
  listId: string;
  name: string;
  fields: FormFieldInput[];
  active: boolean;
}

export interface FormUpdate {
  id: string;
  input: FormInput;
}

export interface PublicFormField {
  id: string;
  label: string;
  required: boolean;
}

export interface PublicFormDefinition {
  name: string;
  fields: PublicFormField[];
}

export interface PublicFormSubmission {
  answers: Record<string, string>;
  website: string;
}

export interface PublicFormReceipt {
  received: boolean;
}
