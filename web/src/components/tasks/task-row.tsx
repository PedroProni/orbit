'use client';

import { CheckCircle2, ExternalLink, Link2, MoreHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useUpdateTask } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { useSelectionStore } from '@/stores/selection.store';
import { useToastStore } from '@/stores/toast.store';
import { AvatarStack } from '@/components/common/avatar';
import { ContextMenu } from '@/components/ui/context-menu';
import { DateField } from '@/components/ui/date-field';
import { dayFromIso, formatShortDay, isoFromDay } from '@/lib/calendar-day';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Select } from '@/components/ui/select';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { Tooltip } from '@/components/ui/tooltip';
import { LIST_COLUMNS_CLASS, PRIORITIES } from './tasks.constants';
import { isTempTask } from './task-composer.helpers';
import { statusColor } from './task-helpers';
import { TaskRowProps } from './task-row.types';
import { TaskPriority } from '@/types/api.types';
import { useStatusLabel } from '@/hooks/use-status-label';

export function TaskRow({ task, people, statuses, readOnly = false }: TaskRowProps) {
  const t = useTranslations('tasks');
  const tu = useTranslations('ui');
  const locale = useLocale();
  const openTask = useUiStore((s) => s.openTask);
  const pushToast = useToastStore((s) => s.push);
  const update = useUpdateTask();
  const selected = useSelectionStore((s) => s.ids.includes(task.id));
  const anySelected = useSelectionStore((s) => s.ids.length > 0);
  const toggleSelected = useSelectionStore((s) => s.toggle);
  const temp = isTempTask(task);
  const patch = (value: Parameters<typeof update.mutate>[0]['patch']) => update.mutate({ id: task.id, patch: value });
  const assignees = people.filter((p) => task.assigneeIds.includes(p.id));
  const statusLabel = useStatusLabel();
  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/t/${task.id}`);
    pushToast('info', 'linkCopied');
  };
  const menuItems = [
    { key: 'open', label: t('menu.open'), icon: <ExternalLink size={14} />, onSelect: () => openTask(task.id) },
    { key: 'link', label: t('menu.copyLink'), icon: <Link2 size={14} />, onSelect: copyLink },
    ...(readOnly ? [] : statuses).filter((s) => s.name !== task.status).map((s) => ({ key: `status-${s.name}`, label: t('menu.moveTo', { status: statusLabel(s.name) }), icon: <CheckCircle2 size={14} style={{ color: statusColor(s) }} />, onSelect: () => patch({ status: s.name }) })),
  ];
  return (
    <ContextMenu as="li" items={menuItems} motionKey={task.id}>
      <div className={`row-hover ${LIST_COLUMNS_CLASS} items-center gap-3 px-3 py-1.5 text-sm transition-colors hover:bg-panel2`}>
        <div className="flex min-w-0 items-center gap-2">
          {readOnly || temp ? null : <input type="checkbox" aria-label={t('selectRow', { title: task.title })} checked={selected} onChange={() => toggleSelected(task.id)} className={`row-hover-actions shrink-0 transition-opacity pointer-coarse:opacity-100 ${selected || anySelected ? 'opacity-100' : ''}`} />}
          <Tooltip label={task.priority ? t(`priority.${task.priority}`) : t('priority.none')}>
            <span className="flex shrink-0">
              <PriorityFlag priority={task.priority} />
            </span>
          </Tooltip>
          <button type="button" disabled={temp} onClick={() => openTask(task.id)} className="line-clamp-2 min-w-0 flex-1 break-words text-left disabled:opacity-70 md:truncate">
            {task.title}
          </button>
          <span className="row-hover-actions flex shrink-0 items-center gap-1 text-muted">
            <Tooltip label={t('menu.open')}>
              <button type="button" aria-label={t('menu.open')} onClick={() => openTask(task.id)} className="rounded p-0.5 hover:text-fg">
                <ExternalLink size={13} />
              </button>
            </Tooltip>
            <DropdownMenu items={menuItems} label={tu('more')} className="rounded p-0.5 hover:text-fg">
              <MoreHorizontal size={13} />
            </DropdownMenu>
          </span>
        </div>
        <span className="flex items-center gap-2 pl-4 text-xs text-muted md:hidden">
          <AvatarStack people={assignees} />
          {task.dueDate ? <span>{formatShortDay(task.dueDate, locale)}</span> : null}
          {task.priority ? <span>{t(`priority.${task.priority}`)}</span> : null}
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-accentsoft px-1.5 py-0.5 text-[11px]">
              {tag}
            </span>
          ))}
        </span>
        <span className="hidden md:block">
          <AvatarStack people={assignees} />
        </span>
        <DateField variant="ghost" disabled={readOnly} ariaLabel={t('columns.due')} value={dayFromIso(task.dueDate)} onChange={(day) => patch({ dueDate: isoFromDay(day) })} className="hidden md:flex" />
        <Select variant="ghost" disabled={readOnly} ariaLabel={t('columns.priority')} value={task.priority ?? ''} options={[{ value: '', label: t('priority.noneShort'), icon: <PriorityFlag priority={null} /> }, ...PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`), icon: <PriorityFlag priority={p} /> }))]} onChange={(priority) => patch({ priority: (priority || null) as TaskPriority | null })} className="hidden md:flex" />
        <span className="hidden gap-1 lg:flex">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-accentsoft px-1.5 py-0.5 text-[11px]">
              {tag}
            </span>
          ))}
        </span>
        <span className="hidden text-xs text-muted lg:block">{task.points ?? ''}</span>
      </div>
    </ContextMenu>
  );
}
