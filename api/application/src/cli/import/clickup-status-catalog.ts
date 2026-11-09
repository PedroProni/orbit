import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { CLOSEST_ACTIVE_STATUS, CLOSEST_OPEN_STATUS, CLOSEST_REVIEW_STATUS, CLOSEST_STATUS_BY_TYPE, REVIEW_STATUS_PATTERN } from './import.constant';

export class ClickupStatusCatalog {
  private readonly entries = new Map<string, { name: string; type: unknown }>();

  static build(existing: TaskStatusDefinition[]): TaskStatusDefinition[] {
    const createdInOrbit = existing.filter((s) => !StatusAliasPolicy.canonical(s.name));
    return [...DEFAULT_STATUSES, ...createdInOrbit].map((s, order) => ({ ...s, order }));
  }

  static closest(name: string, type: unknown): string {
    const byType = CLOSEST_STATUS_BY_TYPE[String(type)];
    if (byType) return byType;
    if (!name) return CLOSEST_OPEN_STATUS;
    return REVIEW_STATUS_PATTERN.test(name) ? CLOSEST_REVIEW_STATUS : CLOSEST_ACTIVE_STATUS;
  }

  add(raw: any): void {
    const name = String(raw?.status ?? '').trim();
    if (name && !this.entries.has(name.toLowerCase())) this.entries.set(name.toLowerCase(), { name, type: raw.type });
  }

  getEntries(): Array<{ name: string; type: unknown }> {
    return [...this.entries.values()];
  }
}
