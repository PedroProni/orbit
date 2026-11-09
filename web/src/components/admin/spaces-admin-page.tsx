'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateFolder, useCreateList, useCreateSpace, useDeleteFolder, useDeleteList, useRenameFolder, useUpdateList, useUpdateSpace } from '@/hooks/use-admin';
import { useHierarchy } from '@/hooks/use-orbit';
import { ListInput } from '@/services/admin.types';
import { ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { ConfirmRequest, ListDraft, NameRequest, StructureActions, StructureTarget } from './admin.types';
import { AdminPageFrame } from './admin-page-frame';
import { ConfirmDialog } from './confirm-dialog';
import { ListDialog } from './list-dialog';
import { NameDialog } from './name-dialog';
import { SpaceCard } from './space-card';

export function SpacesAdminPage() {
  const t = useTranslations('admin');
  const hierarchy = useHierarchy();
  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const createList = useCreateList();
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const [naming, setNaming] = useState<NameRequest | null>(null);
  const [draft, setDraft] = useState<ListDraft | null>(null);
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null);

  const newSpace = () =>
    setNaming({
      title: t('spaces.newSpace'),
      initial: '',
      submitLabel: t('create'),
      submit: (name) => createSpace.mutateAsync(name),
    });

  const rename = (target: StructureTarget) => {
    if (target.kind === 'space')
      setNaming({
        title: t('spaces.renameSpaceTitle'),
        initial: target.space.name,
        submitLabel: t('save'),
        submit: (name) => updateSpace.mutateAsync({ id: target.space.id, patch: { name } }),
      });
    if (target.kind === 'folder')
      setNaming({
        title: t('spaces.renameFolderTitle'),
        initial: target.folder.name,
        submitLabel: t('save'),
        submit: (name) => renameFolder.mutateAsync({ id: target.folder.id, name }),
      });
  };

  const remove = (target: StructureTarget) => {
    if (target.kind === 'folder')
      setConfirming({
        title: t('spaces.deleteFolderTitle'),
        message: t('spaces.confirmDeleteFolder', { name: target.folder.name }),
        confirmLabel: t('delete'),
        confirm: () => deleteFolder.mutateAsync(target.folder.id),
      });
    if (target.kind === 'list')
      setConfirming({
        title: t('spaces.deleteListTitle'),
        message: t('spaces.confirmDeleteList', { name: target.list.name }),
        confirmLabel: t('delete'),
        confirm: () => deleteList.mutateAsync(target.list.id),
      });
  };

  const actions: StructureActions = {
    newFolder: (space) =>
      setNaming({
        title: t('spaces.newFolder'),
        initial: '',
        submitLabel: t('create'),
        submit: (name) => createFolder.mutateAsync({ spaceId: space.id, name }),
      }),
    newList: (space, kind, folderId = null) => setDraft({ space, list: null, kind, folderId }),
    editList: (space, list) => setDraft({ space, list, kind: list.kind, folderId: list.folderId }),
    rename,
    remove,
  };

  const submitList = (input: ListInput) => {
    if (!draft) return Promise.resolve();
    return draft.list ? updateList.mutateAsync({ id: draft.list.id, input }) : createList.mutateAsync({ spaceId: draft.space.id, input });
  };

  return (
    <AdminPageFrame
      title={t('sections.spaces')}
      subtitle={t('spaces.subtitle')}
      action={
        <button type="button" onClick={newSpace} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('spaces.newSpace')}
        </button>
      }
    >
      {hierarchy.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {hierarchy.isError ? <EmptyState title={t('loadError')} /> : null}
      {hierarchy.data?.length === 0 ? <EmptyState title={t('spaces.empty')} /> : null}
      <div className="space-y-4">
        {hierarchy.data?.map((space) => (
          <SpaceCard key={space.id} space={space} actions={actions} />
        ))}
      </div>
      <NameDialog open={naming !== null} title={naming?.title ?? ''} initial={naming?.initial ?? ''} submitLabel={naming?.submitLabel ?? ''} onSubmit={(name) => naming?.submit(name) ?? Promise.resolve()} onClose={() => setNaming(null)} />
      <ListDialog open={draft !== null} space={draft?.space ?? null} list={draft?.list ?? null} defaultKind={draft?.kind ?? 'list'} defaultFolderId={draft?.folderId ?? null} onSubmit={submitList} onClose={() => setDraft(null)} />
      <ConfirmDialog open={confirming !== null} title={confirming?.title ?? ''} message={confirming?.message ?? ''} confirmLabel={confirming?.confirmLabel ?? ''} onConfirm={() => confirming?.confirm() ?? Promise.resolve()} onClose={() => setConfirming(null)} />
    </AdminPageFrame>
  );
}
