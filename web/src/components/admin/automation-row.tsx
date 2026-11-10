'use client';

import { useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useUpdateAutomation } from '@/hooks/use-automations';
import { notAfter } from '@/components/tasks/task-github.helpers';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { cn } from '@/lib/cn';
import { ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { describeRunReason, findAutomationList } from './automation.helpers';
import { AutomationRowProps } from './automation.types';
import { AutomationHistory } from './automation-history';
import { AutomationRunBadge } from './automation-run-badge';
import { useAutomationSentence } from './use-automation-sentence';

export function AutomationRow({ automation, spaces, members, onEdit, onDelete }: AutomationRowProps) {
  const t = useTranslations('admin.automations');
  const format = useFormatter();
  const errorText = useApiErrorText();
  const sentence = useAutomationSentence(members);
  const update = useUpdateAutomation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scoped = findAutomationList(spaces, automation.listId);
  const scope = !automation.listId ? t('scopeAll') : scoped ? t('scopeList', { space: scoped.space.name, list: scoped.list.name }) : t('scopeMissing');
  const lastRun = automation.lastRun;
  const lastReason = lastRun ? describeRunReason(lastRun.reason) : null;
  const historyId = `automation-history-${automation.id}`;
  const now = new Date();

  const toggle = () => {
    setError(null);
    update.mutate({ id: automation.id, input: { active: !automation.active } }, { onError: (failure) => setError(errorText(failure)) });
  };

  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={automation.active}
          aria-label={t('toggleFor', { name: automation.name })}
          disabled={update.isPending}
          onClick={toggle}
          className={cn('relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60', automation.active ? 'bg-accent' : 'bg-panel2 ring-1 ring-inset ring-line')}
        >
          <span aria-hidden="true" className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', automation.active ? 'translate-x-[18px]' : 'translate-x-0.5')} />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn('break-words text-sm font-medium', !automation.active && 'text-muted')}>{automation.name}</p>
          <p className="break-words text-sm text-fg/80">{sentence(automation)}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="max-w-full truncate rounded bg-panel2 px-1.5 py-0.5">{scope}</span>
            {lastRun ? (
              <span className="flex min-w-0 items-center gap-1">
                <span>{t('lastRun')}</span>
                <AutomationRunBadge status={lastRun.status} label={t(`runStatus.${lastRun.status}`)} title={lastReason ? t(`reasons.${lastReason.key}`, lastReason.values) : undefined} />
                <time dateTime={lastRun.at}>{format.relativeTime(notAfter(lastRun.at, now), now)}</time>
              </span>
            ) : (
              <span>{t('neverRan')}</span>
            )}
          </div>
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" aria-label={t('editFor', { name: automation.name })} onClick={() => onEdit(automation)} className={ADMIN_ICON_BUTTON_CLASS}>
            <Pencil size={14} />
          </button>
          <button type="button" aria-label={t('deleteFor', { name: automation.name })} onClick={() => onDelete(automation)} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2 pl-12">
        <button type="button" aria-expanded={open} aria-controls={historyId} onClick={() => setOpen((value) => !value)} className="flex items-center gap-1 text-xs text-muted hover:text-fg">
          <ChevronDown size={12} aria-hidden="true" className={cn('transition-transform', open ? 'rotate-180' : '')} />
          {t('history')}
        </button>
        {open ? (
          <div id={historyId} className="mt-2 rounded border border-line bg-panel2/40 p-2">
            <AutomationHistory automationId={automation.id} />
          </div>
        ) : null}
      </div>
    </li>
  );
}
