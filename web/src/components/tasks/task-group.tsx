'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, LayoutTemplate, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MenuList } from '@/components/ui/menu-list';
import { Popover } from '@/components/ui/popover';
import { useComposerStore } from '@/stores/composer.store';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { ComposerPicker } from './composer-field.types';
import { StatusChip } from './status-chip';
import { TaskComposer } from './task-composer';
import { TaskRow } from './task-row';
import { LIST_COLUMNS_CLASS, LIST_FRAME_CLASS, LIST_MIN_WIDTH_CLASS, LIST_WIDE_CELL_CLASS } from './tasks.constants';
import { TaskGroupProps } from './task-group.types';
import { useListMotion } from '@/hooks/use-list-motion';
import { cellPresets } from './board-groups';
import { BOARD_NO_LANE } from './board.constants';
import { groupAnchor } from './task-group.helpers';
import { statusColor } from './task-helpers';
import { useStatusLabel } from '@/hooks/use-status-label';

export function TaskGroup({ status, tasks, people, space, listId, readOnly = false }: TaskGroupProps) {
  const t = useTranslations('tasks');
  const statusLabel = useStatusLabel();
  const [open, setOpen] = useState(true);
  const anchor = useComposerStore((s) => s.anchor);
  const openComposer = useComposerStore((s) => s.open);
  const here = groupAnchor(status.name);
  const composing = anchor === here;
  const label = t('inlineAddLabel', { status: statusLabel(status.name) });
  const showModal = useCreateTaskStore((s) => s.show);
  const [firstPicker, setFirstPicker] = useState<ComposerPicker | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const start = (picker: ComposerPicker | null = null) => {
    setOpen(true);
    setFirstPicker(picker);
    openComposer(here, cellPresets('status', 'none', status.name, BOARD_NO_LANE, space));
  };
  const listRef = useListMotion<HTMLUListElement>(tasks.map((task) => task.id));
  return (
    <section aria-label={statusLabel(status.name)}>
      <div className="group/header mb-1 flex items-center gap-2" style={{ borderLeft: `3px solid ${statusColor(status)}`, paddingLeft: 8 }}>
        <button type="button" aria-expanded={open} aria-label={t('toggleGroup', { status: statusLabel(status.name) })} onClick={() => setOpen((v) => !v)} className="text-muted hover:text-fg">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <StatusChip status={status} />
        <span className="text-xs text-muted">{tasks.length}</span>
        {readOnly ? null : (
          <button type="button" aria-label={label} onClick={() => start()} className="ml-1 rounded p-0.5 text-muted opacity-0 transition-opacity hover:bg-panel2 hover:text-fg focus-visible:opacity-100 group-hover/header:opacity-100 [@media(hover:none)]:opacity-100">
            <Plus size={14} />
          </button>
        )}
      </div>
      {open ? (
        <div className={`anim-fade-in ${LIST_FRAME_CLASS} rounded-lg border border-line`}>
          <div className={LIST_MIN_WIDTH_CLASS}>
            <div className={`${LIST_COLUMNS_CLASS} gap-3 border-b border-line bg-panel px-3 py-1 text-[11px] font-semibold uppercase text-muted`}>
              <span>{t('columns.name')}</span>
              <span className="hidden md:block">{t('columns.assignee')}</span>
              <span className="hidden md:block">{t('columns.due')}</span>
              <span className="hidden md:block">{t('columns.priority')}</span>
              <span className={LIST_WIDE_CELL_CLASS}>{t('columns.tags')}</span>
              <span className={LIST_WIDE_CELL_CLASS}>{t('columns.points')}</span>
            </div>
            <ul ref={listRef} className="divide-y divide-line">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} people={people} statuses={space.statuses} readOnly={readOnly} />
              ))}
            </ul>
          </div>
          {readOnly ? null : composing ? (
            <div className="border-t border-line">
              <TaskComposer listId={listId} space={space} label={label} variant="row" initialPicker={firstPicker} />
            </div>
          ) : (
            <div className="flex items-center border-t border-line">
              <button type="button" onClick={() => start()} className="flex flex-1 items-center gap-1.5 px-3 py-1.5 text-left text-xs text-muted hover:bg-panel2 hover:text-fg">
                <Plus size={12} />
                {t('inlineAdd')}
              </button>
              <button ref={arrowRef} type="button" aria-label={t('addTaskOptions')} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="px-2 py-1.5 text-muted hover:bg-panel2 hover:text-fg">
                <ChevronDown size={12} />
              </button>
              <Popover open={menuOpen} anchorRef={arrowRef} onClose={() => setMenuOpen(false)} label={t('addTaskOptions')} align="end">
                <MenuList
                  label={t('addTaskOptions')}
                  onClose={() => setMenuOpen(false)}
                  items={[
                    { key: 'template', label: t('addFromTemplate'), icon: <LayoutTemplate size={14} />, onSelect: () => start('template') },
                    { key: 'form', label: t('addWithForm'), icon: <FileText size={14} />, onSelect: () => showModal({ listId, status: status.name }) },
                  ]}
                />
              </Popover>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
