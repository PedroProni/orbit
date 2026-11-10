import { AdminForm, FormFieldTarget, FormInput } from '@/services/form.types';
import { SpaceNode } from '@/types/api.types';
import { PUBLIC_FORM_PATH } from './forms.constants';
import { FormDraft, FormFieldDraft, FormProblem, FormStatus } from './forms.types';

let fieldSequence = 0;

export const emptyFormField = (target: FormFieldTarget, required: boolean): FormFieldDraft => {
  fieldSequence += 1;
  return { key: `new-field-${fieldSequence}`, label: '', required, target };
};

export const emptyFormDraft = (spaces: SpaceNode[]): FormDraft => ({ name: '', listId: spaces.flatMap((space) => space.lists)[0]?.id ?? '', active: true, fields: [emptyFormField('title', true)] });

export const draftFromForm = (form: AdminForm): FormDraft => ({
  name: form.name,
  listId: form.listId,
  active: form.active,
  fields: form.fields.map((field) => ({ key: field.id, id: field.id, label: field.label, required: field.required, target: field.target })),
});

export const draftToInput = (draft: FormDraft): FormInput => ({
  name: draft.name.trim(),
  listId: draft.listId,
  active: draft.active,
  fields: draft.fields.map((field) => ({ ...(field.id ? { id: field.id } : {}), label: field.label.trim(), required: field.required, target: field.target })),
});

export const formProblem = (draft: FormDraft): FormProblem | null => {
  if (!draft.name.trim()) return 'name';
  if (!draft.listId) return 'list';
  if (draft.fields.length === 0) return 'fields';
  if (draft.fields.some((field) => !field.label.trim())) return 'label';
  if (!draft.fields.some((field) => field.target === 'title' && field.required)) return 'title';
  return null;
};

export const publicFormUrl = (origin: string, publicKey: string): string => `${origin}${PUBLIC_FORM_PATH}${encodeURIComponent(publicKey)}`;

export const formStatus = (form: AdminForm): FormStatus => {
  if (form.paused) return 'paused';
  return form.active ? 'open' : 'off';
};
