'use client';

import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { AutomationSecretDialogProps } from './automation.types';

export function AutomationSecretDialog({ secret, onClose }: AutomationSecretDialogProps) {
  const t = useTranslations('admin.automations');
  const tu = useTranslations('ui');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const close = () => {
    setCopied(false);
    onClose();
  };
  return (
    <Dialog open={secret !== null} onClose={close} label={t('secretTitle')} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <h2 className="text-sm font-semibold">{t('secretTitle')}</h2>
      <p className="mt-2 text-sm text-muted">{t('secretBody')}</p>
      <label htmlFor="automation-secret" className="mb-1 mt-3 block text-xs text-muted">
        {t('secretLabel')}
      </label>
      <div className="flex min-w-0 items-stretch gap-2">
        <input id="automation-secret" readOnly value={secret ?? ''} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded border border-line bg-panel2 px-3 py-2 font-mono text-xs" />
        <button type="button" onClick={() => void copy()} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
      <p role="note" className="mt-3 flex items-start gap-2 rounded bg-[color-mix(in_srgb,var(--priority-high)_14%,transparent)] px-3 py-2 text-xs text-fg">
        <TriangleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--priority-high)]" />
        {t('secretWarning')}
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={close} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {t('secretDone')}
        </button>
      </div>
    </Dialog>
  );
}
