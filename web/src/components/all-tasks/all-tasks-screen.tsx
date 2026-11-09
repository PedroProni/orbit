'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ALL_TASKS_KEY } from '@/config/app.constants';
import { useAllTasks, useHierarchy } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useStatusLabel } from '@/hooks/use-status-label';
import { cn } from '@/lib/cn';
import { loadViewDisplay, saveViewDisplay } from '@/lib/view-display-storage';
import { TaskPatch } from '@/services/orbit.types';
import { useComposerStore } from '@/stores/composer.store';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { useSelectionStore } from '@/stores/selection.store';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';
import { Task } from '@/types/api.types';
import { BulkBar } from '@/components/tasks/bulk-bar';
import { TaskToolbar } from '@/components/tasks/task-toolbar';
import { BoardSkeleton, ListSkeleton, PanelSkeleton } from '@/components/tasks/task-skeletons';
import { VIEW_ICONS } from '@/components/tasks/view-tabs.constants';
import { EmptyState } from '@/components/ui/empty-state';
import { ALL_TASKS_VIEWS } from './all-tasks.constants';
import { allTasksSpace, defaultTarget, listNameOf, spaceOfTask } from './all-tasks.helpers';

const KanbanBoard = dynamic(() => import('@/components/tasks/kanban-board').then((m) => m.KanbanBoard), { loading: () => <BoardSkeleton /> });
const TaskTableView = dynamic(() => import('@/components/tasks/task-table-view').then((m) => m.TaskTableView), { loading: () => <PanelSkeleton /> });

export function AllTasksScreen() {
  const t = useTranslations('allTasks');
  const tt = useTranslations('tasks');
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const filters = useUiStore((s) => s.filters);
  const display = useUiStore((s) => s.display);
  const hierarchy = useHierarchy();
  const { isGuest } = useCapabilities();
  const statusLabel = useStatusLabel();
  const recent = useRecentListsStore((s) => s.listIds);
  const hydrateRecent = useRecentListsStore((s) => s.hydrate);
  const filterKey = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key: filterKey, pages: 1 });
  const pages = paging.key === filterKey ? paging.pages : 1;
  const tasks = useAllTasks(filters, pages);
  const ready = useRef(false);
  const spaces = hierarchy.data ?? [];
  const space = allTasksSpace(spaces);
  const shown = view === 'table' ? 'table' : 'board';

  useEffect(() => {
    const ui = useUiStore.getState();
    useUiStore.setState({ display: loadViewDisplay(ALL_TASKS_KEY), activeViewId: null, filters: ui.activeViewId ? EMPTY_FILTERS : ui.filters, view: ui.view === 'table' ? 'table' : 'board' });
    useComposerStore.getState().close();
    useSelectionStore.getState().clear();
    hydrateRecent();
    ready.current = true;
    return () => {
      ready.current = false;
    };
  }, [hydrateRecent]);

  useEffect(() => {
    if (ready.current) saveViewDisplay(ALL_TASKS_KEY, display);
  }, [display]);

  const refuseDrop = (task: Task, patch: TaskPatch) => {
    if (!patch.status) return null;
    const home = spaceOfTask(spaces, task);
    if (home?.statuses.some((status) => status.name === patch.status)) return null;
    return { key: 'statusMissing', values: { status: statusLabel(patch.status), space: home?.name ?? '' } };
  };
  const targetFor = (column: string) => defaultTarget(spaces, display.groupBy === 'status' ? column : undefined, recent);
  const originOf = (task: Task) => listNameOf(spaces, task);
  const loaded = tasks.data?.data.length ?? 0;
  const total = tasks.data?.total ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3">
        <h1 className="min-h-7 text-xl font-semibold">{t('title')}</h1>
      </div>
      <div role="tablist" aria-label={t('views')} className="flex items-center gap-1 border-b border-line px-4 pt-2">
        {ALL_TASKS_VIEWS.map((mode) => {
          const Icon = VIEW_ICONS[mode];
          return (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={shown === mode}
              onClick={() => setView(mode)}
              className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-2 py-1.5 text-sm transition-colors', shown === mode ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}
            >
              <Icon size={14} />
              {tt(`views.${mode}`)}
            </button>
          );
        })}
      </div>
      <TaskToolbar listId={null} space={hierarchy.data ? space : undefined} readOnly={isGuest} />
      {tasks.data ? (
        <div className="flex shrink-0 items-center gap-2 px-4 pt-2 text-xs text-muted">
          <span>{t('showing', { loaded, total })}</span>
          {loaded < total ? (
            <button type="button" disabled={tasks.isFetching} onClick={() => setPaging({ key: filterKey, pages: pages + 1 })} className="rounded border border-line px-2 py-0.5 text-fg transition-colors hover:bg-panel2 disabled:opacity-50">
              {tasks.isFetching ? t('loadingMore') : t('loadMore')}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className={cn('min-h-0 flex-1 p-4', shown === 'board' && tasks.data ? 'overflow-hidden pb-2' : 'overflow-auto')}>
        {tasks.isLoading || !hierarchy.data ? shown === 'board' ? <BoardSkeleton /> : <ListSkeleton /> : null}
        {tasks.data && hierarchy.data ? (
          <div key={shown} className={cn('anim-fade-in', shown === 'board' && 'h-full')}>
            {shown === 'board' ? (
              <KanbanBoard tasks={tasks.data.data} space={space} listId={ALL_TASKS_KEY} readOnly={isGuest} refuseDrop={refuseDrop} targetFor={targetFor} originOf={originOf} />
            ) : (
              <TaskTableView tasks={tasks.data.data} statusesOf={(task) => spaceOfTask(spaces, task)?.statuses ?? []} readOnly={isGuest} />
            )}
            {shown === 'table' && loaded === 0 ? <EmptyState title={tt('empty')} /> : null}
          </div>
        ) : null}
      </div>
      {hierarchy.data && !isGuest ? <BulkBar space={space} /> : null}
    </div>
  );
}
