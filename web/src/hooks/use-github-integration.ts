'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { githubIntegrationService } from '@/services/github-integration.service';
import { WebhookDeliveryFilters } from '@/services/github-integration.types';
import { useCapabilities } from './use-capabilities';
import { GITHUB_DELIVERIES_KEY, GITHUB_INTEGRATION_KEY } from './use-admin.constants';

export const useGithubIntegration = () => {
  const { canReadAudit } = useCapabilities();
  return useQuery({ queryKey: [GITHUB_INTEGRATION_KEY], queryFn: githubIntegrationService.status, enabled: canReadAudit });
};

export const useGithubDeliveries = (filters: WebhookDeliveryFilters) => {
  const { canReadAudit } = useCapabilities();
  return useInfiniteQuery({
    queryKey: [GITHUB_DELIVERIES_KEY, filters],
    queryFn: ({ pageParam }) => githubIntegrationService.deliveries(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: canReadAudit,
  });
};
