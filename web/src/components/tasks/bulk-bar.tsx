'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { useMembers } from '@/hooks/use-orbit';
import { useStatusLabel } from '@/hooks/use-status-label';
import { bulkUpdate } from '@/lib/bulk-update';
import { TaskPatch } from '@/services/orbit.types';
import { useSelectionStore } from '@/stores/selection.store';
import { useToastStore } from '@/stores/toast.store';
import { PRIORITIES } from './tasks.constants';
import { BulkBarProps } from './bulk-bar.types';

export function BulkBar({ space }: BulkBarProps) {
  const t = useTranslations('bulk');
  const tt = useTranslations('tasks');
  const ids = useSelectionStore((s) => s.ids);
  const setIds = useSelectionStore((s) => s.set);
  const clear = useSelectionStore((s) => s.clear);
  const members = useMembers();
  const statusLabel = useStatusLabel();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState('');
  if (ids.length === 0) return null;
  const apply = async (patch: TaskPatch) => {
    setBusy(true);
    const failed = await bulkUpdate(ids, patch);
    const done = ids.length - failed.length;
    setBusy(false);
    client.invalidateQueries({ queryKey: ['tasks'] });
    setIds(failed);
    if (failed.length === 0) useToastStore.getState().push('success', 'bulkDone', { count: String(done) });
    else useToastStore.getState().push('error', 'bulkPartial', { done: String(done), failed: String(failed.length) });
  };
  return (
    <div role="toolbar" aria-label={t('label')} aria-busy={busy} className="anim-pop-in fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-lg border border-linestrong bg-raised p-2 text-sm shadow-floating">
      <span className="px-1 text-xs text-muted">{t('selected', { count: ids.length })}</span>
      <Select disabled={busy} ariaLabel={t('status')} placeholder={t('status')} value="" options={space.statuses.map((status) => ({ value: status.name, label: statusLabel(status.name) }))} onChange={(status) => void apply({ status })} variant="ghost" className="w-auto" />
      <Select disabled={busy} ariaLabel={t('assignee')} placeholder={t('assignee')} value="" options={(members.data ?? []).map((member) => ({ value: member.id, label: member.name }))} onChange={(id) => void apply({ addAssigneeIds: [id] })} variant="ghost" className="w-auto" />
      <Select disabled={busy} ariaLabel={t('priority')} placeholder={t('priority')} value="" options={PRIORITIES.map((priority) => ({ value: priority, label: tt(`priority.${priority}`) }))} onChange={(priority) => void apply({ priority })} variant="ghost" className="w-auto" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = tag.trim().toLowerCase();
          if (!value) return;
          setTag('');
          void apply({ addTags: [value] });
        }}
      >
        <input disabled={busy} aria-label={t('tag')} placeholder={t('tag')} value={tag} onChange={(e) => setTag(e.target.value)} className="w-24 rounded border border-line bg-panel2 px-2 py-0.5" />
      </form>
      <button type="button" disabled={busy} onClick={() => void apply({ archived: true })} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted hover:text-fg disabled:opacity-50">
        <Archive size={13} />
        {t('archive')}
      </button>
      <button type="button" aria-label={t('clear')} disabled={busy} onClick={clear} className="rounded p-1 text-muted hover:text-fg disabled:opacity-50">
        <X size={13} />
      </button>
    </div>
  );
}
