'use client';

import { Pencil, RotateCw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS, ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { findAutomationList } from './automation.helpers';
import { CopyButton } from './copy-button';
import { FORM_STATUS_BADGE_CLASS } from './forms.constants';
import { formStatus, publicFormUrl } from './forms.helpers';
import { FormRowProps } from './forms.types';

export function FormRow({ form, spaces, onEdit, onRotate, onDelete }: FormRowProps) {
  const t = useTranslations('admin.forms');
  const scoped = findAutomationList(spaces, form.listId);
  const url = publicFormUrl(window.location.origin, form.publicKey);
  const status = formStatus(form);
  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className={cn('break-words text-sm font-medium', (!form.active || form.paused) && 'text-muted')}>{form.name}</p>
            <span className={cn(ADMIN_BADGE_CLASS, FORM_STATUS_BADGE_CLASS[status])}>{t(`status.${status}`)}</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="max-w-full truncate rounded bg-panel2 px-1.5 py-0.5">{scoped ? t('listOption', { space: scoped.space.name, list: scoped.list.name }) : t('listMissing')}</span>
            <span>{t('fieldCount', { count: form.fields.length })}</span>
          </div>
          {form.paused ? <p className="text-xs text-[var(--priority-high)]">{t('pausedHint')}</p> : null}
          <div className="flex min-w-0 items-center gap-2 pt-1">
            <code className="min-w-0 flex-1 truncate rounded bg-panel2 px-2 py-1 text-xs" title={url}>
              {url}
            </code>
            <CopyButton value={url} label={t('copyLink')} copiedLabel={t('copied')} ariaLabel={t('copyLinkFor', { name: form.name })} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" aria-label={t('editFor', { name: form.name })} onClick={() => onEdit(form)} className={ADMIN_ICON_BUTTON_CLASS}>
            <Pencil size={14} />
          </button>
          <button type="button" aria-label={t('rotateFor', { name: form.name })} onClick={() => onRotate(form)} className={ADMIN_ICON_BUTTON_CLASS}>
            <RotateCw size={14} />
          </button>
          <button type="button" aria-label={t('deleteFor', { name: form.name })} onClick={() => onDelete(form)} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}
