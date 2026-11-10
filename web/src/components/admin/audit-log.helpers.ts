import { AuditLogFilters, AuditLogItem } from '@/services/audit.types';
import { AUDIT_COMMENT_ENTITY, AUDIT_DAY_END, AUDIT_DAY_START, AUDIT_FORM_ACTOR_PREFIX, AUDIT_META_AFTER_KEY, AUDIT_META_BEFORE_KEY, AUDIT_META_CHANGED_KEY, AUDIT_META_DETAIL_KEYS, AUDIT_META_DIFF_KEY, AUDIT_META_SCOPES_KEY, AUDIT_META_TASK_KEY, AUDIT_NAME_HIDDEN_ENTITY_TYPES, AUDIT_SYSTEM_ACTOR_KEYS, AUDIT_TASK_ENTITY } from './audit-log.constants';
import { AuditActorLabel, AuditLogDraft, AuditMetaSummary } from './audit-log.types';

const dayBound = (day: string, suffix: string): string | undefined => {
  if (!day) return undefined;
  const date = new Date(`${day}${suffix}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export function isAuditRangeInvalid(draft: AuditLogDraft): boolean {
  const from = dayBound(draft.fromDay, AUDIT_DAY_START);
  const to = dayBound(draft.toDay, AUDIT_DAY_END);
  return Boolean(from && to && from > to);
}

export function toAuditFilters(draft: AuditLogDraft): AuditLogFilters {
  return {
    actorId: draft.actorId || undefined,
    action: draft.group || undefined,
    entityType: draft.entityType || undefined,
    from: dayBound(draft.fromDay, AUDIT_DAY_START),
    to: dayBound(draft.toDay, AUDIT_DAY_END),
  };
}

export function auditActorLabel(item: AuditLogItem): AuditActorLabel {
  const { actor } = item;
  if (actor.type === 'user') return actor.deleted || !actor.name ? { key: 'actor.deletedPerson' } : { key: 'actor.person', text: actor.name };
  if (actor.type === 'token') return actor.name ? { key: 'actor.token', values: { name: actor.name } } : { key: 'actor.hiddenToken' };
  if (actor.id.startsWith(AUDIT_FORM_ACTOR_PREFIX)) return { key: 'actor.system.form' };
  const known = Object.hasOwn(AUDIT_SYSTEM_ACTOR_KEYS, actor.id) ? AUDIT_SYSTEM_ACTOR_KEYS[actor.id] : undefined;
  return known ? { key: `actor.system.${known}` } : { key: 'actor.system.other' };
}

export function auditActionKey(action: string): string {
  return `actions.${action}`;
}

export function auditActionGroup(action: string): string {
  return action.split('.')[0] ?? action;
}

const asText = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

export function auditMetaSummary(meta: Record<string, unknown>): AuditMetaSummary {
  const changed = meta[AUDIT_META_CHANGED_KEY];
  const diff = meta[AUDIT_META_DIFF_KEY];
  const fields = Array.isArray(changed) ? changed.filter((field): field is string => typeof field === 'string') : diff && typeof diff === 'object' && !Array.isArray(diff) ? Object.keys(diff) : [];
  const details: Array<[string, string]> = [];
  for (const key of AUDIT_META_DETAIL_KEYS) {
    const text = asText(meta[key]);
    if (text) details.push([key, text]);
  }
  const scopes = meta[AUDIT_META_SCOPES_KEY];
  if (Array.isArray(scopes) && scopes.length) details.push([AUDIT_META_SCOPES_KEY, scopes.filter((scope) => typeof scope === 'string').join(', ')]);
  const before = typeof meta[AUDIT_META_BEFORE_KEY] === 'string' ? (meta[AUDIT_META_BEFORE_KEY] as string) : null;
  const after = typeof meta[AUDIT_META_AFTER_KEY] === 'string' ? (meta[AUDIT_META_AFTER_KEY] as string) : null;
  return { fields, details, transition: before && after ? { before, after } : null };
}

export function isAuditEntityNameHidden(item: AuditLogItem): boolean {
  return AUDIT_NAME_HIDDEN_ENTITY_TYPES.includes(item.entity.type) && item.entity.label === null && !item.entity.deleted;
}

export function auditTaskTarget(item: AuditLogItem): string | null {
  if (item.entity.type === AUDIT_TASK_ENTITY) return item.entity.deleted ? null : item.entity.id;
  if (item.entity.type === AUDIT_COMMENT_ENTITY) return asText(item.meta[AUDIT_META_TASK_KEY]);
  return null;
}
