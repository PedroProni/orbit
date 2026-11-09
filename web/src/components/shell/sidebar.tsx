'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { CircleCheck, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHierarchy } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useUiStore } from '@/stores/ui.store';
import { ADMIN_NAV_ITEMS, ALL_TASKS_NAV_ITEM, NAV_ITEMS } from './sidebar.constants';
import { ListLink, SpaceTree } from './sidebar-tree';
import { NewSpaceButton } from './new-space-button';
import { SidebarSkeleton } from './sidebar-skeleton';
import { WorkspaceSwitcher } from './workspace-switcher';

export function Sidebar() {
  const t = useTranslations('sidebar');
  const tn = useTranslations('nav');
  const params = useParams<{ listId?: string }>();
  const hierarchy = useHierarchy();
  const caps = useCapabilities();
  const favoriteIds = useFavoritesStore((s) => s.listIds);
  const favoriteTasks = useFavoritesStore((s) => s.tasks);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  const openTask = useUiStore((s) => s.openTask);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  useEffect(() => hydrateFavorites(), [hydrateFavorites]);
  const favorites = (hierarchy.data ?? []).flatMap((space) => space.lists).filter((list) => favoriteIds.includes(list.id));
  return (
    <nav aria-label={t('label')} className="h-full overflow-y-auto p-3">
      <WorkspaceSwitcher />
      <div className="mb-3 space-y-0.5">
        {[ALL_TASKS_NAV_ITEM, ...(caps.isGuest ? [] : NAV_ITEMS), ...(caps.canManageStructure ? ADMIN_NAV_ITEMS : [])].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-muted transition-colors hover:bg-panel2 hover:text-fg">
            <item.icon size={14} />
            {tn(item.key)}
          </Link>
        ))}
      </div>
      {favorites.length > 0 || favoriteTasks.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1 flex items-center gap-1.5 px-2 text-[11px] uppercase text-muted">
            <Star size={11} />
            {t('favorites')}
          </p>
          {favorites.map((list) => (
            <ListLink key={list.id} list={list} active={list.id === params.listId} />
          ))}
          {favoriteTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                openTask(task.id);
                toggleSidebar(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-muted transition-colors hover:bg-panel2 hover:text-fg"
            >
              <CircleCheck size={14} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{task.title}</span>
            </button>
          ))}
        </div>
      ) : null}
      <NewSpaceButton />
      {hierarchy.isLoading ? <SidebarSkeleton /> : null}
      {hierarchy.data?.length === 0 ? <p className="px-2 text-sm text-muted">{t('empty')}</p> : null}
      {hierarchy.data?.map((space) => (
        <SpaceTree key={space.id} space={space} activeId={params.listId} />
      ))}
    </nav>
  );
}
