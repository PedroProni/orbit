import { api } from '@/lib/api-client';
import { Automation, AutomationInput, AutomationRun, AutomationSaved } from './automation.types';

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const automationService = {
  list: () => api<Automation[]>('/automations'),
  create: (input: AutomationInput) => api<AutomationSaved>('/automations', json('POST', input)),
  update: (id: string, input: Partial<AutomationInput>) => api<AutomationSaved>(`/automations/${encodeURIComponent(id)}`, json('PATCH', input)),
  remove: (id: string) => api<void>(`/automations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  runs: (id: string) => api<AutomationRun[]>(`/automations/${encodeURIComponent(id)}/runs`),
};
