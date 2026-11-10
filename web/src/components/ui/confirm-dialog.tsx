'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { CONFIRM_DIALOG_CANCEL_CLASS, CONFIRM_DIALOG_DANGER_CLASS, CONFIRM_DIALOG_PANEL_CLASS } from './confirm-dialog.constants';
import { ConfirmDialogProps } from './confirm-dialog.types';

function ConfirmDialogBody({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const t = useTranslations('ui');
  const errorText = useApiErrorText();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 mt-2 text-sm text-muted">{message}</p>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={CONFIRM_DIALOG_CANCEL_CLASS}>
          {t('cancel')}
        </button>
        <button type="button" disabled={busy} onClick={() => void confirm()} className={CONFIRM_DIALOG_DANGER_CLASS}>
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.title} closeLabel={tu('close')} panelClassName={CONFIRM_DIALOG_PANEL_CLASS}>
      <ConfirmDialogBody {...props} />
    </Dialog>
  );
}
