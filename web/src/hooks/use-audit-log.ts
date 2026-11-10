'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';
import { AuditLogFilters } from '@/services/audit.types';
import { useCapabilities } from './use-capabilities';
import { AUDIT_LOGS_KEY } from './use-admin.constants';

export const useAuditLog = (filters: AuditLogFilters) => {
  const { canReadAudit } = useCapabilities();
  return useInfiniteQuery({
    queryKey: [AUDIT_LOGS_KEY, filters],
    queryFn: ({ pageParam }) => auditService.list(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: canReadAudit,
  });
};
