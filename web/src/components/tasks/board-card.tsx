'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CalendarDays, GitBranch, Hash, ListChecks } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AvatarStack } from '@/components/common/avatar';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { formatShortDay, isOverdueDay, todayDay } from '@/lib/calendar-day';
import { cn } from '@/lib/cn';
import { useSelectionStore } from '@/stores/selection.store';
import { useUiStore } from '@/stores/ui.store';
import { BOARD_DRAG_SEPARATOR } from './board.constants';
import { BoardDragData } from './board.types';
import { BoardCardProps, CardBodyProps } from './board-card.types';
import { isTempTask } from './task-composer.helpers';

export function CardBody({ task, tasks, people, fields, origin }: CardBodyProps) {
  const t = useTranslations('tasks');
  const locale = useLocale();
  const subtasks = tasks.filter((x) => x.parentId === task.id).length;
  const items = task.checklists.flatMap((c) => c.items);
  const [today] = useState(todayDay);
  const overdue = !task.dateClosed && isOverdueDay(task.dueDate, today);
  const assignees = people.filter((p) => task.assigneeIds.includes(p.id));
  const shows = (field: CardBodyProps['fields'][number]) => fields.includes(field);
  return (
    <>
      {origin ? <p className="truncate pr-5 text-[11px] text-muted">{origin}</p> : null}
      <p className={cn('line-clamp-3 break-words font-medium leading-snug', !origin && 'pr-5')}>{task.title}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {shows('assignees') && assignees.length > 0 ? <AvatarStack people={assignees} /> : null}
        {shows('priority') ? (
          <span role="img" aria-label={task.priority ? t(`priority.${task.priority}`) : t('priority.none')} className="flex">
            <PriorityFlag priority={task.priority} size={13} />
          </span>
        ) : null}
        {shows('dueDate') && task.dueDate ? (
          <span className={cn('flex items-center gap-1', overdue && 'text-danger')}>
            <CalendarDays size={12} />
            {formatShortDay(task.dueDate, locale)}
          </span>
        ) : null}
        {shows('points') && task.points !== null ? (
          <span className="flex items-center gap-1" title={t('columns.points')}>
            <Hash size={12} />
            {task.points}
          </span>
        ) : null}
        {shows('subtasks') && subtasks > 0 ? (
          <span className="flex items-center gap-1" title={t('subtasks')}>
            <GitBranch size={12} />
            {subtasks}
          </span>
        ) : null}
        {shows('checklist') && items.length > 0 ? (
          <span className="flex items-center gap-1" title={t('checklist')}>
            <ListChecks size={12} />
            {items.filter((i) => i.resolved).length}/{items.length}
          </span>
        ) : null}
      </div>
      {shows('tags') && task.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-accentsoft px-1.5 py-px text-[11px] text-fg">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function BoardCard({ task, tasks, people, fields, origin, column, lane, readOnly }: BoardCardProps) {
  const tb = useTranslations('board');
  const openTask = useUiStore((s) => s.openTask);
  const temp = isTempTask(task);
  const selected = useSelectionStore((s) => s.ids.includes(task.id));
  const anySelected = useSelectionStore((s) => s.ids.length > 0);
  const toggle = useSelectionStore((s) => s.toggle);
  const data: BoardDragData = { taskId: task.id, column, lane };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: [task.id, column, lane].join(BOARD_DRAG_SEPARATOR), disabled: readOnly || temp, data });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-busy={temp || undefined}
      data-task-card={task.id}
      onClick={temp ? undefined : () => openTask(task.id)}
      className={cn(
        'group relative space-y-1.5 rounded-lg border bg-panel2 p-2 text-[13px] shadow-sm transition-[transform,box-shadow,border-color,opacity] duration-150',
        temp ? 'anim-pop-in cursor-progress opacity-70' : 'hover:-translate-y-0.5 hover:border-accent hover:shadow-md',
        !temp && (readOnly ? 'cursor-pointer' : 'cursor-grab'),
        isDragging ? 'border-dashed border-accent opacity-40' : selected ? 'border-accent' : 'border-line',
      )}
    >
      {readOnly || temp ? null : (
        <input
          type="checkbox"
          aria-label={tb('select', { title: task.title })}
          checked={selected}
          onChange={() => toggle(task.id)}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn('absolute right-1.5 top-1.5 transition-opacity pointer-coarse:opacity-100 group-hover:opacity-100 focus:opacity-100', selected || anySelected ? 'opacity-100' : 'opacity-0')}
        />
      )}
      <CardBody task={task} tasks={tasks} people={people} fields={fields} origin={origin} />
    </div>
  );
}
