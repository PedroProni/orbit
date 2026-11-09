import { dayKey } from '@/lib/calendar-day';
import { CalendarCell } from './calendar.types';

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { key: dayKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
}
