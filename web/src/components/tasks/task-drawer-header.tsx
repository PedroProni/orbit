'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ChevronDown, ChevronUp, Link2, Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { TaskWatchersBell } from './task-watchers-bell';
import { BreadcrumbPart, TaskDrawerHeaderProps } from './task-drawer-header.types';
import { ICON_BUTTON_CLASS } from './task-drawer-header.constants';

export function TaskDrawerHeader({ task, space, siblings, readOnly, people, onToggleWatcher }: TaskDrawerHeaderProps) {
  const t = useTranslations('drawer');
  const openTask = useUiStore((s) => s.openTask);
  const favorite = useFavoritesStore((s) => s.tasks.some((item) => item.id === task.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleTask);
  const renameFavorite = useFavoritesStore((s) => s.renameTask);
  useEffect(() => renameFavorite({ id: task.id, title: task.title }), [renameFavorite, task.id, task.title]);
  const list = space.lists.find((item) => item.id === task.listId);
  const folder = list?.folderId ? space.folders.find((item) => item.id === list.folderId) : undefined;
  const parts: BreadcrumbPart[] = [{ key: 'space', label: space.name }, ...(folder ? [{ key: 'folder', label: folder.name }] : []), ...(list ? [{ key: 'list', label: list.name }] : [])];
  const index = siblings.findIndex((item) => item.id === task.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  const share = () => {
    void navigator.clipboard?.writeText(`${window.location.origin}/t/${task.id}`);
    useToastStore.getState().push('info', 'linkCopied');
  };
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 text-[13px]">
      <div className="flex shrink-0 items-center">
        <button type="button" aria-label={t('previousTask')} title={previous?.title} disabled={!previous} onClick={() => previous && openTask(previous.id)} className={ICON_BUTTON_CLASS}>
          <ChevronUp size={15} />
        </button>
        <button type="button" aria-label={t('nextTask')} title={next?.title} disabled={!next} onClick={() => next && openTask(next.id)} className={ICON_BUTTON_CLASS}>
          <ChevronDown size={15} />
        </button>
      </div>
      <nav aria-label={t('breadcrumb')} className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-muted">
          {parts.map((part, position) => (
            <li key={part.key} className={cn('flex min-w-0 items-center gap-1', position < parts.length - 1 && 'hidden sm:flex')}>
              {position > 0 ? <span aria-hidden="true">/</span> : null}
              <Link href={`/lists/${task.listId}`} onClick={() => openTask(null)} className={cn('truncate rounded px-1 py-0.5 transition-colors hover:bg-panel2 hover:text-fg', position === parts.length - 1 && 'text-fg')}>
                {part.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" aria-label={t('shareTask')} title={t('shareTask')} onClick={share} className={ICON_BUTTON_CLASS}>
          <Link2 size={15} />
        </button>
        <button
          type="button"
          aria-label={favorite ? t('unfavoriteTask') : t('favoriteTask')}
          aria-pressed={favorite}
          title={favorite ? t('unfavoriteTask') : t('favoriteTask')}
          onClick={() => toggleFavorite({ id: task.id, title: task.title })}
          className={cn(ICON_BUTTON_CLASS, favorite && 'text-amber-400 hover:text-amber-400')}
        >
          <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        {readOnly ? null : <TaskWatchersBell people={people} selected={task.watcherIds} onToggle={onToggleWatcher} />}
        <button type="button" aria-label={t('close')} onClick={() => openTask(null)} className={ICON_BUTTON_CLASS}>
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
