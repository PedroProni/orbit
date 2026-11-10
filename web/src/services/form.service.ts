import { api } from '@/lib/api-client';
import { AdminForm, FormInput, PublicFormDefinition, PublicFormReceipt, PublicFormSubmission } from './form.types';

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const at = (id: string) => `/forms/${encodeURIComponent(id)}`;
const publicAt = (key: string) => `/public/forms/${encodeURIComponent(key)}`;

export const formService = {
  list: () => api<AdminForm[]>('/forms'),
  create: (input: FormInput) => api<AdminForm>('/forms', json('POST', input)),
  update: (id: string, input: FormInput) => api<AdminForm>(at(id), json('PATCH', input)),
  rotateKey: (id: string) => api<AdminForm>(`${at(id)}/rotate-key`, { method: 'POST' }),
  remove: (id: string) => api<void>(at(id), { method: 'DELETE' }),
  publicDefinition: (key: string) => api<PublicFormDefinition>(publicAt(key)),
  submit: (key: string, submission: PublicFormSubmission) => api<PublicFormReceipt>(publicAt(key), json('POST', submission)),
};
