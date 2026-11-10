'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInvalidating, useTaskPlan } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';
import { TaskPlanFieldProps, TaskPlanPatch } from './task-plan-fields.types';

export function TaskEstimateField({ taskId, onError, readOnly = false }: TaskPlanFieldProps) {
  const t = useTranslations('planning');
  const td = useTranslations('drawer');
  const plan = useTaskPlan(taskId);
  const [draft, setDraft] = useState('');
  const change = useInvalidating((body: TaskPlanPatch) => workspaceService.changePlan(taskId, body), ['plan']);
  const current = plan.data?.estimateMinutes ?? null;
  if (readOnly) return <span className={current === null ? 'px-1.5 text-muted' : 'px-1.5'}>{current === null ? td('empty') : td('minutes', { minutes: current })}</span>;
  return (
    <input
      type="number"
      min={0}
      aria-label={t('estimate')}
      placeholder={current === null ? td('empty') : td('minutes', { minutes: current })}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft && change.mutate({ estimateMinutes: Number(draft) }, { onSuccess: () => setDraft(''), onError })}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.currentTarget.blur();
      }}
      className={INLINE_INPUT_CLASS}
    />
  );
}
