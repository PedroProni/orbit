import { CalendarMonth } from './date-field.types';

const utcNoon = (day: string): Date => new Date(`${day}T12:00:00Z`);

export const shiftDay = (day: string, amount: number): string => {
  const date = utcNoon(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export const shiftMonth = (cursor: CalendarMonth, amount: number): CalendarMonth => {
  const date = new Date(Date.UTC(cursor.year, cursor.month + amount, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
};

export const monthOfDay = (day: string): CalendarMonth => ({ year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) - 1 });

export const formatMonth = (cursor: CalendarMonth, locale: string): string => new Date(Date.UTC(cursor.year, cursor.month, 15)).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const weekdayNames = (locale: string): string[] => Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(2024, 0, 7 + index, 12)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }));
