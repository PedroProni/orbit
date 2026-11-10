'use client';

import { useQuery } from '@tanstack/react-query';
import { apiTokenService } from '@/services/api-token.service';
import { ApiTokenInput } from '@/services/api-token.types';
import { useCapabilities } from './use-capabilities';
import { useInvalidating } from './use-workspace';
import { API_TOKENS_KEY } from './use-admin.constants';

export const useApiTokens = () => {
  const { canManageStructure } = useCapabilities();
  return useQuery({ queryKey: [API_TOKENS_KEY], queryFn: apiTokenService.list, enabled: canManageStructure });
};

export const useCreateApiToken = () => useInvalidating((input: ApiTokenInput) => apiTokenService.create(input), [API_TOKENS_KEY]);
export const useRevokeApiToken = () => useInvalidating((id: string) => apiTokenService.revoke(id), [API_TOKENS_KEY]);
