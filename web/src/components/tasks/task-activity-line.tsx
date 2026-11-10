'use client';

import { Bot } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useStatusLabel } from '@/hooks/use-status-label';
import { ACTIVITY_PEOPLE_FIELDS, AUTOMATION_ACTOR_ID } from './tasks.constants';
import { customFieldChanges, formatActivityValue, statusColor } from './task-helpers';
import { actorName, formatTimelineTime, linkChanges, pullRequestChange, visibleActivityFields } from './task-timeline.helpers';
import { ActivityLineProps, StatusNameProps } from './task-timeline.types';

function StatusName({ name, statuses }: StatusNameProps) {
  const statusLabel = useStatusLabel();
  if (typeof name !== 'string' || !name) return <span>-</span>;
  const status = statuses.find((item) => item.name === name);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: status ? statusColor(status) : 'var(--muted)' }} />
      {statusLabel(name)}
    </span>
  );
}

export function ActivityLine({ entry, statuses, members, definitions }: ActivityLineProps) {
  const t = useTranslations('activity');
  const td = useTranslations('drawer');
  const tp = useTranslations('tasks');
  const locale = useLocale();
  const nameOf = (id: string) => actorName(id, members, { github: t('github'), automation: t('automation'), someone: t('someone') });
  const fields = visibleActivityFields(entry);
  const statusOnly = entry.action !== 'task.created' && fields.length === 1 && fields[0] === 'status';
  const pullRequest = entry.action === 'task.created' ? null : pullRequestChange(entry, fields);
  const showValue = (field: string, value: unknown) => (field === 'priority' && typeof value === 'string' ? tp(`priority.${value}`) : formatActivityValue(value, ACTIVITY_PEOPLE_FIELDS.includes(field) ? nameOf : undefined, locale));
  const summary = entry.action === 'task.created' ? t('created') : fields.length ? t('changed', { fields: fields.map((f) => t(`fields.${f}`)).join(', ') }) : t('updated');
  return (
    <li data-kind="activity" className="flex gap-2 px-1 py-1 text-xs text-muted">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p>
          <span data-actor={entry.actorId === AUTOMATION_ACTOR_ID ? AUTOMATION_ACTOR_ID : undefined} className="font-medium text-fg/80">
            {entry.actorId === AUTOMATION_ACTOR_ID ? <Bot size={12} aria-hidden="true" className="mr-0.5 inline-block align-[-2px] text-accent" /> : null}
            {nameOf(entry.actorId)}
          </span>{' '}
          {statusOnly
            ? t.rich('statusChanged', { before: () => <StatusName name={entry.diff.status.before} statuses={statuses} />, after: () => <StatusName name={entry.diff.status.after} statuses={statuses} /> })
            : pullRequest
              ? t(pullRequest.kind === 'linked' ? 'pullRequestLinked' : 'pullRequestUnlinked', { pr: pullRequest.pr })
              : summary}
        </p>
        {statusOnly || pullRequest
          ? null
          : fields.slice(0, 3).map((f) => {
              if (f === 'customFields')
                return customFieldChanges(entry.diff[f].before, entry.diff[f].after, definitions, locale)
                  .filter((change) => change.name)
                  .map((change) => (
                    <p key={`${f}-${change.fieldId}`} className="truncate">
                      {change.name}: {change.before} {'->'} {change.after}
                    </p>
                  ));
              if (f === 'links')
                return linkChanges(entry.diff[f].before, entry.diff[f].after).map((change) => (
                  <p key={`${f}-${change.key}`} className="truncate">
                    {td(change.key)}: {change.before} {'->'} {change.after}
                  </p>
                ));
              if (f === 'status')
                return (
                  <p key={f} className="flex flex-wrap items-center gap-1">
                    {t('fields.status')}: <StatusName name={entry.diff.status.before} statuses={statuses} /> {'->'} <StatusName name={entry.diff.status.after} statuses={statuses} />
                  </p>
                );
              return (
                <p key={f} className="truncate">
                  {t(`fields.${f}`)}: {showValue(f, entry.diff[f].before)} {'->'} {showValue(f, entry.diff[f].after)}
                </p>
              );
            })}
      </div>
      <time dateTime={entry.createdAt} className="shrink-0 tabular-nums">
        {formatTimelineTime(entry.createdAt, locale)}
      </time>
    </li>
  );
}
