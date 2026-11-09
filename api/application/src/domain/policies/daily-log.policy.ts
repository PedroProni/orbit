import { DAILY_LOG_HEADING_PREFIX, DAILY_LOG_TIMEZONE } from '@domain/constants/daily-log.constant';

export class DailyLogPolicy {
  static dateKey(at: Date): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_LOG_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  }

  static shortDate(at: Date): string {
    const [, month, day] = DailyLogPolicy.dateKey(at).split('-');
    return `${day}/${month}`;
  }

  static heading(dateKey: string): string {
    const [, month, day] = dateKey.split('-');
    return `${DAILY_LOG_HEADING_PREFIX} ${day}/${month}`;
  }
}
