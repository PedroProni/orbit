import { ResolvedClickupDate } from './clickup-date.type';

export class ClickupDatePolicy {
  static localDay(instant: Date, zone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
    const read = (type: string): string => parts.find((p) => p.type === type)!.value;
    return `${read('year')}-${read('month')}-${read('day')}`;
  }

  static resolve(raw: unknown, hasTime: unknown, zone: string): ResolvedClickupDate | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const instant = new Date(Number(raw));
    if (Number.isNaN(instant.getTime())) return null;
    const localDay = ClickupDatePolicy.localDay(instant, zone);
    return { day: new Date(`${localDay}T12:00:00.000Z`), localDay, instant, raw: String(raw), hasTime: typeof hasTime === 'boolean' ? hasTime : null };
  }
}
