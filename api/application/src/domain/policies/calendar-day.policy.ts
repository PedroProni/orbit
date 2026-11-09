import { DAY_MS } from '@domain/constants/calendar-day.constant';

export class CalendarDayPolicy {
  static dayOf(date: Date | number): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  static isOverdue(due: Date | null | undefined, now: number): boolean {
    return Boolean(due) && CalendarDayPolicy.dayOf(due as Date) < CalendarDayPolicy.dayOf(now);
  }

  static isDueWithin(due: Date | null | undefined, now: number, days: number): boolean {
    if (!due) return false;
    const day = CalendarDayPolicy.dayOf(due);
    return day >= CalendarDayPolicy.dayOf(now) && day <= CalendarDayPolicy.dayOf(now + days * DAY_MS);
  }
}
