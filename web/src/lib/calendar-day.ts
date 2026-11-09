import { COMPACT_DAY_FORMAT, FULL_DAY_FORMAT, SHORT_DAY_FORMAT } from './calendar-day.constants';

const utcNoon = (day: string): Date => new Date(`${day}T12:00:00Z`);

export const dayFromIso = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '');

export const isoFromDay = (day: string): string | null => (day ? utcNoon(day).toISOString() : null);

export const dayKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayDay = (): string => dayKey(new Date());

export const dayStartMs = (day: string): number => Date.parse(`${day}T00:00:00Z`);

export const isOverdueDay = (iso: string | null | undefined, today: string): boolean => Boolean(iso) && dayFromIso(iso) < today;

export const formatDay = (day: string, locale: string): string => utcNoon(day).toLocaleDateString(locale, FULL_DAY_FORMAT);

export const formatCompactDay = (day: string, locale: string): string => utcNoon(day).toLocaleDateString(locale, COMPACT_DAY_FORMAT);

export const formatShortDay = (iso: string | null | undefined, locale: string): string => (iso ? utcNoon(dayFromIso(iso)).toLocaleDateString(locale, SHORT_DAY_FORMAT) : '');
