'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMembers } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { formatShortDay } from '@/lib/calendar-day';
import { formatInstantDay } from './task-helpers';
import { TABLE_COLUMNS, TableColumn } from './table.constants';
import { sortTasks } from './table-sort';
import { Task } from '@/types/api.types';
import { useStatusLabel } from '@/hooks/use-status-label';

export function TaskTableView({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('table');
  const tp = useTranslations('tasks');
  const locale = useLocale();
  const members = useMembers();
  const openTask = useUiStore((s) => s.openTask);
  const statusLabel = useStatusLabel();
  const [sort, setSort] = useState<{ column: TableColumn; direction: 1 | -1 }>({ column: 'updatedAt', direction: -1 });
  const sorted = useMemo(() => sortTasks(tasks, sort.column, sort.direction), [tasks, sort]);
  const nameOf = (id: string) => members.data?.find((m) => m.id === id)?.name ?? '';
  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-panel text-xs uppercase text-muted">
          <tr>
            {TABLE_COLUMNS.map((column) => (
              <th key={column} scope="col" aria-sort={sort.column === column ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'} className="px-3 py-2">
                <button type="button" onClick={() => setSort((s) => ({ column, direction: s.column === column ? (s.direction === 1 ? -1 : 1) : 1 }))}>
                  {t(`columns.${column}`)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr key={task.id} className="cursor-pointer border-t border-line hover:bg-panel2" onClick={() => openTask(task.id)}>
              <td className="max-w-xs truncate px-3 py-2">{task.title}</td>
              <td className="px-3 py-2">{statusLabel(task.status)}</td>
              <td className="px-3 py-2">{task.priority ? tp(`priority.${task.priority}`) : ''}</td>
              <td className="px-3 py-2">{task.assigneeIds.map(nameOf).join(', ')}</td>
              <td className="px-3 py-2">{formatShortDay(task.dueDate, locale)}</td>
              <td className="px-3 py-2">{task.points ?? ''}</td>
              <td className="px-3 py-2">{formatInstantDay(task.updatedAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
