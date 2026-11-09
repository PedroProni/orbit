'use client';

import { SyntheticEvent, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMembers, useUpdateTask } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { formatShortDay, isOverdueDay, todayDay } from '@/lib/calendar-day';
import { cn } from '@/lib/cn';
import { formatInstantDay, statusColor } from './task-helpers';
import { TABLE_CELL_CLASS, TABLE_COLUMN_WIDTH, TABLE_COLUMNS, TABLE_TAGS_SHOWN, TableColumn } from './table.constants';
import { sortTasks } from './table-sort';
import { TableStatusCell } from './table-status-cell';
import { TableAssigneeCell, TablePriorityCell } from './table-cells';
import { TagChips } from './tag-chips';
import { TaskIndicators } from './task-indicators';
import { TaskTableViewProps } from './task-table-view.types';

export function TaskTableView({ tasks, statusesOf, readOnly }: TaskTableViewProps) {
  const t = useTranslations('table');
  const locale = useLocale();
  const members = useMembers();
  const openTask = useUiStore((s) => s.openTask);
  const update = useUpdateTask();
  const [today] = useState(todayDay);
  const [sort, setSort] = useState<{ column: TableColumn; direction: 1 | -1 }>({ column: 'updatedAt', direction: -1 });
  const sorted = useMemo(() => sortTasks(tasks, sort.column, sort.direction), [tasks, sort]);
  const subtaskCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) if (task.parentId) counts.set(task.parentId, (counts.get(task.parentId) ?? 0) + 1);
    return counts;
  }, [tasks]);
  const peopleOf = (ids: string[]) => ids.map((id) => members.data?.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const header = (column: TableColumn) => (
    <th key={column} scope="col" aria-sort={sort.column === column ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'} className={cn(TABLE_CELL_CLASS, TABLE_COLUMN_WIDTH[column], 'font-medium')}>
      <button type="button" className="w-full truncate text-left hover:text-fg" onClick={() => setSort((s) => ({ column, direction: s.column === column ? (s.direction === 1 ? -1 : 1) : 1 }))}>
        {t(`columns.${column}`)}
      </button>
    </th>
  );
  const stop = (event: SyntheticEvent) => event.stopPropagation();
  return (
    <div className="max-h-full overflow-auto rounded border border-line">
      <table className="w-full min-w-[1400px] table-fixed border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-panel text-xs text-muted">
          <tr className="border-b border-line">
            <th scope="col" className={cn(TABLE_CELL_CLASS, TABLE_COLUMN_WIDTH.rowNumber, 'text-right font-medium')}>
              <span aria-hidden="true">#</span>
              <span className="sr-only">{t('columns.rowNumber')}</span>
            </th>
            {TABLE_COLUMNS.slice(0, 4).map(header)}
            {header('dueDate')}
            <th scope="col" className={cn(TABLE_CELL_CLASS, TABLE_COLUMN_WIDTH.tags, 'font-medium')}>
              {t('columns.tags')}
            </th>
            {header('points')}
            {header('updatedAt')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, index) => {
            const statuses = statusesOf(task);
            const current = statuses.find((status) => status.name === task.status);
            const overdue = !task.dateClosed && isOverdueDay(task.dueDate, today);
            return (
              <tr key={task.id} data-task-row={task.id} className="cursor-pointer border-b border-line transition-colors hover:bg-panel2" onClick={() => openTask(task.id)}>
                <td className={cn(TABLE_CELL_CLASS, 'text-right text-xs tabular-nums text-muted')}>{index + 1}</td>
                <td className={TABLE_CELL_CLASS}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border-2" style={{ borderColor: current ? statusColor(current) : 'var(--muted)' }} />
                    <span className="min-w-0 truncate">{task.title}</span>
                    <TaskIndicators task={task} subtasks={subtaskCount.get(task.id) ?? 0} checklist />
                  </span>
                </td>
                <td className={TABLE_CELL_CLASS} onClick={stop} onKeyDown={stop}>
                  <TableStatusCell statuses={statuses} value={task.status} readOnly={readOnly} onChange={(status) => update.mutate({ id: task.id, patch: { status } })} />
                </td>
                <td className={TABLE_CELL_CLASS} onClick={readOnly ? undefined : stop} onKeyDown={readOnly ? undefined : stop}>
                  <TablePriorityCell task={task} readOnly={readOnly} onChange={(priority) => update.mutate({ id: task.id, patch: { priority } })} />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <TableAssigneeCell people={peopleOf(task.assigneeIds)} />
                </td>
                <td className={cn(TABLE_CELL_CLASS, 'text-xs', overdue ? 'text-danger' : 'text-muted')} data-overdue={overdue || undefined}>
                  {formatShortDay(task.dueDate, locale)}
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <TagChips tags={task.tags} max={TABLE_TAGS_SHOWN} />
                </td>
                <td className={cn(TABLE_CELL_CLASS, 'text-xs text-muted')}>{task.points ?? ''}</td>
                <td className={cn(TABLE_CELL_CLASS, 'text-xs text-muted')}>{formatInstantDay(task.updatedAt, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
