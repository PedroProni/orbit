'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { FormFieldTarget } from '@/services/form.types';
import { ADMIN_FIELD_CLASS, ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { FORM_FIELD_LABEL_MAX_LENGTH, FORM_FIELD_TARGETS } from './forms.constants';
import { FormFieldEditorProps } from './forms.types';

export function FormFieldEditor({ field, index, canRemove, onChange, onRemove }: FormFieldEditorProps) {
  const t = useTranslations('admin.forms');
  const position = index + 1;
  return (
    <li className="space-y-2 rounded border border-line bg-panel2/40 p-2">
      <div className="flex items-center gap-2">
        <input
          aria-label={t('fieldLabelFor', { position })}
          placeholder={t('fieldLabelPlaceholder')}
          value={field.label}
          maxLength={FORM_FIELD_LABEL_MAX_LENGTH}
          onChange={(event) => onChange({ label: event.target.value })}
          className={cn(ADMIN_FIELD_CLASS, 'min-w-0 flex-1')}
        />
        <button type="button" aria-label={t('removeFieldFor', { position })} disabled={!canRemove} onClick={onRemove} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            ariaLabel={t('fieldTargetFor', { position })}
            value={field.target}
            onChange={(target) => onChange({ target: target as FormFieldTarget })}
            options={FORM_FIELD_TARGETS.map((target) => ({ value: target, label: t(`targets.${target}`) }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={field.required} onChange={(event) => onChange({ required: event.target.checked })} />
          {t('required')}
        </label>
      </div>
    </li>
  );
}
