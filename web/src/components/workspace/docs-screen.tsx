'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { MarkdownView } from '@/components/common/markdown-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useDoc, useDocs, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { DocSaveInput } from '@/types/workspace.types';
import { DocEditor } from './doc-editor';
import { DocTree } from './doc-tree';
import { buildDocTree } from './docs.helpers';
import { DOC_LINK_PARAM } from './docs.constants';
import { DocBodySkeleton, DocsSkeleton } from './screen-skeletons';
import { SCREEN_PRIMARY_BUTTON_CLASS, SCREEN_SECONDARY_BUTTON_CLASS } from './screens.constants';

export function DocsScreen() {
  const t = useTranslations('docs');
  const tu = useTranslations('ui');
  const docs = useDocs();
  const { canWrite } = useCapabilities();
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
  const [archiving, setArchiving] = useState(false);
  const create = useInvalidating(workspaceService.createDoc, ['docs'], 'docCreateFailed');
  const save = useInvalidating((args: DocSaveInput) => workspaceService.saveDoc(args.id, { title: args.title, bodyMd: args.bodyMd }), ['docs', 'doc'], 'docSaveFailed');
  const archive = useInvalidating(workspaceService.archiveDoc, ['docs']);
  const createDoc = (parentId?: string) => create.mutate({ title: t('untitled'), bodyMd: '', ...(parentId ? { parentId } : {}) }, { onSuccess: (created) => setSelected(created.id) });

  const loadedKey = doc.data ? `${doc.data.id}:${doc.data.updatedAt}` : null;
  if (loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    if (doc.data) {
      setTitle(doc.data.title);
      setBody(doc.data.bodyMd);
    }
  }

  if (docs.isLoading) return <DocsSkeleton />;

  const noDocs = docs.data?.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 pt-4 md:px-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          action={
            canWrite ? (
              <button type="button" disabled={create.isPending} className={SCREEN_PRIMARY_BUTTON_CLASS} onClick={() => createDoc()}>
                {t('new')}
              </button>
            ) : null
          }
        />
      </div>
      {docs.isError ? <ErrorState title={tu('loadError')} onRetry={docs.refetch} /> : null}
      {noDocs ? <EmptyState title={t('empty')} hint={t(canWrite ? 'emptyHint' : 'emptyHintReadOnly')} /> : null}
      {docs.data && !noDocs ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside aria-label={t('tree')} className={`${selected ? 'hidden md:block' : ''} min-w-0 p-3 md:border-r md:border-line`}>
            <DocTree nodes={buildDocTree(docs.data)} selected={selected} onSelect={setSelected} onAddChild={canWrite ? (parentId) => createDoc(parentId) : undefined} />
          </aside>
          <section className={`${selected ? 'block' : 'hidden md:block'} min-w-0 p-4`}>
            {selected ? (
              <button type="button" onClick={() => setSelected(null)} className="mb-3 flex items-center gap-1 rounded px-1 text-sm text-muted hover:text-fg md:hidden">
                <ChevronLeft size={16} aria-hidden="true" />
                {t('back')}
              </button>
            ) : null}
            {!selected ? <p className="text-sm text-muted">{t(canWrite ? 'pick' : 'pickOnly')}</p> : null}
            {selected && doc.isLoading ? <DocBodySkeleton /> : null}
            {selected && doc.isError ? <ErrorState title={tu('loadError')} onRetry={doc.refetch} /> : null}
            {selected && doc.data && !canWrite ? (
              <article className="mx-auto max-w-4xl space-y-3">
                <h2 className="break-words text-2xl font-semibold">{doc.data.title}</h2>
                <MarkdownView source={doc.data.bodyMd} />
              </article>
            ) : null}
            {selected && doc.data && canWrite ? (
              <div className="mx-auto max-w-4xl space-y-3">
                <input aria-label={t('titleField')} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded bg-transparent text-2xl font-semibold" />
                <DocEditor value={body} onChange={setBody} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!title.trim() || save.isPending} className={SCREEN_PRIMARY_BUTTON_CLASS} onClick={() => save.mutate({ id: selected, title, bodyMd: body })}>
                    {t('save')}
                  </button>
                  <button type="button" className={SCREEN_SECONDARY_BUTTON_CLASS} onClick={() => setArchiving(true)}>
                    {t('archive')}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
      <ConfirmDialog
        open={archiving && selected !== null}
        title={t('archiveTitle')}
        message={t('confirmArchive', { name: doc.data?.title ?? '' })}
        confirmLabel={t('archive')}
        onConfirm={async () => {
          if (!selected) return;
          await archive.mutateAsync(selected);
          setSelected(null);
        }}
        onClose={() => setArchiving(false)}
      />
    </div>
  );
}
