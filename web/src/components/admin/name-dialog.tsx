'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_NAME_MAX_LENGTH, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { NameDialogProps } from './admin.types';

function NameDialogBody({ title, initial = '', submitLabel, maxLength = ADMIN_NAME_MAX_LENGTH, onSubmit, onClose }: NameDialogProps) {
  const t = useTranslations('admin');
  const errorText = useApiErrorText();
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <form onSubmit={(event) => void submit(event)} className="space-y-3" noValidate>
        <div>
          <label htmlFor="admin-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="admin-name" value={name} maxLength={maxLength} onChange={(event) => setName(event.target.value)} className={ADMIN_FIELD_CLASS} />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export function NameDialog(props: NameDialogProps) {
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.title} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <NameDialogBody {...props} />
    </Dialog>
  );
}
