'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListDialog } from '@/components/admin/list-dialog';
import { NameDialog } from '@/components/admin/name-dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useCreateFolder, useCreateList } from '@/hooks/use-admin';
import { useCapabilities } from '@/hooks/use-capabilities';
import { SPACE_CREATE_TRIGGER_CLASS } from './sidebar.constants';
import { SidebarListDraft, SpaceCreateMenuProps } from './sidebar.types';

export function SpaceCreateMenu({ space }: SpaceCreateMenuProps) {
  const t = useTranslations('admin');
  const caps = useCapabilities();
  const createFolder = useCreateFolder();
  const createList = useCreateList();
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState<SidebarListDraft>(null);

  if (!caps.canManageStructure) return null;

  return (
    <>
      <DropdownMenu
        label={t('sidebar.createIn', { name: space.name })}
        className={SPACE_CREATE_TRIGGER_CLASS}
        items={[
          {
            key: 'list',
            label: t('spaces.newList'),
            onSelect: () => setDraft({ kind: 'list' }),
          },
          {
            key: 'sprint',
            label: t('spaces.newSprint'),
            onSelect: () => setDraft({ kind: 'sprint' }),
          },
          {
            key: 'folder',
            label: t('spaces.newFolder'),
            onSelect: () => setNaming(true),
          },
        ]}
      >
        <Plus size={13} />
      </DropdownMenu>
      <NameDialog open={naming} title={t('spaces.newFolder')} submitLabel={t('create')} onSubmit={(name) => createFolder.mutateAsync({ spaceId: space.id, name })} onClose={() => setNaming(false)} />
      <ListDialog open={draft !== null} space={space} list={null} defaultKind={draft?.kind ?? 'list'} defaultFolderId={null} onSubmit={(input) => createList.mutateAsync({ spaceId: space.id, input })} onClose={() => setDraft(null)} />
    </>
  );
}
