'use client';

import { useRef, useState } from 'react';
import { Play, Plus, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { useInvalidating, useTaskPlan, useTaskTime } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { TaskPlanFieldProps } from './task-plan-fields.types';

export function TaskTrackTimeField({ taskId, onError, readOnly = false }: TaskPlanFieldProps) {
  const t = useTranslations('planning');
  const td = useTranslations('drawer');
  const plan = useTaskPlan(taskId);
  const time = useTaskTime(taskId);
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState('');
  const start = useInvalidating(() => workspaceService.startTimer(taskId), ['time']);
  const stop = useInvalidating(() => workspaceService.stopTimer(taskId), ['time', 'plan']);
  const addTime = useInvalidating((value: number) => workspaceService.addTime(taskId, value), ['time', 'plan']);
  const running = time.data?.entries.some((entry) => entry.running) ?? false;
  const tracked = plan.data?.trackedMinutes ?? 0;
  if (readOnly) return <span className={tracked > 0 ? 'px-1.5' : 'px-1.5 text-muted'}>{tracked > 0 ? td('minutes', { minutes: tracked }) : td('empty')}</span>;
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => (running ? stop.mutate(undefined, { onError }) : start.mutate(undefined, { onError }))} className="flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-panel2">
        {running ? <Square size={12} className="text-danger" /> : <Play size={12} />}
        {running ? t('stop') : t('start')}
      </button>
      {tracked > 0 ? <span className="text-xs text-muted">{td('minutes', { minutes: tracked })}</span> : null}
      <button ref={anchor} type="button" aria-label={t('addTime')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="rounded p-1 text-muted transition-colors hover:bg-panel2 hover:text-fg">
        <Plus size={12} />
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('addTime')} role="dialog">
        <form
          className="flex items-center gap-2 p-2 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            if (!minutes) return;
            addTime.mutate(Number(minutes), {
              onSuccess: () => {
                setMinutes('');
                setOpen(false);
              },
              onError,
            });
          }}
        >
          <input autoFocus aria-label={t('manualMinutes')} type="number" min={1} placeholder={t('manualMinutes')} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-24 rounded border border-line bg-panel2 px-2 py-1" />
          <button type="submit" disabled={!minutes} className="rounded bg-accent px-2 py-1 text-white disabled:opacity-50">
            {t('add')}
          </button>
        </form>
      </Popover>
    </div>
  );
}
