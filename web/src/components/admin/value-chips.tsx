'use client';

import { KeyboardEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { ValueChipsProps } from './admin.types';

export function ValueChips({ label, hint, values, onChange, inputId }: ValueChipsProps) {
  const t = useTranslations('admin.statuses');
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (value && !values.some((current) => current.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    add();
  };

  return (
    <div>
      <label htmlFor={inputId} className={ADMIN_LABEL_CLASS}>
        {label}
      </label>
      {values.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1">
          {values.map((value) => (
            <li key={value} className="flex items-center gap-1 rounded-full bg-panel2 py-0.5 pl-2 pr-1 text-xs">
              {value}
              <button type="button" aria-label={t('removeValue', { value })} onClick={() => onChange(values.filter((current) => current !== value))} className="rounded-full p-0.5 text-muted hover:text-fg">
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <input id={inputId} value={draft} placeholder={t('valuePlaceholder')} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} className={ADMIN_FIELD_CLASS} />
        <button type="button" onClick={add} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          {t('addValue')}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
