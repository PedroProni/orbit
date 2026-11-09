'use client';

import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { useComposerStore } from '@/stores/composer.store';
import { BOARD_DRAG_SEPARATOR } from './board.constants';
import { BoardDropData } from './board.types';
import { BoardCard } from './board-card';
import { BoardColumnProps } from './board-column.types';
import { boardAnchor, cellPresets, sortTasks, sumPoints } from './board-groups';
import { TaskComposer } from './task-composer';
import { PRIORITY_COLORS, NO_PRIORITY_COLOR } from './tasks.constants';
import { statusColor } from './task-helpers';
import { TaskPriority } from '@/types/api.types';

export function BoardColumn({ column, lane, display, total, all, people, listId, space, readOnly, fill, label, onToggleCollapse, target, originOf }: BoardColumnProps) {
  const t = useTranslations('tasks');
  const tb = useTranslations('board');
  const anchor = useComposerStore((s) => s.anchor);
  const open = useComposerStore((s) => s.open);
  const data: BoardDropData = { column: column.key, lane };
  const { setNodeRef, isOver } = useDroppable({ id: [lane, column.key].join(BOARD_DRAG_SEPARATOR), data });
  const name = label(column.key);
  const color = column.status ? statusColor(column.status) : display.groupBy === 'priority' ? (PRIORITY_COLORS[column.key as TaskPriority] ?? NO_PRIORITY_COLOR) : 'var(--muted)';
  const limit = display.wipLimits.find((item) => item.column === column.key)?.limit;
  const overLimit = limit !== undefined && total > limit;
  const collapsed = display.collapsedColumns.includes(column.key);
  const points = sumPoints(column.tasks);
  const here = boardAnchor(lane, column.key);
  const composing = anchor === here;
  const composerList = target === undefined ? { listId, space } : target;
  const canAdd = !readOnly && !!composerList;
  const startComposer = () => composerList && open(here, cellPresets(display.groupBy, display.swimlane, column.key, lane, composerList.space));
  const tasks = sortTasks(column.tasks, display.sortBy, display.sortDirection);

  if (collapsed && !composing) {
    return (
      <section
        ref={setNodeRef}
        aria-label={name}
        data-collapsed="true"
        className={cn('flex w-10 shrink-0 flex-col items-center gap-2 self-stretch rounded-lg border bg-panel py-2 transition-colors duration-150', isOver ? 'border-accent bg-accentsoft/30' : 'border-line')}
        style={{ borderTop: `3px solid ${color}` }}
      >
        <button type="button" aria-label={tb('expandColumn', { column: name })} onClick={() => onToggleCollapse(column.key)} className="rounded p-0.5 text-muted hover:bg-panel2 hover:text-fg">
          <ChevronRight size={14} />
        </button>
        <span className="text-xs text-muted">{column.tasks.length}</span>
        <span className="text-xs font-semibold uppercase [writing-mode:vertical-rl]" style={{ color }}>
          {name}
        </span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={name}
      data-wip-over={overLimit || undefined}
      className={cn('flex w-[272px] shrink-0 flex-col rounded-lg border bg-panel p-2 transition-colors duration-150', fill && 'max-h-full', isOver ? 'border-accent bg-accentsoft/30' : overLimit ? 'border-danger' : 'border-line')}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="mb-2 flex shrink-0 items-center gap-2 text-xs font-semibold uppercase" style={{ color }}>
        <span className="min-w-0 truncate">{name}</span>
        <span className={cn(overLimit ? 'text-danger' : 'text-muted')} title={overLimit ? tb('wipOver', { limit }) : undefined}>
          {limit !== undefined ? `${total}/${limit}` : column.tasks.length}
        </span>
        {points > 0 ? <span className="shrink-0 whitespace-nowrap font-normal normal-case text-muted">{tb('pointsSum', { points })}</span> : null}
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button type="button" aria-label={tb('collapseColumn', { column: name })} onClick={() => onToggleCollapse(column.key)} className="rounded p-0.5 text-muted hover:bg-panel2 hover:text-fg">
            <ChevronLeft size={14} />
          </button>
          {!canAdd ? null : (
            <button type="button" aria-label={t('inlineAddLabel', { status: name })} onClick={startComposer} className="rounded p-0.5 text-muted hover:bg-panel2 hover:text-fg">
              <Plus size={14} />
            </button>
          )}
        </span>
      </div>
      <div data-testid="column-cards" className={cn('space-y-2', fill && '-mx-1 min-h-0 overflow-y-auto px-1 pb-1')}>
        {composing && composerList ? <TaskComposer listId={composerList.listId} space={composerList.space} label={t('inlineAddLabel', { status: name })} /> : null}
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} tasks={all} people={people} fields={display.cardFields} origin={originOf?.(task)} column={column.key} lane={lane} readOnly={readOnly} />
        ))}
        {!composing && canAdd ? (
          <button type="button" onClick={startComposer} className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-muted transition-colors hover:bg-panel2 hover:text-fg">
            <Plus size={12} />
            {t('inlineAdd')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
