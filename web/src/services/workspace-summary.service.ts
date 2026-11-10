import { api } from '@/lib/api-client';
import { WorkspaceSummary } from './workspace-summary.types';

export const workspaceSummaryService = {
  get: () => api<WorkspaceSummary>('/workspace/summary'),
};
