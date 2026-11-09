'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { TASK_KINDS } from '@/components/workspace/workspace.constants';
import { useInvalidating, useTaskPlan } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { TaskPlanFieldProps, TaskPlanPatch } from './task-plan-fields.types';

export function TaskKindField({ taskId, onError }: TaskPlanFieldProps) {
  const t = useTranslations('planning');
  const plan = useTaskPlan(taskId);
  const change = useInvalidating((body: TaskPlanPatch) => workspaceService.changePlan(taskId, body), ['plan']);
  return <Select ariaLabel={t('kind')} variant="inline" className="w-auto" value={plan.data?.taskKind ?? 'task'} options={TASK_KINDS.map((kind) => ({ value: kind, label: t(`kinds.${kind}`) }))} onChange={(taskKind) => change.mutate({ taskKind }, { onError })} />;
}
