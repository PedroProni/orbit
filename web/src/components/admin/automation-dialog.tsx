'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { AUTOMATION_ALL_LISTS, AUTOMATION_DIALOG_PANEL_CLASS, AUTOMATION_NAME_MAX_LENGTH } from './automation.constants';
import { automationProblem, automationStatusNames, draftFromAutomation, draftToInput, emptyAutomationDraft } from './automation.helpers';
import { AutomationDialogProps, AutomationDraft } from './automation.types';
import { AutomationActionFields } from './automation-action-fields';
import { AutomationTriggerFields } from './automation-trigger-fields';

function AutomationDialogBody({ automation, spaces, members, onSubmit, onSaved, onClose }: AutomationDialogProps) {
  const t = useTranslations('admin');
  const ta = useTranslations('admin.automations');
  const errorText = useApiErrorText();
  const [draft, setDraft] = useState<AutomationDraft>(() => (automation ? draftFromAutomation(automation) : emptyAutomationDraft()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const statuses = automationStatusNames(spaces, draft.listId);
  const change = (patch: Partial<AutomationDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const scopeOptions = [{ value: AUTOMATION_ALL_LISTS, label: ta('scopeAll') }, ...spaces.flatMap((space) => space.lists.map((list) => ({ value: list.id, label: ta('scopeList', { space: space.name, list: list.name }) })))];
  const canRotate = !!automation && automation.actionType === 'webhook' && draft.actionType === 'webhook';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = automationProblem(draft);
    if (problem) {
      setError(ta(`problems.${problem}`));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await onSubmit(draftToInput(draft));
      onClose();
      onSaved(saved);
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <h2 className="border-b border-line px-5 py-4 text-sm font-semibold">{automation ? ta('editTitle') : ta('createTitle')}</h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div>
          <label htmlFor="automation-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="automation-name" value={draft.name} maxLength={AUTOMATION_NAME_MAX_LENGTH} onChange={(event) => change({ name: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <span className={ADMIN_LABEL_CLASS}>{ta('scopeLabel')}</span>
          <Select ariaLabel={ta('scopeLabel')} value={draft.listId} onChange={(listId) => change({ listId })} options={scopeOptions} />
        </div>
        <AutomationTriggerFields draft={draft} statuses={statuses} members={members} onChange={change} />
        <AutomationActionFields draft={draft} statuses={statuses} members={members} onChange={change} />
        {canRotate ? (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line p-3 text-sm">
            <input type="checkbox" checked={draft.rotateSecret} onChange={(event) => change({ rotateSecret: event.target.checked })} className="mt-0.5 accent-accent" />
            <span className="min-w-0">
              <span className="block font-medium">{ta('rotateSecret')}</span>
              <span className="block text-xs text-muted">{ta('rotateHint')}</span>
            </span>
          </label>
        ) : null}
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
          {automation ? t('save') : t('create')}
        </button>
      </div>
    </form>
  );
}

export function AutomationDialog(props: AutomationDialogProps) {
  const t = useTranslations('admin.automations');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.automation ? t('editTitle') : t('createTitle')} closeLabel={tu('close')} panelClassName={AUTOMATION_DIALOG_PANEL_CLASS}>
      <AutomationDialogBody key={props.automation?.id ?? 'new'} {...props} />
    </Dialog>
  );
}
