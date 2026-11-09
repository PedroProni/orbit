'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { useDependencies, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { TaskDependenciesProps } from './task-plan-fields.types';

export function TaskDependencies({ taskId, siblings, open, onClose, onError }: TaskDependenciesProps) {
  const t = useTranslations('planning');
  const deps = useDependencies(taskId);
  const [blocker, setBlocker] = useState('');
  const add = useInvalidating((id: string) => workspaceService.addDependency(taskId, id), ['dependencies']);
  const remove = useInvalidating((id: string) => workspaceService.removeDependency(taskId, id), ['dependencies']);
  const blockedBy = deps.data?.blockedBy ?? [];
  if (!open && blockedBy.length === 0) return null;
  const titleOf = (id: string) => siblings.find((item) => item.id === id)?.title ?? id;
  return (
    <section aria-label={t('blockedBy')} className="text-sm">
      <h2 className="mb-1 text-xs uppercase text-muted">{t('blockedBy')}</h2>
      <ul className="mb-1 space-y-1">
        {blockedBy.map((id) => (
          <li key={id} className="flex justify-between rounded border border-line px-2 py-1">
            <span className="truncate">{titleOf(id)}</span>
            <button type="button" aria-label={t('removeDependency')} className="text-muted hover:text-danger" onClick={() => remove.mutate(id, { onError })}>
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Select ariaLabel={t('addDependency')} value={blocker} options={[{ value: '', label: t('addDependency') }, ...siblings.filter((item) => item.id !== taskId).map((item) => ({ value: item.id, label: item.title }))]} onChange={setBlocker} className="w-auto min-w-0 flex-1" />
        <button type="button" disabled={!blocker} className="rounded border border-line px-2 py-1 disabled:opacity-50" onClick={() => add.mutate(blocker, { onSuccess: () => setBlocker(''), onError })}>
          {t('add')}
        </button>
        {blockedBy.length === 0 ? (
          <button type="button" className="text-xs text-muted hover:text-fg" onClick={onClose}>
            {t('cancel')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
