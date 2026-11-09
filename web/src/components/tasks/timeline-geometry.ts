import { dayFromIso, dayStartMs } from '@/lib/calendar-day';
import { DAY_MS, TIMELINE_DAYS } from './tasks.constants';
import { Task } from '@/types/api.types';

export function timelineStart(now: Date, offsetDays: number): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) + (offsetDays - 7) * DAY_MS);
}

export function barGeometry(task: Task, start: Date): { left: number; width: number } | null {
  if (!task.dueDate) return null;
  const end = dayStartMs(dayFromIso(task.dueDate)) + DAY_MS;
  const begin = dayStartMs(dayFromIso(task.startDate ?? task.dueDate));
  const windowEnd = start.getTime() + TIMELINE_DAYS * DAY_MS;
  if (end <= start.getTime() || begin >= windowEnd) return null;
  const from = Math.max(begin, start.getTime());
  const to = Math.min(end, windowEnd);
  const total = TIMELINE_DAYS * DAY_MS;
  return { left: ((from - start.getTime()) / total) * 100, width: Math.max(((to - from) / total) * 100, 2) };
}
