'use client';

import { Folder, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { spaceColor, spaceInitial } from '@/components/shell/sidebar.helpers';
import { ADMIN_ICON_BUTTON_CLASS, ADMIN_PANEL_CLASS } from './admin.constants';
import { SpaceCardProps } from './admin.types';
import { ListRow } from './list-row';

export function SpaceCard({ space, actions }: SpaceCardProps) {
  const t = useTranslations('admin.spaces');
  const loose = space.lists.filter((list) => !list.folderId);
  return (
    <section aria-label={space.name} className={ADMIN_PANEL_CLASS}>
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white" style={{ backgroundColor: spaceColor(space.name) }}>
          {spaceInitial(space.name)}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{space.name}</h2>
        <span className="shrink-0 text-xs text-muted">{t('listCount', { count: space.lists.length })}</span>
        <DropdownMenu
          label={t('actionsFor', { name: space.name })}
          className={ADMIN_ICON_BUTTON_CLASS}
          items={[
            {
              key: 'list',
              label: t('newList'),
              onSelect: () => actions.newList(space, 'list'),
            },
            {
              key: 'sprint',
              label: t('newSprint'),
              onSelect: () => actions.newList(space, 'sprint'),
            },
            {
              key: 'folder',
              label: t('newFolder'),
              onSelect: () => actions.newFolder(space),
            },
            {
              key: 'rename',
              label: t('rename'),
              onSelect: () => actions.rename({ kind: 'space', space }),
            },
          ]}
        >
          <MoreHorizontal size={14} />
        </DropdownMenu>
      </header>
      <div className="px-2 py-1">
        {space.lists.length === 0 && space.folders.length === 0 ? <p className="px-2 py-2 text-xs text-muted">{t('emptySpace')}</p> : null}
        {loose.length > 0 ? (
          <ul className="divide-y divide-line">
            {loose.map((list) => (
              <ListRow key={list.id} space={space} list={list} actions={actions} />
            ))}
          </ul>
        ) : null}
        {space.folders.map((folder) => {
          const lists = space.lists.filter((list) => list.folderId === folder.id);
          return (
            <div key={folder.id} className="mt-1">
              <div className="flex items-center gap-2 py-1.5 pl-2 pr-1">
                <Folder size={14} className="shrink-0 text-muted" />
                <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{folder.name}</h3>
                <span className="shrink-0 text-xs text-muted">{t('listCount', { count: lists.length })}</span>
                <DropdownMenu
                  label={t('actionsFor', { name: folder.name })}
                  className={ADMIN_ICON_BUTTON_CLASS}
                  items={[
                    {
                      key: 'list',
                      label: t('newList'),
                      onSelect: () => actions.newList(space, 'list', folder.id),
                    },
                    {
                      key: 'sprint',
                      label: t('newSprint'),
                      onSelect: () => actions.newList(space, 'sprint', folder.id),
                    },
                    {
                      key: 'rename',
                      label: t('rename'),
                      onSelect: () => actions.rename({ kind: 'folder', space, folder }),
                    },
                    {
                      key: 'delete',
                      label: t('deleteFolderTitle'),
                      danger: true,
                      onSelect: () => actions.remove({ kind: 'folder', space, folder }),
                    },
                  ]}
                >
                  <MoreHorizontal size={14} />
                </DropdownMenu>
              </div>
              <ul className="ml-4 divide-y divide-line border-l border-line">
                {lists.length === 0 ? <li className="px-2 py-1.5 text-xs text-muted">{t('emptyFolder')}</li> : null}
                {lists.map((list) => (
                  <ListRow key={list.id} space={space} list={list} actions={actions} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
