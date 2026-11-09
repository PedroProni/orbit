'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useUiStore } from '@/stores/ui.store';
import { dayFromIso } from '@/lib/calendar-day';
import { buildMonthGrid } from './calendar-grid';
import { Task } from '@/types/api.types';

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const openTask = useUiStore((s) => s.openTask);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dayFromIso(task.dueDate);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const shift = (delta: number) => setCursor((c) => {
    const date = new Date(c.year, c.month + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(locale, { weekday: 'short' }));
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" aria-label={t('previous')} className="rounded border border-line px-2" onClick={() => shift(-1)}>
          <ChevronLeft size={14} />
        </button>
        <h2 className="min-w-40 text-center font-medium">{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
        <button type="button" aria-label={t('next')} className="rounded border border-line px-2" onClick={() => shift(1)}>
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded border border-line bg-line text-xs">
        {weekdays.map((w) => (
          <div key={w} className="bg-panel px-2 py-1 text-muted">
            {w}
          </div>
        ))}
        {grid.map((cell) => {
          const items = byDay.get(cell.key) ?? [];
          return (
            <div key={cell.key} className={`min-h-24 bg-bg p-1 ${cell.inMonth ? '' : 'opacity-40'}`}>
              <div className="text-muted">{cell.day}</div>
              {items.slice(0, 3).map((task) => (
                <button key={task.id} type="button" onClick={() => openTask(task.id)} className="mb-0.5 block w-full truncate rounded bg-accentsoft px-1 text-left">
                  {task.title}
                </button>
              ))}
              {items.length > 3 ? <div className="text-muted">{t('more', { count: items.length - 3 })}</div> : null}
            </div>
          );
        })}
      </div>
      {tasks.every((task) => !task.dueDate) ? <p className="mt-3 text-sm text-muted">{t('noDates')}</p> : null}
    </div>
  );
}
