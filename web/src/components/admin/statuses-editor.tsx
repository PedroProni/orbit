'use client';

import { useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUpdateSpace } from '@/hooks/use-admin';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { useStatusLabel } from '@/hooks/use-status-label';
import { StatusInput } from '@/services/admin.types';
import { useToastStore } from '@/stores/toast.store';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, DEFAULT_STATUS_COUNT, MAX_STATUSES } from './admin.constants';
import { StatusesEditorProps } from './admin.types';
import { moveStatus, newExtraStatus, sameStatuses, statusDraftProblem, toStatusInputs } from './statuses.helpers';
import { StatusRow } from './status-row';

export function StatusesEditor({ space }: StatusesEditorProps) {
  const t = useTranslations('admin');
  const statusLabel = useStatusLabel();
  const errorText = useApiErrorText();
  const update = useUpdateSpace();
  const saved = toStatusInputs(space.statuses);
  const [draft, setDraft] = useState<StatusInput[]>(saved);
  const [error, setError] = useState<string | null>(null);

  const defaults = draft.slice(0, DEFAULT_STATUS_COUNT);
  const extras = draft.slice(DEFAULT_STATUS_COUNT);
  const dirty = !sameStatuses(draft, saved);

  const change = (index: number, status: StatusInput) => setDraft((current) => current.map((item, position) => (position === index ? status : item)));

  const save = async () => {
    const problem = statusDraftProblem(draft);
    if (problem) {
      setError(t(`statuses.${problem}`));
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({
        id: space.id,
        patch: {
          statuses: draft.map((status) => ({
            ...status,
            name: status.name.trim(),
          })),
        },
      });
      useToastStore.getState().push('success', 'adminSaved');
    } catch (failure) {
      setError(errorText(failure));
    }
  };

  return (
    <section aria-labelledby="admin-statuses-title" className={ADMIN_PANEL_CLASS}>
      <h2 id="admin-statuses-title" className="border-b border-line px-3 py-2 text-sm font-semibold">
        {t('statuses.defaults')}
      </h2>
      <p className="px-3 pt-2 text-xs text-muted">{t('statuses.defaultsHint')}</p>
      <ul className="divide-y divide-line">
        {defaults.map((status) => (
          <li key={status.name} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
            <span className="min-w-0 flex-1 truncate">{statusLabel(status.name)}</span>
            <span className="shrink-0 text-xs text-muted">{t(`statuses.stages.${status.type}`)}</span>
            <Lock size={12} aria-label={t('statuses.locked')} className="shrink-0 text-muted" />
          </li>
        ))}
      </ul>
      <h3 className="border-y border-line px-3 py-2 text-sm font-semibold">{t('statuses.extras')}</h3>
      {extras.length === 0 ? <p className="px-3 py-2 text-xs text-muted">{t('statuses.extrasEmpty')}</p> : null}
      <ul className="divide-y divide-line">
        {extras.map((status, offset) => {
          const index = DEFAULT_STATUS_COUNT + offset;
          return (
            <StatusRow
              key={index}
              status={status}
              position={index + 1}
              canMoveUp={offset > 0}
              canMoveDown={index < draft.length - 1}
              onChange={(next) => change(index, next)}
              onMove={(step) => setDraft((current) => moveStatus(current, index, step))}
              onRemove={() => setDraft((current) => current.filter((_, position) => position !== index))}
            />
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="px-3 pt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-between gap-2 border-t border-line p-3">
        <button type="button" disabled={draft.length >= MAX_STATUSES} onClick={() => setDraft((current) => [...current, newExtraStatus('', current)])} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('statuses.add')}
        </button>
        <button type="button" disabled={!dirty || update.isPending} onClick={() => void save()} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {t('statuses.saveStatuses')}
        </button>
      </div>
    </section>
  );
}
