'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DateCalendar } from '@/components/ui/date-calendar';
import { formatShortDay, isoFromDay, todayDay } from '@/lib/calendar-day';
import { cn } from '@/lib/cn';
import { DATE_SHORTCUTS } from './dates-picker.constants';
import { shortcutDay } from './dates-picker.helpers';
import { DateSide, DatesPickerProps } from './dates-picker.types';

export function DatesPicker({ value, onChange, onDone }: DatesPickerProps) {
  const t = useTranslations('composer');
  const locale = useLocale();
  const [side, setSide] = useState<DateSide>('due');
  const [today] = useState(todayDay);
  const current = side === 'start' ? value.startDate : value.dueDate;
  const pick = (day: string) => {
    const next = side === 'start' ? { ...value, startDate: day } : { ...value, dueDate: day };
    onChange(next);
    if (side === 'start') setSide('due');
    else onDone();
  };
  const clear = (which: DateSide) => onChange(which === 'start' ? { ...value, startDate: '' } : { ...value, dueDate: '' });
  const sides: { key: DateSide; label: string; day: string }[] = [
    { key: 'start', label: t('startDate'), day: value.startDate },
    { key: 'due', label: t('dueDate'), day: value.dueDate },
  ];
  return (
    <div className="w-[min(30rem,calc(100vw-2rem))] text-sm">
      <div className="grid grid-cols-2 gap-1 border-b border-line p-1.5">
        {sides.map((item) => (
          <div key={item.key} className={cn('flex min-w-0 items-center rounded border px-2 py-1', side === item.key ? 'border-accent bg-accentsoft/40' : 'border-line')}>
            <button type="button" aria-pressed={side === item.key} onClick={() => setSide(item.key)} className="min-w-0 flex-1 truncate text-left">
              <span className="block text-[11px] text-muted">{item.label}</span>
              <span className={item.day ? 'text-fg' : 'text-muted'}>{item.day ? formatShortDay(isoFromDay(item.day), locale) : t('noDate')}</span>
            </button>
            {item.day ? (
              <button type="button" aria-label={t('clearSide', { side: item.label })} onClick={() => clear(item.key)} className="shrink-0 text-muted hover:text-fg">
                <X size={12} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row">
        <ul aria-label={t('dateShortcuts')} className="flex flex-wrap gap-1 border-b border-line p-1.5 sm:w-40 sm:flex-col sm:flex-nowrap sm:border-b-0 sm:border-r">
          {DATE_SHORTCUTS.map((shortcut) => {
            const day = shortcutDay(shortcut, today);
            return (
              <li key={shortcut}>
                <button type="button" onClick={() => pick(day)} className={cn('flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-panel2', current === day && 'text-accent')}>
                  <span>{t(`shortcuts.${shortcut}`)}</span>
                  <span className="text-muted">{formatShortDay(isoFromDay(day), locale)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="min-w-0 flex-1">
          <DateCalendar key={side} value={current} onSelect={pick} />
        </div>
      </div>
    </div>
  );
}
