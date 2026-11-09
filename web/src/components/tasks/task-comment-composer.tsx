'use client';

import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAddComment, useMembers } from '@/hooks/use-orbit';
import { useUploads } from '@/hooks/use-attachments';
import { AttachButton } from '@/components/attachments/attach-button';
import { UploadProgress } from '@/components/attachments/upload-progress';
import { collectMentionIds } from './mentions.helpers';
import { MentionTextarea } from './mention-textarea';
import { TaskCommentComposerProps } from './task-timeline.types';

export function TaskCommentComposer({ taskId }: TaskCommentComposerProps) {
  const t = useTranslations('drawer');
  const ta = useTranslations('attachments');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState<File[]>([]);
  const members = useMembers();
  const add = useAddComment(taskId);
  const controller = useUploads(taskId);
  return (
    <form
      aria-label={t('newComment')}
      className="space-y-2 rounded-lg border border-line bg-panel2/60 p-2 text-[13px] focus-within:border-linestrong"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        const files = pending;
        add.mutate(
          { bodyMd: body, mentionIds: collectMentionIds(body, members.data ?? []) },
          {
            onSuccess: (comment) => {
              setBody('');
              setPending([]);
              if (files.length) void controller.start(files, comment.id);
            },
          },
        );
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
      <div className="flex items-center justify-between gap-2">
        <AttachButton onFiles={(files) => setPending((list) => [...list, ...files])} />
        <button type="submit" disabled={add.isPending || !body.trim()} className="flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-xs text-white disabled:opacity-50">
          <SendHorizontal size={13} aria-hidden="true" />
          {t('send')}
        </button>
      </div>
    </form>
  );
}
