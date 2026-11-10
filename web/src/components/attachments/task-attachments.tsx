'use client';

import { useTranslations } from 'next-intl';
import { useAttachments, useRemoveAttachment } from '@/hooks/use-attachments';
import { TaskAttachmentsProps } from './attachments.types';
import { AttachButton } from './attach-button';
import { AttachmentItem } from './attachment-item';
import { UploadProgress } from './upload-progress';

export function TaskAttachments({ taskId, controller, readOnly = false }: TaskAttachmentsProps) {
  const t = useTranslations('attachments');
  const list = useAttachments(taskId);
  const remove = useRemoveAttachment(taskId);
  const items = list.data?.filter((a) => a.confirmed && !a.commentId) ?? [];
  if (!items.length && !controller.uploads.length) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs uppercase text-muted">
          {t('title')} {items.length ? `(${items.length})` : ''}
        </h2>
        {readOnly ? null : <AttachButton onFiles={(files) => controller.start(files)} />}
      </div>
      {controller.uploads.length ? (
        <ul className="mb-2 space-y-2">
          {controller.uploads.map((u) => (
            <UploadProgress key={u.id} item={u} onDismiss={controller.dismiss} />
          ))}
        </ul>
      ) : null}
      {items.length ? (
        <ul className="space-y-2">
          {items.map((a) => (
            <AttachmentItem key={a.id} attachment={a} onRemove={readOnly ? undefined : (id) => remove.mutate(id)} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
