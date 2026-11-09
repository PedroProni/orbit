'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { CustomFieldType } from '@/types/api.types';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, CUSTOM_FIELD_TYPES, FIELD_NAME_MAX_LENGTH } from './admin.constants';
import { CustomFieldDialogProps } from './admin.types';
import { customFieldProblem } from './custom-field.helpers';
import { ValueChips } from './value-chips';

function CustomFieldDialogBody({ onSubmit, onClose }: CustomFieldDialogProps) {
  const t = useTranslations('admin');
  const errorText = useApiErrorText();
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('dropdown');
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input = {
      name: name.trim(),
      type,
      options: type === 'dropdown' ? options : [],
    };
    const problem = customFieldProblem(input);
    if (problem) {
      setError(t(problem === 'nameRequired' ? 'nameRequired' : 'customFields.optionsRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(input);
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="mb-4 text-sm font-semibold">{t('customFields.createTitle')}</h2>
      <form onSubmit={(event) => void submit(event)} className="space-y-3" noValidate>
        <div>
          <label htmlFor="admin-field-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="admin-field-name" value={name} maxLength={FIELD_NAME_MAX_LENGTH} onChange={(event) => setName(event.target.value)} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <span className={ADMIN_LABEL_CLASS}>{t('customFields.type')}</span>
          <Select
            ariaLabel={t('customFields.type')}
            value={type}
            onChange={(value) => setType(value as CustomFieldType)}
            options={CUSTOM_FIELD_TYPES.map((value) => ({
              value,
              label: t(`customFields.types.${value}`),
            }))}
          />
        </div>
        {type === 'dropdown' ? <ValueChips inputId="admin-field-options" label={t('customFields.options')} hint={t('customFields.optionsHint')} values={options} onChange={setOptions} /> : null}
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
            {t('create')}
          </button>
        </div>
      </form>
    </>
  );
}

export function CustomFieldDialog(props: CustomFieldDialogProps) {
  const t = useTranslations('admin');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={t('customFields.createTitle')} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <CustomFieldDialogBody {...props} />
    </Dialog>
  );
}
