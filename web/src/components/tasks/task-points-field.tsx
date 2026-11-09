'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { TaskPointsFieldProps } from './task-field.types';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';

export function TaskPointsField({ value, readOnly, onSave }: TaskPointsFieldProps) {
  const t = useTranslations('drawer');
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const commit = () => {
    const parsed = draft.trim() === '' ? null : Number(draft);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    if (parsed !== value) onSave(parsed);
  };
  return (
    <input
      type="number"
      aria-label={t('points')}
      placeholder={t('empty')}
      min={0}
      step="any"
      disabled={readOnly}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.currentTarget.blur();
      }}
      className={cn(INLINE_INPUT_CLASS, 'disabled:opacity-60')}
    />
  );
}
