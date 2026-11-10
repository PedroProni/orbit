'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DateField } from '@/components/ui/date-field';
import { Select } from '@/components/ui/select';
import { useCustomFields } from '@/hooks/use-orbit';
import { isoFromDay } from '@/lib/calendar-day';
import { CustomFieldInputProps, TaskCustomFieldsProps } from './task-field.types';
import { customFieldDay, fieldsForTask, withCustomFieldValue } from './task-custom-fields.helpers';
import { TaskFieldRow } from './task-field-row';
import { CUSTOM_FIELD_FALLBACK_ICON, CUSTOM_FIELD_TYPE_ICONS, CUSTOM_FIELD_URL_PATTERN, CUSTOM_FIELDS_HIDE_EMPTY_ABOVE } from './task-custom-fields.constants';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';

function UrlInput({ definition, value, onSave, readOnly = false }: CustomFieldInputProps) {
  const t = useTranslations('drawer');
  const current = value === null ? '' : String(value);
  const [draft, setDraft] = useState(current);
  const commit = () => {
    const next = draft.trim();
    if (next !== current) onSave(next || null);
  };
  return (
    <span className="flex items-center gap-1">
      <input
        type="url"
        readOnly={readOnly}
        aria-label={definition.name}
        placeholder={t('emptyValue')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          e.currentTarget.blur();
        }}
        className={INLINE_INPUT_CLASS}
      />
      {CUSTOM_FIELD_URL_PATTERN.test(current) ? (
        <a href={current} target="_blank" rel="noopener noreferrer" aria-label={t('openLink', { name: definition.name })} className="shrink-0 text-muted hover:text-fg">
          <ExternalLink size={14} />
        </a>
      ) : null}
    </span>
  );
}

export function TaskCustomFieldRows({ task, save, readOnly = false }: TaskCustomFieldsProps) {
  const t = useTranslations('drawer');
  const definitions = useCustomFields(task.spaceId);
  const [showEmpty, setShowEmpty] = useState(false);
  const fields = fieldsForTask(definitions.data ?? [], task);
  if (!fields.length) return null;
  const valueOf = (fieldId: string) => task.customFields.find((item) => item.fieldId === fieldId)?.value ?? null;
  const saveField = (fieldId: string, value: string | null) => save({ customFields: withCustomFieldValue(task.customFields, fieldId, value) });
  const empty = fields.filter((definition) => valueOf(definition.id) === null).length;
  const collapsible = fields.length > CUSTOM_FIELDS_HIDE_EMPTY_ABOVE || empty === fields.length;
  const shown = collapsible && !showEmpty ? fields.filter((definition) => valueOf(definition.id) !== null) : fields;
  return (
    <>
      {shown.map((definition) => {
        const value = valueOf(definition.id);
        return (
          <TaskFieldRow key={definition.id} icon={CUSTOM_FIELD_TYPE_ICONS[definition.type] ?? CUSTOM_FIELD_FALLBACK_ICON} label={definition.name}>
            {definition.type === 'dropdown' ? (
              <Select
                ariaLabel={definition.name}
                variant="inline"
                disabled={readOnly}
                placeholder={t('emptyValue')}
                value={value === null ? '' : String(value)}
                options={[{ value: '', label: t('emptyValue') }, ...definition.options.map((option) => ({ value: option.id, label: option.label, icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} /> }))]}
                onChange={(next) => saveField(definition.id, next || null)}
              />
            ) : null}
            {definition.type === 'date' ? <DateField ariaLabel={definition.name} variant="inline" disabled={readOnly} placeholder={t('emptyValue')} value={customFieldDay(value)} onChange={(day) => saveField(definition.id, isoFromDay(day))} /> : null}
            {definition.type === 'url' ? <UrlInput key={String(value)} definition={definition} value={value} readOnly={readOnly} onSave={(next) => saveField(definition.id, next)} /> : null}
          </TaskFieldRow>
        );
      })}
      {collapsible && empty > 0 ? (
        <li className="py-1 pl-1">
          <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => setShowEmpty((current) => !current)}>
            {showEmpty ? t('hideEmptyFields') : t('showEmptyFields', { count: empty })}
          </button>
        </li>
      ) : null}
    </>
  );
}
