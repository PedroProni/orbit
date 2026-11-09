'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreateTask, useSubtasks } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { useStatusLabel } from '@/hooks/use-status-label';
import { describeApiError } from '@/lib/api-error';
import { TaskSubtasksProps } from './task-field.types';

export function TaskSubtasks({ parentId, listId, canAdd, composing, onComposingChange }: TaskSubtasksProps) {
  const t = useTranslations('drawer');
  const tApi = useTranslations('apiErrors');
  const openTask = useUiStore((s) => s.openTask);
  const subtasks = useSubtasks(parentId);
  const create = useCreateTask({ inlineError: true });
  const statusLabel = useStatusLabel();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const items = subtasks.data?.data ?? [];
  if (items.length === 0 && !(canAdd && composing)) return null;
  return (
    <section>
      <h2 className="mb-1 text-xs uppercase text-muted">{t('subtasks')}</h2>
      <ul className="space-y-1 text-sm">
        {items.map((s) => (
          <li key={s.id}>
            <button type="button" className="text-left hover:text-accent" onClick={() => openTask(s.id)}>
              {s.title} <span className="text-xs text-muted">({statusLabel(s.status)})</span>
            </button>
          </li>
        ))}
      </ul>
      {canAdd ? (
        <form
          className="mt-1"
          onSubmit={(event) => {
            event.preventDefault();
            const value = title.trim();
            if (!value || create.isPending) return;
            setError(null);
            create.mutate(
              { listId, title: value, parentId },
              {
                onSuccess: () => setTitle(''),
                onError: (err) => {
                  const described = describeApiError(err);
                  setError(tApi(described.key, described.values));
                },
              },
            );
          }}
        >
          <input autoFocus={composing} aria-label={t('addSubtask')} placeholder={t('addSubtask')} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !title.trim() && onComposingChange(false)} className="w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
          {error ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
