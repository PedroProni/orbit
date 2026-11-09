import { TASK_ID_PATTERN } from '@domain/constants/github-webhook.constant';

export class TaskReferencePolicy {
  static extract(...sources: Array<string | undefined | null>): string[] {
    const found = new Set<string>();
    for (const source of sources) {
      for (const match of (source ?? '').matchAll(TASK_ID_PATTERN)) found.add(match[0].toLowerCase());
    }
    return [...found];
  }
}
