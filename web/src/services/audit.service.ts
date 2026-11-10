import { api, toQuery } from '@/lib/api-client';
import { AuditLogFilters, AuditLogItem } from './audit.types';
import { KeysetPage } from './keyset-page.types';

export const auditService = {
  list: (filters: AuditLogFilters, cursor: string | null) => api<KeysetPage<AuditLogItem>>(`/audit-logs${toQuery({ ...filters, cursor })}`),
};
