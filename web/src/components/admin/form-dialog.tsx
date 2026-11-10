'use client';

import { FormEvent, useState } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, ADMIN_WIDE_DIALOG_PANEL_CLASS } from './admin.constants';
import { FORM_MAX_FIELDS, FORM_NAME_MAX_LENGTH } from './forms.constants';
import { draftFromForm, draftToInput, emptyFormDraft, emptyFormField, formProblem } from './forms.helpers';
import { FormDialogProps, FormDraft, FormFieldDraft } from './forms.types';
import { FormFieldEditor } from './form-field-editor';

function FormDialogBody({ form, spaces, onSubmit, onClose }: FormDialogProps) {
  const t = useTranslations('admin');
  const tf = useTranslations('admin.forms');
  const errorText = useApiErrorText();
  const [draft, setDraft] = useState<FormDraft>(() => (form ? draftFromForm(form) : emptyFormDraft(spaces)));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listOptions = spaces.flatMap((space) => space.lists.map((list) => ({ value: list.id, label: tf('listOption', { space: space.name, list: list.name }) })));
  const change = (patch: Partial<FormDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const changeField = (key: string, patch: Partial<FormFieldDraft>) => change({ fields: draft.fields.map((field) => (field.key === key ? { ...field, ...patch } : field)) });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = formProblem(draft);
    if (problem) {
      setError(tf(`problems.${problem}`));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draftToInput(draft));
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <h2 className="border-b border-line px-5 py-4 text-sm font-semibold">{form ? tf('editTitle') : tf('createTitle')}</h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {form?.paused ? (
          <p role="note" className="flex items-start gap-2 rounded bg-[color-mix(in_srgb,var(--priority-high)_14%,transparent)] px-3 py-2 text-xs text-fg">
            <TriangleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--priority-high)]" />
            {tf('pausedSaveNote')}
          </p>
        ) : null}
        <div>
          <label htmlFor="form-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="form-name" value={draft.name} maxLength={FORM_NAME_MAX_LENGTH} onChange={(event) => change({ name: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <span className={ADMIN_LABEL_CLASS}>{tf('listLabel')}</span>
          <Select ariaLabel={tf('listLabel')} value={draft.listId} placeholder={tf('listPlaceholder')} onChange={(listId) => change({ listId })} options={listOptions} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.active} onChange={(event) => change({ active: event.target.checked })} />
          {tf('acceptingLabel')}
        </label>
        <fieldset>
          <legend className={ADMIN_LABEL_CLASS}>{tf('fieldsLabel')}</legend>
          <p className="mb-2 text-xs text-muted">{tf('fieldsHint')}</p>
          <ul className="space-y-2">
            {draft.fields.map((field, index) => (
              <FormFieldEditor
                key={field.key}
                field={field}
                index={index}
                canRemove={draft.fields.length > 1}
                onChange={(patch) => changeField(field.key, patch)}
                onRemove={() => change({ fields: draft.fields.filter((item) => item.key !== field.key) })}
              />
            ))}
          </ul>
          <button
            type="button"
            disabled={draft.fields.length >= FORM_MAX_FIELDS}
            onClick={() => change({ fields: [...draft.fields, emptyFormField('description', false)] })}
            className={`${ADMIN_SECONDARY_BUTTON_CLASS} mt-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Plus size={14} aria-hidden="true" />
            {tf('addField')}
          </button>
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
          {form ? t('save') : t('create')}
        </button>
      </div>
    </form>
  );
}

export function FormDialog(props: FormDialogProps) {
  const tf = useTranslations('admin.forms');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.form ? tf('editTitle') : tf('createTitle')} closeLabel={tu('close')} panelClassName={ADMIN_WIDE_DIALOG_PANEL_CLASS}>
      <FormDialogBody key={props.form?.id ?? 'new'} {...props} />
    </Dialog>
  );
}
