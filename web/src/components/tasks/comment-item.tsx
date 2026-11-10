'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AttachmentItem } from '@/components/attachments/attachment-item';
import { Avatar } from '@/components/common/avatar';
import { AutomationAvatar } from '@/components/common/automation-avatar';
import { MarkdownView } from '@/components/common/markdown-view';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useDeleteComment, useEditComment } from '@/hooks/use-orbit';
import { collectMentionIds } from './mentions.helpers';
import { MentionTextarea } from './mention-textarea';
import { CommentItemProps } from './comment-item.types';
import { actorName, formatTimelineTime } from './task-timeline.helpers';
import { AUTOMATION_ACTOR_ID } from './tasks.constants';

export function CommentItem({ taskId, comment, members, attachments, onRemoveAttachment }: CommentItemProps) {
  const t = useTranslations('drawer');
  const ta = useTranslations('activity');
  const locale = useLocale();
  const caps = useCapabilities();
  const edit = useEditComment(taskId);
  const remove = useDeleteComment(taskId);
  const [body, setBody] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const isAuthor = caps.canWrite && caps.userId === comment.authorId;
  const save = () => {
    if (!body?.trim()) return;
    edit.mutate({ id: comment.id, bodyMd: body, mentionIds: collectMentionIds(body, members) }, { onSuccess: () => setBody(null) });
  };
  const authorName = actorName(comment.authorId, members, { github: ta('github'), automation: ta('automation'), someone: ta('someone') });
  return (
    <li data-kind="comment" className="group flex gap-2.5 rounded px-1 py-2 text-[13px]">
      {comment.authorId === AUTOMATION_ACTOR_ID ? <AutomationAvatar name={authorName} size={28} /> : <Avatar id={comment.authorId} name={authorName} size={28} />}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2 text-xs">
          <span className="min-w-0 truncate font-semibold text-fg">{authorName}</span>
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString(locale)} className="shrink-0 text-muted">
            {formatTimelineTime(comment.createdAt, locale)}
          </time>
          {comment.editedAt ? <span className="shrink-0 text-muted">{t('edited')}</span> : null}
          <span className="ml-auto flex shrink-0 items-center gap-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {isAuthor && body === null ? (
              <button type="button" aria-label={t('editComment')} title={t('editComment')} className="rounded p-1 hover:bg-panel2 hover:text-fg" onClick={() => setBody(comment.bodyMd)}>
                <Pencil size={13} />
              </button>
            ) : null}
            {(isAuthor || caps.canModerateComments) && !confirming ? (
              <button type="button" aria-label={t('deleteComment')} title={t('deleteComment')} className="rounded p-1 hover:bg-panel2 hover:text-danger" onClick={() => setConfirming(true)}>
                <Trash2 size={13} />
              </button>
            ) : null}
          </span>
        </div>
        {confirming ? (
          <div role="alert" className="mb-2 flex flex-wrap items-center gap-2 rounded bg-panel2 px-2 py-1 text-xs">
            <span className="min-w-0 flex-1">{t('confirmDeleteComment')}</span>
            <button type="button" disabled={remove.isPending} className="text-danger" onClick={() => remove.mutate(comment.id, { onSettled: () => setConfirming(false) })}>
              {t('deleteComment')}
            </button>
            <button type="button" className="text-muted hover:text-fg" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </button>
          </div>
        ) : null}
        {body === null ? (
          <MarkdownView source={comment.bodyMd} />
        ) : (
          <div className="space-y-2">
            <MentionTextarea label={t('editComment')} value={body} onChange={setBody} />
            <div className="flex items-center gap-2">
              <button type="button" disabled={edit.isPending || !body.trim()} onClick={save} className="rounded bg-accent px-3 py-1 text-sm text-white disabled:opacity-60">
                {t('save')}
              </button>
              <button type="button" onClick={() => setBody(null)} className="text-sm text-muted hover:text-fg">
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
        <ul className="mt-2 space-y-2 empty:hidden">
          {attachments.map((a) => (
            <AttachmentItem key={a.id} attachment={a} onRemove={caps.canWrite ? onRemoveAttachment : undefined} />
          ))}
        </ul>
      </div>
    </li>
  );
}
