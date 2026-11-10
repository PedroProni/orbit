'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { ApiTokenCreatedDialogProps } from './api-tokens.types';
import { CopyButton } from './copy-button';

export function ApiTokenCreatedDialog({ plain, onClose }: ApiTokenCreatedDialogProps) {
  const t = useTranslations('admin.apiTokens');
  const tu = useTranslations('ui');
  return (
    <Dialog open={plain !== null} onClose={onClose} label={t('createdTitle')} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <h2 className="text-sm font-semibold">{t('createdTitle')}</h2>
      <p className="mt-2 text-sm text-muted">{t('createdBody')}</p>
      <label htmlFor="api-token-plain" className="mb-1 mt-3 block text-xs text-muted">
        {t('createdLabel')}
      </label>
      <div className="flex min-w-0 items-stretch gap-2">
        <input id="api-token-plain" readOnly value={plain ?? ''} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded border border-line bg-panel2 px-3 py-2 font-mono text-xs" />
        {plain ? <CopyButton key={plain} value={plain} label={t('copy')} copiedLabel={t('copied')} /> : null}
      </div>
      <p role="note" className="mt-3 flex items-start gap-2 rounded bg-[color-mix(in_srgb,var(--priority-high)_14%,transparent)] px-3 py-2 text-xs text-fg">
        <TriangleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--priority-high)]" />
        {t('createdWarning')}
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {t('createdDone')}
        </button>
      </div>
    </Dialog>
  );
}
