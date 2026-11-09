'use client';

import { Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { useUiStore } from '@/stores/ui.store';
import { DisplayMenu } from './display-menu';
import { AssigneeFilter } from './assignee-filter';
import { FiltersBar } from './filters-bar';
import { ViewChanges } from './view-changes';
import { TaskToolbarProps } from './task-toolbar.types';

export function TaskToolbar({ listId, space, readOnly }: TaskToolbarProps) {
  const t = useTranslations('toolbar');
  const view = useUiStore((s) => s.view);
  const q = useUiStore((s) => s.filters.q);
  const setFilters = useUiStore((s) => s.setFilters);
  const showCreate = useCreateTaskStore((s) => s.show);
  return (
    <div className="border-b border-line px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <FiltersBar space={space} />
        <AssigneeFilter listId={listId} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {readOnly || !listId ? null : <ViewChanges listId={listId} />}
          {view === 'list' || view === 'board' ? <DisplayMenu space={space} /> : null}
          <label className="flex items-center gap-1.5 rounded border border-line bg-panel2 px-2 py-1 text-sm">
            <Search size={13} className="shrink-0 text-muted" />
            <input aria-label={listId ? t('search') : t('searchAll')} placeholder={listId ? t('search') : t('searchAll')} value={q} maxLength={200} onChange={(e) => setFilters({ q: e.target.value })} className="no-focus-ring w-28 min-w-0 bg-transparent outline-none sm:w-36" />
          </label>
          {readOnly || !space ? null : (
            <button type="button" data-shortcut="new-task" onClick={() => showCreate({ listId })} className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-sm text-white">
              <Plus size={14} />
              {t('newTask')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
