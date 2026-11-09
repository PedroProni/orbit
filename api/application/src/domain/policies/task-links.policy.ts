import { EMPTY_TASK_LINKS, TASK_LINK_KEYS, TASK_LINK_MAX_LENGTH, TASK_LINK_URL_PATTERN } from '@domain/constants/task-links.constant';
import { TaskLinks } from '@domain/types/task-links.type';

export class TaskLinksPolicy {
  static normalize(raw: Partial<Record<keyof TaskLinks, unknown>> | null | undefined): TaskLinks {
    const links: TaskLinks = { ...EMPTY_TASK_LINKS };
    for (const key of TASK_LINK_KEYS) {
      const value = raw?.[key];
      links[key] = typeof value === 'string' && value.trim() ? value.trim() : null;
    }
    return links;
  }

  static isValidUrl(value: string): boolean {
    return value.length <= TASK_LINK_MAX_LENGTH && TASK_LINK_URL_PATTERN.test(value);
  }

  static merge(current: TaskLinks, patch: Partial<TaskLinks>): TaskLinks {
    const next: TaskLinks = { ...current };
    for (const key of TASK_LINK_KEYS) {
      if (!(key in patch) || patch[key] === undefined) continue;
      const value = patch[key];
      const trimmed = typeof value === 'string' ? value.trim() : null;
      if (trimmed && !TaskLinksPolicy.isValidUrl(trimmed)) throw new Error(`Invalid link for ${key}`);
      next[key] = trimmed || null;
    }
    return next;
  }
}
