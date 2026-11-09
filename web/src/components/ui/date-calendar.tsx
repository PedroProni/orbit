'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { buildMonthGrid } from '@/components/tasks/calendar-grid';
import { todayDay } from '@/lib/calendar-day';
import { cn } from '@/lib/cn';
import { DAY_KEY_MOVES } from './date-field.constants';
import { formatMonth, monthOfDay, shiftDay, shiftMonth, weekdayNames } from './date-field.helpers';
import { DateCalendarProps } from './date-field.types';

export function DateCalendar({ value, onSelect }: DateCalendarProps) {
  const t = useTranslations('ui');
  const locale = useLocale();
  const [today] = useState(todayDay);
  const [focused, setFocused] = useState(value || today);
  const [cursor, setCursor] = useState(() => monthOfDay(value || today));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [focused]);

  const focusDay = (day: string) => {
    setFocused(day);
    setCursor(monthOfDay(day));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = DAY_KEY_MOVES[event.key];
    if (move !== undefined) {
      event.preventDefault();
      focusDay(shiftDay(focused, move));
    }
  };
  const cells = buildMonthGrid(cursor.year, cursor.month);

  return (
    <div className="w-64 p-2 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label={t('previousMonth')} onClick={() => setCursor((c) => shiftMonth(c, -1))} className="rounded p-1 text-muted transition-colors hover:bg-panel2 hover:text-fg">
          <ChevronLeft size={16} />
        </button>
        <span aria-live="polite" className="font-heading font-medium first-letter:uppercase">
          {formatMonth(cursor, locale)}
        </span>
        <button type="button" aria-label={t('nextMonth')} onClick={() => setCursor((c) => shiftMonth(c, 1))} className="rounded p-1 text-muted transition-colors hover:bg-panel2 hover:text-fg">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted" aria-hidden="true">
        {weekdayNames(locale).map((name) => (
          <span key={name} className="py-1 capitalize">
            {name.replace('.', '')}
          </span>
        ))}
      </div>
      <div ref={gridRef} role="grid" aria-label={formatMonth(cursor, locale)} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            role="gridcell"
            aria-selected={cell.key === value}
            aria-current={cell.key === today ? 'date' : undefined}
            tabIndex={cell.key === focused ? 0 : -1}
            data-day={cell.key}
            onClick={() => onSelect(cell.key)}
            className={cn('rounded py-1 text-center text-xs transition-colors hover:bg-panel2', !cell.inMonth && 'text-faint', cell.key === today && 'font-semibold text-accent', cell.key === value && 'bg-accent text-white hover:bg-accent')}
          >
            {cell.day}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
        <button type="button" onClick={() => onSelect(today)} className="rounded px-2 py-1 text-accent transition-colors hover:bg-panel2">
          {t('today')}
        </button>
        {value ? (
          <button type="button" onClick={() => onSelect('')} className="rounded px-2 py-1 text-muted transition-colors hover:bg-panel2 hover:text-fg">
            {t('clearDate')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
