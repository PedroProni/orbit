'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS } from './admin.constants';
import { AUDIT_META_TRANSLATED_VALUE_KEYS } from './audit-log.constants';
import { auditActionKey, auditActorLabel, auditMetaSummary, auditTaskTarget, isAuditEntityNameHidden } from './audit-log.helpers';
import { AuditLogRowProps } from './audit-log.types';

export function AuditLogRow({ item, onOpenTask }: AuditLogRowProps) {
  const t = useTranslations('admin.auditLog');
  const format = useFormatter();
  const actor = auditActorLabel(item);
  const actorText = actor.text ?? t(actor.key, actor.values);
  const actionText = t.has(auditActionKey(item.action)) ? t(auditActionKey(item.action)) : item.action;
  const entityType = t.has(`entityTypes.${item.entity.type}`) ? t(`entityTypes.${item.entity.type}`) : item.entity.type;
  const nameHidden = isAuditEntityNameHidden(item);
  const entityText = item.entity.label ?? (nameHidden ? t('nameHidden') : item.entity.id);
  const summary = auditMetaSummary(item.meta);
  const taskTarget = auditTaskTarget(item);
  const valueText = (value: string) => (t.has(`values.${value}`) ? t(`values.${value}`) : value);
  return (
    <li className="px-3 py-3">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:gap-4">
        <time dateTime={item.createdAt} className="shrink-0 text-xs text-muted md:w-36">
          {format.dateTime(new Date(item.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="break-words text-sm">
            <span className={cn('font-medium', actor.key === 'actor.deletedPerson' && 'italic text-muted')}>{actorText}</span> <span className="text-muted">{actionText}</span>
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">{entityType}</span>
            {taskTarget ? (
              <button type="button" onClick={() => onOpenTask(taskTarget)} aria-label={t('openTask', { name: entityText })} className="min-w-0 break-all text-left text-accent hover:underline">
                {entityText}
              </button>
            ) : (
              <span className={cn('min-w-0 break-all', item.entity.label ? 'text-fg' : nameHidden ? 'italic text-muted' : 'font-mono text-muted')}>{entityText}</span>
            )}
            {item.entity.deleted ? <span className={cn(ADMIN_BADGE_CLASS, 'bg-panel2 text-muted')}>{t('deleted')}</span> : null}
          </div>
          {summary.fields.length ? <p className="break-words text-xs text-muted">{t('changedFields', { fields: summary.fields.map((field) => (t.has(`fields.${field}`) ? t(`fields.${field}`) : field)).join(', ') })}</p> : null}
          {summary.transition ? <p className="break-words text-xs text-muted">{t('transition', { before: valueText(summary.transition.before), after: valueText(summary.transition.after) })}</p> : null}
          {summary.details.length ? (
            <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {summary.details.map(([key, value]) => (
                <div key={key} className="flex min-w-0 gap-1">
                  <dt>{t(`metaKeys.${key}`)}</dt>
                  <dd className="min-w-0 break-all text-fg/80">{AUDIT_META_TRANSLATED_VALUE_KEYS.includes(key) ? valueText(value) : value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </li>
  );
}
