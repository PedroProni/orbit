'use client';

import { useMembers } from '@/hooks/use-orbit';
import { useComposerStore } from '@/stores/composer.store';
import { useUiStore } from '@/stores/ui.store';
import { sortTasks } from './board-groups';
import { groupAnchor } from './task-group.helpers';
import { groupByStatus } from './task-helpers';
import { TaskGroup } from './task-group';
import { TaskListViewProps } from './task-list-view.types';

export function TaskListView({ tasks, space, listId, readOnly = false }: TaskListViewProps) {
  const members = useMembers();
  const display = useUiStore((s) => s.display);
  const anchor = useComposerStore((s) => s.anchor);
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name }));
  const groups = groupByStatus(
    tasks.filter((x) => !x.parentId),
    space.statuses.map((s) => s.name),
  );
  return (
    <div className="space-y-5">
      {space.statuses.map((status) => {
        const items = groups[status.name] ?? [];
        if (items.length === 0 && anchor !== groupAnchor(status.name)) return null;
        return <TaskGroup key={status.name} status={status} tasks={sortTasks(items, display.sortBy, display.sortDirection)} people={people} space={space} listId={listId} readOnly={readOnly} />;
      })}
    </div>
  );
}
