'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { TemplateRowProps } from './templates.types';

export function TemplateRow({ template, spaceName, onEdit, onDelete }: TemplateRowProps) {
  const t = useTranslations('admin.templates');
  const tp = useTranslations('tasks.priority');
  const tk = useTranslations('planning.kinds');
  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="break-words text-sm font-medium">{template.name}</p>
          <p className="break-words text-sm text-fg/80">{template.titleTemplate}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="max-w-full truncate rounded bg-panel2 px-1.5 py-0.5">{spaceName ?? t('spaceMissing')}</span>
            <span>{tk(template.taskKind)}</span>
            <span>{template.priority ? tp(template.priority) : tp('none')}</span>
            {template.estimateMinutes !== null ? <span>{t('estimate', { minutes: template.estimateMinutes })}</span> : null}
            {template.tags.map((tag) => (
              <span key={tag} className="rounded bg-accentsoft px-1.5 py-0.5 text-fg">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" aria-label={t('editFor', { name: template.name })} onClick={() => onEdit(template)} className={ADMIN_ICON_BUTTON_CLASS}>
            <Pencil size={14} />
          </button>
          <button type="button" aria-label={t('deleteFor', { name: template.name })} onClick={() => onDelete(template)} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}
