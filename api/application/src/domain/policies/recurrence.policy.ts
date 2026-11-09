import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

export class RecurrencePolicy {
  static next(from: Date, frequency: RecurrenceFrequency, interval: number): Date {
    const next = new Date(from.getTime());
    if (frequency === RecurrenceFrequency.DAILY) next.setUTCDate(next.getUTCDate() + interval);
    else if (frequency === RecurrenceFrequency.WEEKLY) next.setUTCDate(next.getUTCDate() + 7 * interval);
    else {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + interval);
      const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(day, last));
    }
    return next;
  }

  static shift(date: Date | null, from: Date, to: Date): Date | null {
    return date ? new Date(date.getTime() + (to.getTime() - from.getTime())) : null;
  }
}
