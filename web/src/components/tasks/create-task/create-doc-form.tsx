'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { useToastStore } from '@/stores/toast.store';
import { DOC_LINK_PARAM } from '@/components/workspace/docs.constants';
import { CREATE_TASK_DESCRIPTION_MAX } from './create-task.constants';
import { CreateDocFormProps } from './create-task.types';

export function CreateDocForm({ onDone }: CreateDocFormProps) {
  const t = useTranslations('createTask');
  const router = useRouter();
  const client = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const doc = await workspaceService.createDoc({ title: title.trim(), bodyMd: body });
      await client.invalidateQueries({ queryKey: ['docs'] });
      useToastStore.getState().push('success', 'docCreated', { name: doc.title });
      onDone();
      router.push(`/docs?${DOC_LINK_PARAM}=${doc.id}`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} aria-label={t('tabs.doc')} className="flex min-h-0 flex-1 flex-col gap-2 p-4">
      <input autoFocus aria-label={t('docTitle')} placeholder={t('docTitle')} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className="no-focus-ring w-full bg-transparent text-lg font-semibold outline-none" />
      <textarea aria-label={t('docBody')} placeholder={t('docBody')} value={body} maxLength={CREATE_TASK_DESCRIPTION_MAX} onChange={(e) => setBody(e.target.value)} rows={8} className="min-h-32 w-full flex-1 resize-y rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
      {failed ? (
        <p role="alert" className="text-xs text-danger">
          {t('docFailed')}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" disabled={!title.trim() || busy} className="rounded bg-accent px-3 py-1 text-sm text-white disabled:opacity-50">
          {t('createDoc')}
        </button>
      </div>
    </form>
  );
}
