'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, ADMIN_WIDE_DIALOG_PANEL_CLASS } from './admin.constants';
import { API_TOKEN_NAME_MAX_LENGTH, API_TOKEN_SCOPE_KEYS } from './api-tokens.constants';
import { apiTokenProblem } from './api-tokens.helpers';
import { ApiTokenDialogProps } from './api-tokens.types';

function ApiTokenDialogBody({ available, onSubmit, onCreated, onClose }: ApiTokenDialogProps) {
  const t = useTranslations('admin');
  const tt = useTranslations('admin.apiTokens');
  const errorText = useApiErrorText();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toggle = (scope: string, on: boolean) => setScopes((current) => (on ? [...current, scope] : current.filter((item) => item !== scope)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = apiTokenProblem(name, scopes);
    if (problem) {
      setError(tt(`problems.${problem}`));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await onSubmit({ name: name.trim(), scopes: available.filter((scope) => scopes.includes(scope)) });
      onClose();
      onCreated(created.token);
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <h2 className="border-b border-line px-5 py-4 text-sm font-semibold">{tt('createTitle')}</h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div>
          <label htmlFor="api-token-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="api-token-name" value={name} maxLength={API_TOKEN_NAME_MAX_LENGTH} onChange={(event) => setName(event.target.value)} className={ADMIN_FIELD_CLASS} />
        </div>
        <fieldset>
          <legend className={ADMIN_LABEL_CLASS}>{tt('scopesLabel')}</legend>
          <p className="mb-2 text-xs text-muted">{tt('scopesHint')}</p>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {available.map((scope) => (
              <li key={scope}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={scopes.includes(scope)} onChange={(event) => toggle(scope, event.target.checked)} />
                  {tt(`scopes.${API_TOKEN_SCOPE_KEYS[scope]}`)}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          {t('cancel')}
        </button>
        <button type="submit" disabled={busy} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {t('create')}
        </button>
      </div>
    </form>
  );
}

export function ApiTokenDialog(props: ApiTokenDialogProps) {
  const tt = useTranslations('admin.apiTokens');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={tt('createTitle')} closeLabel={tu('close')} panelClassName={ADMIN_WIDE_DIALOG_PANEL_CLASS}>
      {props.open ? <ApiTokenDialogBody {...props} /> : null}
    </Dialog>
  );
}
