'use client';

import { useState } from 'react';
import { Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { RECURRENCE_FREQUENCIES } from '@/components/workspace/workspace.constants';
import { useInvalidating, useRecurrence } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { TaskPlanFieldProps } from './task-plan-fields.types';

export function TaskRepeatSection({ taskId, onError }: TaskPlanFieldProps) {
  const t = useTranslations('planning');
  const td = useTranslations('drawer');
  const recurrence = useRecurrence(taskId);
  const current = recurrence.data;
  const [draft, setDraft] = useState<{ frequency: string; interval: string } | null>(null);
  const frequency = draft?.frequency ?? current?.frequency ?? 'weekly';
  const interval = draft?.interval ?? String(current?.interval ?? 1);
  const save = useInvalidating(() => workspaceService.setRecurrence(taskId, { frequency, interval: Number(interval) }), ['recurrence']);
  const clear = useInvalidating(() => workspaceService.removeRecurrence(taskId), ['recurrence']);
  const done = () => setDraft(null);
  return (
    <section aria-label={t('repeat')} className="space-y-2 p-2 text-[13px]">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Repeat size={12} aria-hidden="true" />
        {current ? td('repeatEvery', { frequency: t(`frequencies.${current.frequency}`), interval: current.interval }) : t('repeat')}
      </p>
      <div className="flex items-center gap-2">
        <Select ariaLabel={t('frequency')} value={frequency} options={RECURRENCE_FREQUENCIES.map((item) => ({ value: item, label: t(`frequencies.${item}`) }))} onChange={(next) => setDraft({ frequency: next, interval })} className="w-auto" />
        <input aria-label={t('interval')} type="number" min={1} value={interval} onChange={(e) => setDraft({ frequency, interval: e.target.value })} className="w-16 rounded border border-line bg-panel2 px-2 py-1" />
      </div>
      <div className="flex items-center justify-between gap-2">
        {current ? (
          <button type="button" className="text-muted hover:text-danger" onClick={() => clear.mutate(undefined, { onSuccess: done, onError })}>
            {t('removeRepeat')}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="rounded bg-accent px-2 py-1 text-white" onClick={() => save.mutate(undefined, { onSuccess: done, onError })}>
          {t('saveRepeat')}
        </button>
      </div>
    </section>
  );
}
