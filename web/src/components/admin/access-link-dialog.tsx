'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { FIELD_CLASS } from '@/components/auth/auth.constants';
import { Dialog } from '@/components/ui/dialog';
import { DIALOG_SECONDARY_BUTTON_CLASS, PEOPLE_DIALOG_PANEL_CLASS } from './people.constants';
import { accessLinkUrl } from './people.helpers';
import { AccessLinkDialogProps } from './people.types';

export function AccessLinkDialog({ name, link, onClose }: AccessLinkDialogProps) {
  const t = useTranslations('people');
  const tu = useTranslations('ui');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url = link ? accessLinkUrl(window.location.origin, link.token) : '';

  const close = () => {
    setCopied(false);
    onClose();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <Dialog open={Boolean(link)} onClose={close} label={t('linkTitle')} closeLabel={tu('close')} panelClassName={PEOPLE_DIALOG_PANEL_CLASS}>
      <h2 className="text-sm font-semibold">{t('linkTitle')}</h2>
      {link ? (
        <>
          <p className="mt-2 text-sm text-muted">{t(link.kind === 'reset' ? 'linkResetBody' : 'linkInviteBody', { name })}</p>
          <p className="mt-2 text-sm font-medium">{t('linkOnce', { date: new Date(link.expiresAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}</p>
          <textarea aria-label={t('linkField')} readOnly rows={3} value={url} onFocus={(event) => event.target.select()} className={`${FIELD_CLASS} mt-3 resize-none break-all`} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={close} className={DIALOG_SECONDARY_BUTTON_CLASS}>
              {tu('close')}
            </button>
            <button type="button" onClick={() => void copy()} className="flex shrink-0 items-center gap-1 rounded bg-accent px-3 py-2 text-sm font-medium text-white">
              <Copy size={14} />
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
