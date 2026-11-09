'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UploadProgress } from '@/components/attachments/upload-progress';
import { attachmentContentUrl } from '@/components/attachments/attachments.helpers';
import { useRemoveAttachment, useUploads } from '@/hooks/use-attachments';
import { usePrints } from '@/hooks/use-task-links';
import { TaskUrlSlot } from './task-url-slot';
import { PRINT_IMAGE_ACCEPT, SLOT_ADD_CLASS } from './task-link-slots.constants';
import { PrintThumbProps, TaskPrintsSlotProps } from './task-prints-slot.types';

function PrintThumb({ print, readOnly, onRemove }: PrintThumbProps) {
  const t = useTranslations('drawer');
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="group relative h-16 w-24 overflow-hidden rounded border border-line bg-panel2">
      <a href={attachmentContentUrl(print.id)} target="_blank" rel="noopener noreferrer" title={print.filename} className="block h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachmentContentUrl(print.id)} alt={print.filename} loading="lazy" className="h-full w-full object-cover" />
      </a>
      {readOnly ? null : confirming ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-panel/90 text-xs">
          <button type="button" className="text-danger" onClick={() => onRemove(print.id)}>
            {t('removePrint')}
          </button>
          <button type="button" className="text-muted hover:text-fg" onClick={() => setConfirming(false)}>
            {t('cancel')}
          </button>
        </div>
      ) : (
        <button type="button" aria-label={t('removePrintNamed', { name: print.filename })} onClick={() => setConfirming(true)} className="absolute right-0.5 top-0.5 rounded bg-panel/80 p-0.5 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100">
          <X size={12} />
        </button>
      )}
    </li>
  );
}

export function TaskPrintsSlot({ taskId, readOnly, folder, onSaveFolder }: TaskPrintsSlotProps) {
  const t = useTranslations('drawer');
  const prints = usePrints(taskId);
  const uploads = useUploads(taskId, 'prints');
  const remove = useRemoveAttachment(taskId);
  const input = useRef<HTMLInputElement>(null);
  const items = (prints.data ?? []).filter((item) => item.confirmed);
  return (
    <div className="space-y-1.5">
      {readOnly && !folder && items.length ? null : <TaskUrlSlot label={t('printsFolder')} addLabel={t('addPrints')} value={folder} readOnly={readOnly} onSave={onSaveFolder} />}
      {items.length ? (
        <ul aria-label={t('printsGallery')} className="flex flex-wrap gap-1.5 px-1.5">
          {items.map((item) => (
            <PrintThumb key={item.id} print={item} readOnly={readOnly} onRemove={(id) => remove.mutate(id)} />
          ))}
        </ul>
      ) : null}
      {uploads.uploads.length ? (
        <ul className="space-y-1 px-1.5">
          {uploads.uploads.map((item) => (
            <UploadProgress key={item.id} item={item} onDismiss={uploads.dismiss} />
          ))}
        </ul>
      ) : null}
      {readOnly ? null : (
        <>
          <input
            ref={input}
            type="file"
            accept={PRINT_IMAGE_ACCEPT}
            multiple
            hidden
            data-testid="prints-input"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (files.length) void uploads.start(files);
            }}
          />
          <button type="button" onClick={() => input.current?.click()} className={`flex items-center gap-1.5 ${SLOT_ADD_CLASS}`}>
            <ImagePlus size={13} aria-hidden="true" />
            {t('addImages')}
          </button>
        </>
      )}
    </div>
  );
}
