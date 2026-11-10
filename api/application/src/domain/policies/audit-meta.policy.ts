import { AUDIT_META_KEY_SEPARATORS, AUDIT_META_MAX_DEPTH, AUDIT_META_SENSITIVE_KEYS, AUDIT_TOKEN_ENTITY_TYPE, AUDIT_TOKEN_NAME_META_KEY } from '@domain/constants/audit-meta.constant';

export class AuditMetaPolicy {
  static sanitize(meta: unknown): Record<string, unknown> {
    const clean = AuditMetaPolicy.clean(meta, 0);
    return clean && typeof clean === 'object' && !Array.isArray(clean) ? (clean as Record<string, unknown>) : {};
  }

  static redactTokenName(meta: Record<string, unknown>, entityType: string, nameVisible: boolean): Record<string, unknown> {
    if (entityType !== AUDIT_TOKEN_ENTITY_TYPE || nameVisible) return meta;
    return Object.fromEntries(Object.entries(meta).filter(([key]) => key !== AUDIT_TOKEN_NAME_META_KEY));
  }

  static isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(AUDIT_META_KEY_SEPARATORS, '');
    return AUDIT_META_SENSITIVE_KEYS.some((word) => normalized === word || normalized.endsWith(word));
  }

  private static clean(value: unknown, depth: number): unknown {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return value;
    if (depth >= AUDIT_META_MAX_DEPTH) return undefined;
    if (Array.isArray(value)) return value.map((item) => AuditMetaPolicy.clean(item, depth + 1)).filter((item) => item !== undefined);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (AuditMetaPolicy.isSensitiveKey(key)) continue;
      const cleaned = AuditMetaPolicy.clean(item, depth + 1);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
}
