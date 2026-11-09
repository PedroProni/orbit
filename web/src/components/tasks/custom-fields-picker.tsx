'use client';

import { useTranslations } from 'next-intl';
import { DateField } from '@/components/ui/date-field';
import { Select } from '@/components/ui/select';
import { useCustomFields } from '@/hooks/use-orbit';
import { isoFromDay } from '@/lib/calendar-day';
import { customFieldDay, withCustomFieldValue } from './task-custom-fields.helpers';
import { CustomFieldsPickerProps } from './custom-fields-picker.types';

export function CustomFieldsPicker({ spaceId, values, onChange }: CustomFieldsPickerProps) {
  const t = useTranslations('drawer');
  const tc = useTranslations('composer');
  const definitions = useCustomFields(spaceId);
  const valueOf = (fieldId: string) => values.find((item) => item.fieldId === fieldId)?.value ?? null;
  const set = (fieldId: string, value: string | null) => onChange(withCustomFieldValue(values, fieldId, value));
  if (!definitions.data?.length) return <p className="w-56 px-3 py-2 text-xs text-muted">{tc('noCustomFields')}</p>;
  return (
    <div className="w-72 max-w-[calc(100vw-2rem)] space-y-2 p-2 text-sm">
      {definitions.data.map((definition) => {
        const value = valueOf(definition.id);
        return (
          <div key={definition.id} className="min-w-0 space-y-1">
            <span className="block truncate text-xs text-muted">{definition.name}</span>
            {definition.type === 'dropdown' ? (
              <Select
                ariaLabel={definition.name}
                value={value === null ? '' : String(value)}
                options={[{ value: '', label: t('noValue') }, ...definition.options.map((option) => ({ value: option.id, label: option.label, icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} /> }))]}
                onChange={(next) => set(definition.id, next || null)}
              />
            ) : null}
            {definition.type === 'date' ? <DateField ariaLabel={definition.name} value={customFieldDay(value)} onChange={(day) => set(definition.id, isoFromDay(day))} /> : null}
            {definition.type === 'url' ? (
              <input
                type="url"
                aria-label={definition.name}
                placeholder={t('urlPlaceholder')}
                value={value === null ? '' : String(value)}
                onChange={(e) => set(definition.id, e.target.value.trim() || null)}
                className="block min-h-8 w-full min-w-0 rounded border border-line bg-panel2 px-2 py-1 text-sm"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
