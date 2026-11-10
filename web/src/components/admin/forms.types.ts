import { AdminForm, FormFieldTarget, FormInput } from '@/services/form.types';
import { SpaceNode } from '@/types/api.types';

export interface FormFieldDraft {
  key: string;
  id?: string;
  label: string;
  required: boolean;
  target: FormFieldTarget;
}

export interface FormDraft {
  name: string;
  listId: string;
  active: boolean;
  fields: FormFieldDraft[];
}

export type FormProblem = 'name' | 'list' | 'fields' | 'label' | 'title';

export type FormStatus = 'paused' | 'open' | 'off';

export interface FormRowProps {
  form: AdminForm;
  spaces: SpaceNode[];
  onEdit: (form: AdminForm) => void;
  onRotate: (form: AdminForm) => void;
  onDelete: (form: AdminForm) => void;
}

export interface FormDialogProps {
  open: boolean;
  form: AdminForm | null;
  spaces: SpaceNode[];
  onSubmit: (input: FormInput) => Promise<unknown>;
  onClose: () => void;
}

export interface FormFieldEditorProps {
  field: FormFieldDraft;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<FormFieldDraft>) => void;
  onRemove: () => void;
}
