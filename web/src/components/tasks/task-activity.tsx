'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Avatar } from '@/components/common/avatar';
import { useCustomFields, useMembers, useTaskActivity } from '@/hooks/use-orbit';
import { ACTIVITY_HIDDEN_FIELDS, ACTIVITY_PEOPLE_FIELDS } from './tasks.constants';
import { customFieldChanges, formatActivityValue } from './task-helpers';
import { TaskActivityProps } from './task-activity.types';
import { useStatusLabel } from '@/hooks/use-status-label';

export function TaskActivity({ taskId, spaceId }: TaskActivityProps) {
  const t = useTranslations('activity');
  const tp = useTranslations('tasks');
  const locale = useLocale();
  const activity = useTaskActivity(taskId);
  const statusLabel = useStatusLabel();
  const members = useMembers();
  const definitions = useCustomFields(spaceId);
  const nameOf = (id: string) => members.data?.find((m) => m.id === id)?.name ?? t('someone');
  const showValue = (field: string, value: unknown) => (field === 'status' && typeof value === 'string' ? statusLabel(value) : field === 'priority' && typeof value === 'string' ? tp(`priority.${value}`) : formatActivityValue(value, ACTIVITY_PEOPLE_FIELDS.includes(field) ? nameOf : undefined, locale));
  const entries = activity.data ?? [];
  return (
    <section aria-label={t('title')} className="space-y-3">
      <h3 className="text-xs font-semibold uppercase text-muted">{t('title')}</h3>
      {entries.length === 0 ? <p className="text-sm text-muted">{t('empty')}</p> : null}
      <ol className="space-y-3">
        {entries.map((entry) => {
          const fields = Object.keys(entry.diff).filter((f) => !ACTIVITY_HIDDEN_FIELDS.includes(f));
          return (
            <li key={entry.id} className="flex gap-2 text-xs">
              <Avatar id={entry.actorId} name={nameOf(entry.actorId)} size={20} />
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{nameOf(entry.actorId)}</span> {entry.action === 'task.created' ? t('created') : fields.length ? t('changed', { fields: fields.map((f) => t(`fields.${f}`)).join(', ') }) : t('updated')}
                </p>
                {fields.slice(0, 3).map((f) =>
                  f === 'customFields' ? (
                    customFieldChanges(entry.diff[f].before, entry.diff[f].after, definitions.data, locale)
                      .filter((change) => change.name)
                      .map((change) => (
                        <p key={`${f}-${change.fieldId}`} className="truncate text-muted">
                          {change.name}: {change.before} {'->'} {change.after}
                        </p>
                      ))
                  ) : (
                    <p key={f} className="truncate text-muted">
                      {t(`fields.${f}`)}: {showValue(f, entry.diff[f].before)} {'->'} {showValue(f, entry.diff[f].after)}
                    </p>
                  ),
                )}
                <time className="text-[11px] text-muted">{new Date(entry.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
