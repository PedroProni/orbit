'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { Select } from '@/components/ui/select';
import { RECURRENCE_FREQUENCIES } from '@/components/workspace/workspace.constants';
import { useInvalidating, useRecurrence } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { TaskPlanFieldProps } from './task-plan-fields.types';

export function TaskRepeatField({ taskId, onError }: TaskPlanFieldProps) {
  const t = useTranslations('planning');
  const td = useTranslations('drawer');
  const recurrence = useRecurrence(taskId);
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [interval, setIntervalValue] = useState('1');
  const save = useInvalidating(() => workspaceService.setRecurrence(taskId, { frequency, interval: Number(interval) }), ['recurrence']);
  const clear = useInvalidating(() => workspaceService.removeRecurrence(taskId), ['recurrence']);
  const current = recurrence.data;
  const toggle = () => {
    if (!open && current) {
      setFrequency(current.frequency);
      setIntervalValue(String(current.interval));
    }
    setOpen((value) => !value);
  };
  const close = () => setOpen(false);
  return (
    <>
      <button ref={anchor} type="button" aria-label={t('repeat')} aria-haspopup="dialog" aria-expanded={open} onClick={toggle} className="w-full rounded px-1.5 py-1 text-left transition-colors hover:bg-panel2">
        {current ? td('repeatEvery', { frequency: t(`frequencies.${current.frequency}`), interval: current.interval }) : <span className="text-muted">{td('empty')}</span>}
      </button>
      <Popover open={open} anchorRef={anchor} onClose={close} label={t('repeat')} role="dialog">
        <div className="space-y-2 p-2 text-sm">
          <div className="flex items-center gap-2">
            <Select ariaLabel={t('frequency')} value={frequency} options={RECURRENCE_FREQUENCIES.map((item) => ({ value: item, label: t(`frequencies.${item}`) }))} onChange={setFrequency} className="w-auto" />
            <input aria-label={t('interval')} type="number" min={1} value={interval} onChange={(e) => setIntervalValue(e.target.value)} className="w-16 rounded border border-line bg-panel2 px-2 py-1" />
          </div>
          <div className="flex items-center justify-between gap-2">
            {current ? (
              <button type="button" className="text-muted hover:text-danger" onClick={() => clear.mutate(undefined, { onSuccess: close, onError })}>
                {t('removeRepeat')}
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="rounded bg-accent px-2 py-1 text-white" onClick={() => save.mutate(undefined, { onSuccess: close, onError })}>
              {t('saveRepeat')}
            </button>
          </div>
        </div>
      </Popover>
    </>
  );
}
