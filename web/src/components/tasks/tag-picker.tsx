'use client';

import { KeyboardEvent, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TagPickerProps } from './tag-picker.types';

export function TagPicker({ selected, suggestions, onToggle, label }: TagPickerProps) {
  const t = useTranslations('composer');
  const [query, setQuery] = useState('');
  const typed = query.trim().toLowerCase();
  const known = [...new Set([...suggestions, ...selected])];
  const shown = known.filter((tag) => tag.toLowerCase().includes(typed));
  const existing = known.find((tag) => tag.toLowerCase() === typed);
  const isNew = typed.length > 0 && !existing;
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!typed) return;
    onToggle(existing ?? typed);
    setQuery('');
  };
  return (
    <div className="w-56 p-1">
      <input autoFocus aria-label={label} placeholder={t('tagPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} className="mb-1 w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
      <ul role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-48 overflow-y-auto">
        {shown.map((tag) => {
          const active = selected.includes(tag);
          return (
            <li key={tag} role="presentation">
              <button type="button" role="option" aria-selected={active} onClick={() => onToggle(tag)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-panel2">
                <span className="min-w-0 flex-1 truncate">{tag}</span>
                {active ? <Check size={14} className="shrink-0 text-accent" /> : null}
              </button>
            </li>
          );
        })}
        {isNew ? (
          <li role="presentation">
            <button
              type="button"
              onClick={() => {
                onToggle(typed);
                setQuery('');
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-accent hover:bg-panel2"
            >
              <Plus size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t('createTag', { tag: typed })}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
