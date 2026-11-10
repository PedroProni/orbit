import { api } from '@/lib/api-client';
import { ApiToken, ApiTokenCreated, ApiTokenInput } from './api-token.types';

export const apiTokenService = {
  list: () => api<ApiToken[]>('/api-tokens'),
  create: (input: ApiTokenInput) => api<ApiTokenCreated>('/api-tokens', { method: 'POST', body: JSON.stringify(input) }),
  revoke: (id: string) => api<void>(`/api-tokens/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
