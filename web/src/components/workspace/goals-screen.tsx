'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useGoals, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';

export function GoalsScreen() {
  const t = useTranslations('goals');
  const goals = useGoals();
  const { canWrite } = useCapabilities();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('100');
  const [current, setCurrent] = useState('0');
  const create = useInvalidating(workspaceService.createGoal, ['goals']);
  const remove = useInvalidating(workspaceService.deleteGoal, ['goals']);
  const valid = name.trim() && Number(target) > 0 && Number(current) >= 0;
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold">{t('title')}</h1>
      {canWrite ? (
        <form
          className="mb-6 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            create.mutate({ name: name.trim(), description: '', targets: [{ name: t('mainTarget'), kind: 'number', targetValue: Number(target), currentValue: Number(current) }] });
            setName('');
          }}
        >
          <input aria-label={t('name')} placeholder={t('name')} value={name} onChange={(e) => setName(e.target.value)} className="min-w-48 flex-1 rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
          <input aria-label={t('targetValue')} type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} className="w-24 rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
          <input aria-label={t('currentValue')} type="number" min={0} value={current} onChange={(e) => setCurrent(e.target.value)} className="w-24 rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
          <button type="submit" disabled={!valid || create.isPending} className="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {t('create')}
          </button>
        </form>
      ) : null}
      {goals.data?.length === 0 ? <p className="text-sm text-muted">{t('empty')}</p> : null}
      <ul className="space-y-3">
        {goals.data?.map((goal) => (
          <li key={goal.id} className="rounded border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{goal.name}</span>
              {canWrite ? (
                <button type="button" className="text-xs text-muted hover:text-danger" onClick={() => remove.mutate(goal.id)}>
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
    </div>
  );
}
