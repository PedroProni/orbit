'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUiStore } from '@/stores/ui.store';
import { barGeometry, timelineStart } from './timeline-geometry';
import { DAY_MS, TIMELINE_DAYS } from './tasks.constants';
import { Task } from '@/types/api.types';

export function TimelineView({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('timeline');
  const openTask = useUiStore((s) => s.openTask);
  const [offset, setOffset] = useState(0);
  const start = timelineStart(new Date(), offset);
  const scheduled = tasks.filter((task) => task.dueDate);
  const days = Array.from({ length: TIMELINE_DAYS }, (_, i) => new Date(start.getTime() + i * DAY_MS));
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" aria-label={t('previous')} className="rounded border border-line px-2" onClick={() => setOffset((o) => o - 14)}>
          <ChevronLeft size={14} />
        </button>
        <button type="button" aria-label={t('next')} className="rounded border border-line px-2" onClick={() => setOffset((o) => o + 14)}>
          <ChevronRight size={14} />
        </button>
        <button type="button" className="text-xs text-muted" onClick={() => setOffset(0)}>
          {t('today')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid border-b border-line text-[10px] text-muted" style={{ gridTemplateColumns: `repeat(${TIMELINE_DAYS}, minmax(0, 1fr))` }}>
            {days.map((d) => (
              <div key={d.getTime()} className="border-l border-line px-0.5">
                {d.getUTCDate()}
              </div>
            ))}
          </div>
          <ul className="space-y-1 py-2">
            {scheduled.map((task) => {
              const bar = barGeometry(task, start);
              return (
                <li key={task.id} className="relative h-7">
                  {bar ? (
                    <button type="button" onClick={() => openTask(task.id)} title={task.title} className="absolute h-6 truncate rounded bg-accent px-2 text-left text-xs text-white" style={{ left: `${bar.left}%`, width: `${bar.width}%` }}>
                      {task.title}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {scheduled.length === 0 ? <p className="text-sm text-muted">{t('noDates')}</p> : null}
        </div>
      </div>
    </div>
  );
}
