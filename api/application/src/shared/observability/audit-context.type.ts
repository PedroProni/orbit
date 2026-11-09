export interface AuditContext {
  userId?: string;
  adminId?: string;
  requestId?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  reason?: string | null;
  [key: string]: unknown;
}
