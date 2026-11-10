'use client';

import { Fragment, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAttachments, useRemoveAttachment } from '@/hooks/use-attachments';
import { useComments, useCustomFields, useMembers, useTaskActivity } from '@/hooks/use-orbit';
import { CommentItem } from './comment-item';
import { ActivityLine } from './task-activity-line';
import { TaskCommentComposer } from './task-comment-composer';
import { formatCreatedDay, formatTimelineDay, localDayKey, mergeTimeline } from './task-timeline.helpers';
import { TaskTimelineProps } from './task-timeline.types';

export function TaskTimeline({ task, statuses, readOnly, limited }: TaskTimelineProps) {
  const t = useTranslations('drawer');
  const ta = useTranslations('activity');
  const locale = useLocale();
  const comments = useComments(limited ? null : task.id);
  const activity = useTaskActivity(task.id);
  const members = useMembers();
  const definitions = useCustomFields(limited ? undefined : task.spaceId);
  const attachments = useAttachments(limited ? null : task.id);
  const remove = useRemoveAttachment(task.id);
  const scroller = useRef<HTMLDivElement>(null);
  const items = mergeTimeline(comments.data ?? [], activity.data ?? []);
  const lastId = items[items.length - 1]?.id;
  useEffect(() => {
    const node = scroller.current;
    if (node && lastId) node.scrollTop = node.scrollHeight;
  }, [lastId]);
  return (
    <section aria-label={t('comments')} className="flex min-h-0 flex-col lg:h-full">
      <header className="flex shrink-0 items-baseline gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold">{t('comments')}</h2>
        <span className="text-xs text-muted">{t('createdOn', { date: formatCreatedDay(task.createdAt, locale) })}</span>
      </header>
      <div ref={scroller} data-testid="timeline-scroll" className="min-h-0 flex-1 overflow-y-auto px-3">
        {items.length === 0 ? <p className="px-1 py-2 text-xs text-muted">{ta('empty')}</p> : null}
        <ol className="pb-2">
          {items.map((item, index) => {
            const day = localDayKey(item.createdAt);
            const newDay = index === 0 || localDayKey(items[index - 1].createdAt) !== day;
            return (
              <Fragment key={item.id}>
                {newDay ? (
                  <li role="separator" aria-label={formatTimelineDay(item.createdAt, locale)} className="my-2 flex items-center gap-2 text-[11px] text-muted">
                    <span className="h-px flex-1 bg-line" />
                    <span className="rounded-full border border-line px-2 py-0.5">{formatTimelineDay(item.createdAt, locale)}</span>
                    <span className="h-px flex-1 bg-line" />
                  </li>
                ) : null}
                {item.kind === 'comment' ? (
                  <CommentItem taskId={task.id} comment={item.comment} members={members.data ?? []} attachments={attachments.data?.filter((a) => a.commentId === item.comment.id && a.confirmed) ?? []} onRemoveAttachment={(id) => remove.mutate(id)} />
                ) : (
                  <ActivityLine entry={item.entry} statuses={statuses} members={members.data ?? []} definitions={definitions.data} />
                )}
              </Fragment>
            );
          })}
        </ol>
      </div>
      {readOnly ? null : (
        <div className="shrink-0 border-t border-line p-3">
          <TaskCommentComposer taskId={task.id} />
        </div>
      )}
    </section>
  );
}
