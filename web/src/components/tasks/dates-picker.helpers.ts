import { shiftDay } from '@/components/ui/date-field.helpers';
import { DAYS_IN_WEEK, MONDAY, SATURDAY } from './dates-picker.constants';
import { DateShortcut } from './dates-picker.types';

const weekday = (day: string): number => new Date(`${day}T12:00:00Z`).getUTCDay();

const nextWeekday = (day: string, target: number, allowToday: boolean): string => {
  const gap = (target - weekday(day) + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  return shiftDay(day, gap === 0 && !allowToday ? DAYS_IN_WEEK : gap);
};

const thisWeekend = (today: string): string => (weekday(today) === 0 ? today : nextWeekday(today, SATURDAY, true));

export function shortcutDay(shortcut: DateShortcut, today: string): string {
  if (shortcut === 'today') return today;
  if (shortcut === 'tomorrow') return shiftDay(today, 1);
  if (shortcut === 'thisWeekend') return thisWeekend(today);
  if (shortcut === 'nextWeek') return nextWeekday(today, MONDAY, false);
  if (shortcut === 'nextWeekend') return shiftDay(thisWeekend(today), weekday(today) === 0 ? SATURDAY : DAYS_IN_WEEK);
  if (shortcut === 'twoWeeks') return shiftDay(today, DAYS_IN_WEEK * 2);
  return shiftDay(today, DAYS_IN_WEEK * 4);
}
