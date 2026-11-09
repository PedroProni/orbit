'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useHierarchy, useTasks } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { cn } from '@/lib/cn';
import { loadViewDisplay, saveViewDisplay } from '@/lib/view-display-storage';
import { useComposerStore } from '@/stores/composer.store';
import { useSelectionStore } from '@/stores/selection.store';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';
import { findSpaceByList } from './task-helpers';
import { TASK_LINK_PARAM } from './tasks.constants';
import { TaskListView } from './task-list-view';
import { ListHeader } from './list-header';
import { ViewTabs } from './view-tabs';
import { TaskToolbar } from './task-toolbar';
import { BulkBar } from './bulk-bar';
import { BoardSkeleton, ListSkeleton, PanelSkeleton } from './task-skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ListScreenProps } from './list-screen.types';

const KanbanBoard = dynamic(() => import('./kanban-board').then((m) => m.KanbanBoard), { loading: () => <BoardSkeleton /> });
const TaskTableView = dynamic(() => import('./task-table-view').then((m) => m.TaskTableView), { loading: () => <PanelSkeleton /> });
const CalendarView = dynamic(() => import('./calendar-view').then((m) => m.CalendarView), { loading: () => <PanelSkeleton height={420} /> });
const TimelineView = dynamic(() => import('./timeline-view').then((m) => m.TimelineView), { loading: () => <PanelSkeleton height={320} /> });
const WorkloadView = dynamic(() => import('./workload-view').then((m) => m.WorkloadView), { loading: () => <PanelSkeleton /> });

export function ListScreen({ listId }: ListScreenProps) {
  const t = useTranslations('tasks');
  const view = useUiStore((s) => s.view);
  const filters = useUiStore((s) => s.filters);
  const display = useUiStore((s) => s.display);
  const activeViewId = useUiStore((s) => s.activeViewId);
  const hierarchy = useHierarchy();
  const space = findSpaceByList(hierarchy.data, listId);
  const list = space?.lists.find((l) => l.id === listId);
  const tasks = useTasks(listId, filters);
  const { isGuest } = useCapabilities();
  const openTask = useUiStore((s) => s.openTask);
  const loadedList = useRef<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const linked = url.searchParams.get(TASK_LINK_PARAM);
    if (!linked) return;
    openTask(linked);
    url.searchParams.delete(TASK_LINK_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }, [listId, openTask]);

  useEffect(() => {
    const ui = useUiStore.getState();
    loadedList.current = listId;
    useUiStore.setState({ display: loadViewDisplay(listId), activeViewId: null, filters: ui.activeViewId ? EMPTY_FILTERS : ui.filters });
    useComposerStore.getState().close();
    useSelectionStore.getState().clear();
    return () => {
      loadedList.current = null;
    };
  }, [listId]);

  useEffect(() => {
    if (loadedList.current === listId && !activeViewId) saveViewDisplay(listId, display);
  }, [listId, display, activeViewId]);

  if (hierarchy.data && !space) return <p className="p-6 text-sm text-muted">{t('notFound')}</p>;

  return (
    <div className="flex h-full flex-col">
      <ListHeader space={space} list={list} />
      <ViewTabs listId={listId} />
      <TaskToolbar listId={listId} space={space} readOnly={isGuest} />
      <div className={cn('min-h-0 flex-1 p-4', view === 'board' && tasks.data ? 'overflow-hidden pb-2' : 'overflow-auto')}>
        {tasks.isLoading ? view === 'board' ? <BoardSkeleton /> : <ListSkeleton /> : null}
        {tasks.data ? (
          <div key={view} className={cn('anim-fade-in', view === 'board' && 'h-full')}>
            {space && tasks.data && view === 'list' ? <TaskListView tasks={tasks.data.data} space={space} listId={listId} readOnly={isGuest} /> : null}
            {space && tasks.data && view === 'board' ? <KanbanBoard tasks={tasks.data.data} space={space} listId={listId} readOnly={isGuest} /> : null}
            {space && tasks.data && view === 'table' ? <TaskTableView tasks={tasks.data.data} statusesOf={() => space.statuses} readOnly={isGuest} /> : null}
            {tasks.data && view === 'calendar' ? <CalendarView tasks={tasks.data.data} /> : null}
            {tasks.data && view === 'timeline' ? <TimelineView tasks={tasks.data.data} /> : null}
            {tasks.data && view === 'workload' ? <WorkloadView tasks={tasks.data.data} /> : null}
            {tasks.data && tasks.data.data.length === 0 && view !== 'board' ? <EmptyState title={t('empty')} hint={isGuest ? undefined : t('emptyHint')} /> : null}
          </div>
        ) : null}
      </div>
      {space && !isGuest ? <BulkBar space={space} /> : null}
    </div>
  );
}
