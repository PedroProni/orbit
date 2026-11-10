import { AUDIT_ACTION_GROUP_UPPER_BOUND, AUDIT_ACTION_SEPARATOR } from '@domain/constants/audit-log-filter.constant';
import { AuditLogFilter } from '@domain/types/audit-log-filter.type';

export class AuditLogFilterPolicy {
  static toQuery(workspaceId: string, filter: AuditLogFilter): Record<string, unknown> {
    const query: Record<string, unknown> = { workspace_id: workspaceId };
    if (filter.actorId) query.actor_id = filter.actorId;
    if (filter.action) query.action = AuditLogFilterPolicy.actionClause(filter.action);
    if (filter.entityType) query.entity_type = filter.entityType;
    if (filter.entityId) query.entity_id = filter.entityId;
    if (filter.from || filter.to) query.created_at = { ...(filter.from ? { $gte: filter.from } : {}), ...(filter.to ? { $lte: filter.to } : {}) };
    return query;
  }

  static actionClause(action: string): string | Record<string, string> {
    if (action.includes(AUDIT_ACTION_SEPARATOR)) return action;
    return { $gte: `${action}${AUDIT_ACTION_SEPARATOR}`, $lt: `${action}${AUDIT_ACTION_GROUP_UPPER_BOUND}` };
  }

  static isRangeValid(filter: AuditLogFilter): boolean {
    return !filter.from || !filter.to || filter.from.getTime() <= filter.to.getTime();
  }
}
