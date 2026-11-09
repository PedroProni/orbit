'use client';

import { Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRecurrence } from '@/hooks/use-workspace';
import { TaskRepeatIndicatorProps } from './task-plan-fields.types';

export function TaskRepeatIndicator({ taskId }: TaskRepeatIndicatorProps) {
  const t = useTranslations('planning');
  const td = useTranslations('drawer');
  const recurrence = useRecurrence(taskId);
  const current = recurrence.data;
  if (!current) return null;
  const label = td('repeatEvery', { frequency: t(`frequencies.${current.frequency}`), interval: current.interval });
  return (
    <span role="img" aria-label={label} title={label} className="shrink-0 text-muted">
      <Repeat size={12} aria-hidden="true" />
    </span>
  );
}
