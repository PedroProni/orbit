'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAddComment, useComments, useMembers } from '@/hooks/use-orbit';
import { useAttachments, useRemoveAttachment, useUploads } from '@/hooks/use-attachments';
import { AttachButton } from '@/components/attachments/attach-button';
import { UploadProgress } from '@/components/attachments/upload-progress';
import { CommentItem } from './comment-item';
import { collectMentionIds } from './mentions.helpers';
import { MentionTextarea } from './mention-textarea';
import { TaskCommentsProps } from './task-comments.types';

export function TaskComments({ taskId }: TaskCommentsProps) {
  const t = useTranslations('drawer');
  const [body, setBody] = useState('');
  const comments = useComments(taskId);
  const members = useMembers();
  const add = useAddComment(taskId);
  const attachments = useAttachments(taskId);
  const remove = useRemoveAttachment(taskId);
  const controller = useUploads(taskId);
  const [pending, setPending] = useState<File[]>([]);
  const ta = useTranslations('attachments');
  return (
    <section>
      <h2 className="mb-2 text-xs uppercase text-muted">{t('comments')}</h2>
      <ul className="space-y-3">
        {comments.data?.map((c) => (
          <CommentItem key={c.id} taskId={taskId} comment={c} members={members.data ?? []} attachments={attachments.data?.filter((a) => a.commentId === c.id && a.confirmed) ?? []} onRemoveAttachment={(id) => remove.mutate(id)} />
        ))}
      </ul>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          const files = pending;
          add.mutate({ bodyMd: body, mentionIds: collectMentionIds(body, members.data ?? []) }, {
            onSuccess: (comment) => {
              setBody('');
              setPending([]);
              if (files.length) controller.start(files, comment.id);
            },
          });
        }}
      >
        <MentionTextarea label={t('newComment')} placeholder={t('newComment')} value={body} onChange={setBody} />
        {pending.length ? (
          <ul className="flex flex-wrap gap-1">
            {pending.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded bg-panel2 px-2 py-0.5 text-xs">
                <span className="max-w-40 truncate">{f.name}</span>
                <button type="button" aria-label={ta('remove', { name: f.name })} onClick={() => setPending((list) => list.filter((_, j) => j !== i))} className="text-muted hover:text-danger">
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {controller.uploads.length ? (
          <ul className="space-y-2">
            {controller.uploads.map((u) => (
              <UploadProgress key={u.id} item={u} onDismiss={controller.dismiss} />
            ))}
          </ul>
        ) : null}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={add.isPending} className="rounded bg-accent px-3 py-1 text-sm text-white disabled:opacity-60">
            {t('send')}
          </button>
          <AttachButton onFiles={(files) => setPending((list) => [...list, ...files])} />
        </div>
      </form>
    </section>
  );
}
