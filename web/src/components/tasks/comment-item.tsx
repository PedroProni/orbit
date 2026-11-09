'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AttachmentItem } from '@/components/attachments/attachment-item';
import { MarkdownView } from '@/components/common/markdown-view';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useDeleteComment, useEditComment } from '@/hooks/use-orbit';
import { collectMentionIds } from './mentions.helpers';
import { MentionTextarea } from './mention-textarea';
import { CommentItemProps } from './comment-item.types';

export function CommentItem({ taskId, comment, members, attachments, onRemoveAttachment }: CommentItemProps) {
  const t = useTranslations('drawer');
  const locale = useLocale();
  const caps = useCapabilities();
  const edit = useEditComment(taskId);
  const remove = useDeleteComment(taskId);
  const [body, setBody] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const isAuthor = caps.userId === comment.authorId;
  const save = () => {
    if (!body?.trim()) return;
    edit.mutate({ id: comment.id, bodyMd: body, mentionIds: collectMentionIds(body, members) }, { onSuccess: () => setBody(null) });
  };
  return (
    <li className="rounded border border-line p-2">
      <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
        <span className="min-w-0 flex-1">
          {members.find((m) => m.id === comment.authorId)?.name ?? ''} · {new Date(comment.createdAt).toLocaleString(locale)}
          {comment.editedAt ? ` · ${t('edited')}` : ''}
        </span>
        {isAuthor && body === null ? (
          <button type="button" className="hover:text-fg" onClick={() => setBody(comment.bodyMd)}>
            {t('editComment')}
          </button>
        ) : null}
        {(isAuthor || caps.canModerateComments) && !confirming ? (
          <button type="button" className="hover:text-danger" onClick={() => setConfirming(true)}>
            {t('deleteComment')}
          </button>
        ) : null}
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
          <AttachmentItem key={a.id} attachment={a} onRemove={onRemoveAttachment} />
        ))}
      </ul>
    </li>
  );
}
