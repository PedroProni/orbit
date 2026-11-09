'use client';

import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UploadItem } from './attachments.types';

export function UploadProgress({ item, onDismiss }: { item: UploadItem; onDismiss: (id: string) => void }) {
  const t = useTranslations('attachments');
  const failed = item.status === 'error';
  return (
    <li className="anim-fade-in rounded border border-line bg-panel2 p-2 text-xs">
      <div className="flex items-center gap-2">
        {failed ? <AlertCircle size={14} className="shrink-0 text-danger" /> : item.status === 'done' ? <CheckCircle2 size={14} className="shrink-0 text-emerald-400" /> : <Loader2 size={14} className="shrink-0 animate-spin text-accent" />}
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        {failed ? null : <span className="text-muted">{item.progress}%</span>}
        <button type="button" aria-label={t('dismiss')} onClick={() => onDismiss(item.id)} className="text-muted hover:text-fg">
          <X size={12} />
        </button>
      </div>
      {failed ? (
        <p role="alert" className="mt-1 text-danger">
          {t(`errors.${item.errorKey}`, item.errorValues)}
        </p>
      ) : (
        <div role="progressbar" aria-label={t('progress', { name: item.name })} aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-1 overflow-hidden rounded bg-line">
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
        </div>
      )}
    </li>
  );
}
