'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';
import { SLOT_ADD_CLASS, TASK_LINK_MAX_LENGTH, TASK_LINK_URL_PATTERN, URL_PROTOCOL_PATTERN } from './task-link-slots.constants';
import { TaskUrlSlotProps } from './task-link-slots.types';

export function TaskUrlSlot({ label, addLabel, value, readOnly, onSave }: TaskUrlSlotProps) {
  const t = useTranslations('drawer');
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const cancel = () => {
    setDraft(null);
    setInvalid(false);
  };
  const commit = () => {
    const next = (draft ?? '').trim();
    if (next && (next.length > TASK_LINK_MAX_LENGTH || !TASK_LINK_URL_PATTERN.test(next))) {
      setInvalid(true);
      return;
    }
    cancel();
    if (next !== (value ?? '')) onSave(next || null);
  };
  if (draft !== null) {
    return (
      <div className="space-y-0.5">
        <input
          type="url"
          autoFocus
          aria-label={label}
          aria-invalid={invalid}
          placeholder={t('urlPlaceholder')}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              cancel();
            }
          }}
          className={INLINE_INPUT_CLASS}
        />
        {invalid ? (
          <p role="alert" className="px-1.5 text-xs text-danger">
            {t('invalidLink')}
          </p>
        ) : null}
      </div>
    );
  }
  if (!value) {
    return readOnly ? (
      <span className="px-1.5 text-muted">{t('emptyValue')}</span>
    ) : (
      <button type="button" onClick={() => setDraft('')} className={SLOT_ADD_CLASS}>
        {addLabel}
      </button>
    );
  }
  return (
    <span className="group flex min-w-0 items-center gap-1 px-1.5">
      <a href={value} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-accent hover:underline" title={value}>
        {value.replace(URL_PROTOCOL_PATTERN, '')}
      </a>
      {readOnly ? null : (
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" aria-label={t('editLink', { name: label })} onClick={() => setDraft(value)} className="rounded p-0.5 text-muted hover:text-fg">
            <Pencil size={12} />
          </button>
          <button type="button" aria-label={t('clearLink', { name: label })} onClick={() => onSave(null)} className="rounded p-0.5 text-muted hover:text-danger">
            <X size={12} />
          </button>
        </span>
      )}
    </span>
  );
}
