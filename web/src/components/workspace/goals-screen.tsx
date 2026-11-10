'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useGoals, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { Goal } from '@/types/workspace.types';
import { RowsSkeleton } from './screen-skeletons';
import { SCREEN_INPUT_CLASS, SCREEN_NARROW_CLASS, SCREEN_PRIMARY_BUTTON_CLASS } from './screens.constants';
import { GOAL_DEFAULT_CURRENT, GOAL_DEFAULT_TARGET } from './goals.constants';

export function GoalsScreen() {
  const t = useTranslations('goals');
  const tu = useTranslations('ui');
  const goals = useGoals();
  const { canWrite } = useCapabilities();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(GOAL_DEFAULT_TARGET);
  const [current, setCurrent] = useState(GOAL_DEFAULT_CURRENT);
  const [removing, setRemoving] = useState<Goal | null>(null);
  const create = useInvalidating(workspaceService.createGoal, ['goals'], 'goalCreateFailed');
  const remove = useInvalidating(workspaceService.deleteGoal, ['goals']);
  const valid = name.trim() && Number(target) > 0 && Number(current) >= 0;
  return (
    <div className={SCREEN_NARROW_CLASS}>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {canWrite ? (
        <form
          className="mb-6 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            create.mutate(
              { name: name.trim(), description: '', targets: [{ name: t('mainTarget'), kind: 'number', targetValue: Number(target), currentValue: Number(current) }] },
              {
                onSuccess: () => {
                  setName('');
                  setTarget(GOAL_DEFAULT_TARGET);
                  setCurrent(GOAL_DEFAULT_CURRENT);
                },
              },
            );
          }}
        >
          <input aria-label={t('name')} placeholder={t('name')} value={name} onChange={(e) => setName(e.target.value)} className={`${SCREEN_INPUT_CLASS} basis-full sm:min-w-48 sm:flex-1 sm:basis-0`} />
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('targetValue')}
            <input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} className={`${SCREEN_INPUT_CLASS} w-24 text-fg`} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('currentValue')}
            <input type="number" min={0} value={current} onChange={(e) => setCurrent(e.target.value)} className={`${SCREEN_INPUT_CLASS} w-24 text-fg`} />
          </label>
          <button type="submit" disabled={!valid || create.isPending} className={SCREEN_PRIMARY_BUTTON_CLASS}>
            {t('create')}
          </button>
        </form>
      ) : null}
      {goals.isLoading ? <RowsSkeleton rows={3} /> : null}
      {goals.isError ? <ErrorState title={tu('loadError')} onRetry={goals.refetch} /> : null}
      {goals.data?.length === 0 ? <EmptyState title={t('empty')} hint={t(canWrite ? 'emptyHint' : 'emptyHintReadOnly')} /> : null}
      <ul className="space-y-3">
        {goals.data?.map((goal) => (
          <li key={goal.id} className="rounded border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 break-words font-medium">{goal.name}</span>
              {canWrite ? (
                <button type="button" aria-label={t('deleteNamed', { name: goal.name })} className="shrink-0 rounded px-1 text-xs text-muted hover:text-danger" onClick={() => setRemoving(goal)}>
                  {t('delete')}
                </button>
              ) : null}
            </div>
            <div className="mt-2 h-2 rounded bg-panel2" role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100} aria-label={goal.name}>
              <div className="h-2 rounded bg-accent" style={{ width: `${goal.progress}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted">{goal.progress}%</div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={removing !== null}
        title={t('deleteTitle')}
        message={t('confirmDelete', { name: removing?.name ?? '' })}
        confirmLabel={t('delete')}
        onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
