import { SpaceEntity } from '@domain/entities/space.entity';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { CANCELLED_TAG } from '@domain/constants/status-aliases.constant';
import { TaskPriority } from '@domain/enums/task.enums';
import { Checklist } from '@domain/types/checklist.type';

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export class ClickupImportMapper {
  static date(value: unknown): Date | null {
    return toDate(value);
  }

  static statusAndTags(space: SpaceEntity, rawStatus: unknown, rawTags: any[] | undefined): { source: string; status: string | null; tags: string[] } {
    const source = String(rawStatus ?? '').trim().toLowerCase();
    const tags = [...new Set((rawTags ?? []).map((t) => String(t.name).toLowerCase()))];
    if (StatusAliasPolicy.isCancelled(source) && !tags.includes(CANCELLED_TAG)) tags.push(CANCELLED_TAG);
    return { source, status: source ? space.resolveStatus(source) : null, tags };
  }

  static closedAt(raw: any, closed: boolean, fallback: Date): Date | null {
    if (!closed) return null;
    return toDate(raw.date_closed) ?? toDate(raw.date_done) ?? fallback;
  }

  static priority(raw: any): TaskPriority | null {
    const name = raw?.priority;
    return ['urgent', 'high', 'normal', 'low'].includes(name) ? (name as TaskPriority) : null;
  }

  static checklists(raw: any[], resolveUser: (id: unknown) => string | null): Checklist[] {
    return (raw ?? []).map((c) => ({ id: String(c.id), name: String(c.name ?? ''), items: (c.items ?? []).map((i: any) => ({ id: String(i.id), name: String(i.name ?? ''), resolved: !!i.resolved, assigneeId: i.assignee ? resolveUser(i.assignee.id) : null })) }));
  }

  static description(task: any): string {
    return String(task.markdown_description ?? task.description ?? task.text_content ?? '');
  }
}
