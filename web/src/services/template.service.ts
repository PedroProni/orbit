import { api } from '@/lib/api-client';
import { TaskTemplate } from '@/types/workspace.types';
import { TemplateInput } from './template.types';

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const at = (id: string) => `/task-templates/${encodeURIComponent(id)}`;

export const templateService = {
  list: () => api<TaskTemplate[]>('/task-templates'),
  create: (input: TemplateInput) => api<TaskTemplate>('/task-templates', json('POST', input)),
  update: (id: string, input: TemplateInput) => api<TaskTemplate>(at(id), json('PATCH', input)),
  remove: (id: string) => api<void>(at(id), { method: 'DELETE' }),
};
