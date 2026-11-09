import { AlignLeft, GitBranch, ListChecks, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TaskIndicatorsProps } from './task-indicators.types';

export function TaskIndicators({ task, subtasks, checklist = false }: TaskIndicatorsProps) {
  const t = useTranslations('tasks.indicators');
  const attachments = task.attachmentCount ?? 0;
  const hasDescription = task.descriptionMd.trim().length > 0;
  const items = checklist ? task.checklists.flatMap((c) => c.items) : [];
  const done = items.filter((item) => item.resolved).length;
  if (!hasDescription && attachments === 0 && subtasks === 0 && items.length === 0) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
      {hasDescription ? (
        <span role="img" aria-label={t('description')} title={t('description')} className="flex">
          <AlignLeft size={12} aria-hidden="true" />
        </span>
      ) : null}
      {subtasks > 0 ? (
        <span role="img" aria-label={t('subtasks', { count: subtasks })} title={t('subtasks', { count: subtasks })} className="flex items-center gap-0.5">
          <GitBranch size={12} aria-hidden="true" />
          {subtasks}
        </span>
      ) : null}
      {items.length > 0 ? (
        <span role="img" aria-label={t('checklist', { done, total: items.length })} title={t('checklist', { done, total: items.length })} className="flex items-center gap-0.5 tabular-nums">
          <ListChecks size={12} aria-hidden="true" />
          {done}/{items.length}
        </span>
      ) : null}
      {attachments > 0 ? (
        <span role="img" aria-label={t('attachments', { count: attachments })} title={t('attachments', { count: attachments })} className="flex items-center gap-0.5">
          <Paperclip size={12} aria-hidden="true" />
          {attachments}
        </span>
      ) : null}
    </span>
  );
}
