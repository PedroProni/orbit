'use client';

import { useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Attachment } from '@/types/api.types';
import { orbitService } from '@/services/orbit.service';
import { useAttachmentUrl } from '@/hooks/use-attachments';
import { useToastStore } from '@/stores/toast.store';
import { formatBytes, isImageMime } from './attachments.helpers';

export function AttachmentItem({ attachment, onRemove }: { attachment: Attachment; onRemove: (id: string) => void }) {
  const t = useTranslations('attachments');
  const image = isImageMime(attachment.mimeType);
  const preview = useAttachmentUrl(attachment.id, image);
  const [confirming, setConfirming] = useState(false);
  const download = async () => {
    try {
      const { url } = await orbitService.attachmentDownload(attachment.id);
      window.open(url, '_blank', 'noopener');
    } catch {
      useToastStore.getState().push('error', 'attachDownloadFailed');
    }
  };
  return (
    <li className="row-hover flex items-center gap-3 rounded border border-line p-2 text-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-panel2 text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && preview.data ? <img src={preview.data.url} alt={attachment.filename} className="h-full w-full object-cover" /> : <FileText size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate">{attachment.filename}</p>
        <p className="text-xs text-muted">{formatBytes(attachment.sizeBytes)}</p>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={() => onRemove(attachment.id)} className="text-danger">
            {t('confirmRemove')}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-muted">
            {t('cancel')}
          </button>
        </div>
      ) : (
        <div className="row-hover-actions flex items-center gap-2 text-muted">
          <button type="button" aria-label={t('download', { name: attachment.filename })} onClick={download} className="hover:text-fg">
            <Download size={14} />
          </button>
          <button type="button" aria-label={t('remove', { name: attachment.filename })} onClick={() => setConfirming(true)} className="hover:text-danger">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </li>
  );
}
