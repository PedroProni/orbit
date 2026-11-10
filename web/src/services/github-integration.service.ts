import { api, toQuery } from '@/lib/api-client';
import { GithubIntegration, WebhookDelivery, WebhookDeliveryFilters } from './github-integration.types';
import { KeysetPage } from './keyset-page.types';

export const githubIntegrationService = {
  status: () => api<GithubIntegration>('/integrations/github'),
  deliveries: (filters: WebhookDeliveryFilters, cursor: string | null) => api<KeysetPage<WebhookDelivery>>(`/integrations/github/deliveries${toQuery({ ...filters, cursor })}`),
};
