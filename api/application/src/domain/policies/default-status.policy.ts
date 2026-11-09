import { DEFAULT_STATUSES, DEFAULT_STATUSES_LOCKED_ERROR } from '@domain/constants/default-statuses.constant';
import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

const normalize = (name: string): string => name.trim().toLowerCase();

export class DefaultStatusPolicy {
  static isDefault(name: string): boolean {
    return DEFAULT_STATUSES.some((s) => s.name === normalize(name));
  }

  static lock(statuses: TaskStatusDefinition[]): TaskStatusDefinition[] {
    const head = statuses.slice(0, DEFAULT_STATUSES.length);
    const intact = head.length === DEFAULT_STATUSES.length && head.every((s, index) => normalize(s.name) === DEFAULT_STATUSES[index].name && s.type === DEFAULT_STATUSES[index].type);
    if (!intact || statuses.slice(DEFAULT_STATUSES.length).some((s) => DefaultStatusPolicy.isDefault(s.name))) throw new Error(DEFAULT_STATUSES_LOCKED_ERROR);
    return statuses.map((s, index) => (index < DEFAULT_STATUSES.length ? { ...DEFAULT_STATUSES[index] } : s));
  }
}
