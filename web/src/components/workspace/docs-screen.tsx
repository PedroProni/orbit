'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useDoc, useDocs, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { DocEditor } from './doc-editor';
import { DocTree } from './doc-tree';
import { buildDocTree } from './docs.helpers';
import { DOC_LINK_PARAM } from './docs.constants';

export function DocsScreen() {
  const t = useTranslations('docs');
  const docs = useDocs();
  const linked = useSearchParams().get(DOC_LINK_PARAM);
  const [selected, setSelected] = useState<string | null>(linked);
  const [followedLink, setFollowedLink] = useState<string | null>(linked);
  if (linked && linked !== followedLink) {
    setFollowedLink(linked);
    setSelected(linked);
  }
  const doc = useDoc(selected);
  useEffect(() => {
    if (!linked) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(DOC_LINK_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }, [linked]);
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const create = useInvalidating(workspaceService.createDoc, ['docs']);
  const save = useInvalidating((args: { id: string; title: string; bodyMd: string }) => workspaceService.saveDoc(args.id, { title: args.title, bodyMd: args.bodyMd }), ['docs', 'doc']);
  const archive = useInvalidating(workspaceService.archiveDoc, ['docs']);

  const loadedKey = doc.data ? `${doc.data.id}:${doc.data.updatedAt}` : null;
  if (loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    if (doc.data) {
      setTitle(doc.data.title);
      setBody(doc.data.bodyMd);
    }
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-b border-line p-3 md:border-b-0 md:border-r">
        <button type="button" className="mb-3 w-full rounded bg-accent px-3 py-1.5 text-sm text-white" onClick={() => create.mutate({ title: t('untitled'), bodyMd: '' }, { onSuccess: (created) => setSelected(created.id) })}>
          {t('new')}
        </button>
        {docs.data?.length === 0 ? <p className="text-sm text-muted">{t('empty')}</p> : null}
        <DocTree nodes={buildDocTree(docs.data ?? [])} selected={selected} onSelect={setSelected} onAddChild={(parentId) => create.mutate({ title: t('untitled'), bodyMd: '', parentId }, { onSuccess: (created) => setSelected(created.id) })} />
      </aside>
      <section className="p-4">
        {!selected ? <p className="text-sm text-muted">{t('pick')}</p> : null}
        {selected && doc.data ? (
          <div className="mx-auto max-w-4xl space-y-3">
            <input aria-label={t('titleField')} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent text-2xl font-semibold outline-none" />
            <DocEditor value={body} onChange={setBody} />
            <div className="flex gap-2">
              <button type="button" disabled={!title.trim() || save.isPending} className="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50" onClick={() => save.mutate({ id: selected, title, bodyMd: body })}>
                {t('save')}
              </button>
              <button
                type="button"
                className="rounded border border-line px-3 py-1.5 text-sm"
                onClick={() => {
                  archive.mutate(selected);
                  setSelected(null);
                }}
              >
                {t('archive')}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
