'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBoardLabels } from '@/hooks/use-board-labels';
import { touchLiftFeedback, useBoardSensors } from '@/hooks/use-board-sensors';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useMembers, useUpdateTask } from '@/hooks/use-orbit';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/motion';
import { useComposerStore } from '@/stores/composer.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { BOARD_NO_LANE } from './board.constants';
import { BoardDragData, BoardDropData } from './board.types';
import { CardBody } from './board-card';
import { BoardColumn } from './board-column';
import { boardAnchor, boardDropPatch, buildBoardLayout, countInColumn } from './board-groups';
import { KanbanBoardProps } from './kanban-board.types';

export function KanbanBoard({ tasks, space, listId, readOnly = false, refuseDrop, targetFor, originOf }: KanbanBoardProps) {
  const [active, setActive] = useState<BoardDragData | null>(null);
  const [closedLanes, setClosedLanes] = useState<string[]>([]);
  const t = useTranslations('tasks');
  const tb = useTranslations('board');
  const update = useUpdateTask();
  const members = useMembers();
  const display = useUiStore((s) => s.display);
  const setDisplay = useUiStore((s) => s.setDisplay);
  const anchor = useComposerStore((s) => s.anchor);
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name }));
  const labelFor = useBoardLabels(people);
  const groupBy = readOnly && display.groupBy === 'assignee' ? 'status' : display.groupBy;
  const swimlane = readOnly && display.swimlane === 'assignee' ? 'none' : display.swimlane;
  const shown = { ...display, groupBy, swimlane };
  const sensors = useBoardSensors();
  const lanes = buildBoardLayout({ tasks: tasks.filter((x) => !x.parentId), statuses: space.statuses, groupBy, swimlane, people });
  const activeTask = tasks.find((x) => x.id === active?.taskId);
  const scroller = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const drag = useDragScroll(scroller);
  const measure = useCallback(() => {
    const el = scroller.current;
    if (el) setHasMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);
  const columnCount = lanes[0]?.columns.length ?? 0;
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, columnCount]);

  const onDragStart = (event: DragStartEvent) => {
    touchLiftFeedback(event);
    setActive(event.active.data.current as BoardDragData);
  };
  const onDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const from = event.active.data.current as BoardDragData | undefined;
    const to = event.over?.data.current as BoardDropData | undefined;
    const task = tasks.find((x) => x.id === from?.taskId);
    if (!from || !to || !task) return;
    const patch = boardDropPatch(task, groupBy, swimlane, from, to);
    if (!patch) return;
    const refusal = refuseDrop?.(task, patch);
    if (refusal) useToastStore.getState().push('error', refusal.key, refusal.values);
    else update.mutate({ id: task.id, patch });
  };
  const toggleCollapse = (key: string) => setDisplay({ collapsedColumns: display.collapsedColumns.includes(key) ? display.collapsedColumns.filter((item) => item !== key) : [...display.collapsedColumns, key] });
  const toggleLane = (key: string) => setClosedLanes((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const visibleColumns = (columns: (typeof lanes)[number]['columns'], lane: string) => (display.hideEmpty ? columns.filter((column) => column.tasks.length > 0 || anchor === boardAnchor(lane, column.key)) : columns);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragCancel={() => setActive(null)} onDragEnd={onDragEnd}>
      <div className="relative h-full">
        <div ref={scroller} onScroll={measure} {...drag.handlers} data-dragging={drag.dragging || undefined} className={cn('board-scroll h-full overflow-auto pb-1', swimlane !== 'none' && 'space-y-3', drag.dragging && 'cursor-grabbing select-none')} aria-label={t('views.board')}>
          {lanes.map((lane) => {
            const hasLane = lane.key !== BOARD_NO_LANE;
            const closed = closedLanes.includes(lane.key);
            const laneLabel = hasLane ? labelFor(swimlane === 'none' ? groupBy : swimlane, lane.key) : '';
            return (
              <div key={lane.key} role={hasLane ? 'group' : undefined} aria-label={hasLane ? laneLabel : undefined} className={cn('space-y-2', !hasLane && 'h-full')}>
                {hasLane ? (
                  <button type="button" aria-expanded={!closed} aria-label={tb('toggleLane', { lane: laneLabel })} onClick={() => toggleLane(lane.key)} className="sticky left-0 flex items-center gap-1.5 rounded px-1 py-0.5 text-xs font-semibold text-muted hover:text-fg">
                    {closed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    {laneLabel}
                    <span className="font-normal">{new Set(lane.columns.flatMap((column) => column.tasks.map((task) => task.id))).size}</span>
                  </button>
                ) : null}
                {closed ? null : (
                  <div className={cn('flex w-max items-start gap-3', !hasLane && 'h-full')}>
                    {visibleColumns(lane.columns, lane.key).map((column) => (
                      <BoardColumn
                        key={column.key}
                        column={column}
                        lane={lane.key}
                        display={shown}
                        total={countInColumn(lanes, column.key)}
                        all={tasks}
                        people={people}
                        listId={listId}
                        space={space}
                        readOnly={readOnly}
                        fill={!hasLane}
                        label={(key) => labelFor(groupBy, key)}
                        onToggleCollapse={toggleCollapse}
                        target={targetFor ? targetFor(column.key) : undefined}
                        originOf={originOf}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {hasMore ? <div aria-hidden="true" data-testid="board-more" className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" /> : null}
      </div>
      <DragOverlay dropAnimation={prefersReducedMotion() ? null : { duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {activeTask ? (
          <div className="w-[256px] rotate-2 scale-[1.03] cursor-grabbing select-none space-y-1.5 rounded-lg border border-accent bg-panel2 p-2 text-[13px] shadow-2xl">
            <CardBody task={activeTask} tasks={tasks} people={people} fields={display.cardFields} origin={originOf?.(activeTask)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
