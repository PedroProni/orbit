import { CANCELLED_LEGACY_STATUSES, LEGACY_STATUS_ALIASES } from '@domain/constants/status-aliases.constant';

const normalize = (name: string): string => name.trim().toLowerCase();

export class StatusAliasPolicy {
  static canonical(name: string): string | null {
    return LEGACY_STATUS_ALIASES[normalize(name)] ?? null;
  }

  static isCancelled(name: string): boolean {
    return CANCELLED_LEGACY_STATUSES.includes(normalize(name));
  }

  static expand(names: string[]): string[] {
    const out = new Set<string>();
    for (const name of names) {
      out.add(name);
      const canonical = StatusAliasPolicy.canonical(name);
      if (canonical) out.add(canonical);
    }
    return [...out];
  }
}
