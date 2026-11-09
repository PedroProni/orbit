'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DateField } from '@/components/ui/date-field';
import { Select } from '@/components/ui/select';
import { useCustomFields } from '@/hooks/use-orbit';
import { isoFromDay } from '@/lib/calendar-day';
import { CustomFieldInputProps, TaskCustomFieldsProps } from './task-field.types';
import { customFieldDay, withCustomFieldValue } from './task-custom-fields.helpers';
import { CUSTOM_FIELD_URL_PATTERN, CUSTOM_FIELDS_HIDE_EMPTY_ABOVE } from './task-custom-fields.constants';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';

function UrlInput({ definition, value, onSave }: CustomFieldInputProps) {
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

export function TaskCustomFields({ task, save }: TaskCustomFieldsProps) {
  const t = useTranslations('drawer');
  const definitions = useCustomFields(task.spaceId);
  const [open, setOpen] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);
  if (!definitions.data?.length) return null;
  const valueOf = (fieldId: string) => task.customFields.find((item) => item.fieldId === fieldId)?.value ?? null;
  const saveField = (fieldId: string, value: string | null) => save({ customFields: withCustomFieldValue(task.customFields, fieldId, value) });
  const collapsible = definitions.data.length > CUSTOM_FIELDS_HIDE_EMPTY_ABOVE;
  const empty = definitions.data.filter((definition) => valueOf(definition.id) === null).length;
  const shown = collapsible && !showEmpty ? definitions.data.filter((definition) => valueOf(definition.id) !== null) : definitions.data;
  return (
    <section aria-label={t('customFields')} className="text-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="mb-1 flex items-center gap-1 font-semibold">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {t('customFields')}
      </button>
      {open ? (
        <>
          <ul className="divide-y divide-line border-y border-line">
            {shown.map((definition) => {
              const value = valueOf(definition.id);
              return (
                <li key={definition.id} className="grid min-h-8 grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-2 py-0.5 pl-1">
                  <span className="truncate text-muted" title={definition.name}>
                    {definition.name}
                  </span>
                  <div className="min-w-0">
                    {definition.type === 'dropdown' ? (
                      <Select
                        ariaLabel={definition.name}
                        variant="inline"
                        value={value === null ? '' : String(value)}
                        options={[{ value: '', label: t('emptyValue') }, ...definition.options.map((option) => ({ value: option.id, label: option.label, icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} /> }))]}
                        onChange={(next) => saveField(definition.id, next || null)}
                      />
                    ) : null}
                    {definition.type === 'date' ? <DateField ariaLabel={definition.name} variant="inline" value={customFieldDay(value)} onChange={(day) => saveField(definition.id, isoFromDay(day))} /> : null}
                    {definition.type === 'url' ? <UrlInput key={String(value)} definition={definition} value={value} onSave={(next) => saveField(definition.id, next)} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {collapsible && empty > 0 ? (
            <button type="button" className="mt-1 text-xs text-muted hover:text-fg" onClick={() => setShowEmpty((current) => !current)}>
              {showEmpty ? t('hideEmptyFields') : t('showEmptyFields', { count: empty })}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
