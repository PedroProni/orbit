'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearch } from '@/hooks/use-orbit';
import { BLOCKER_SEARCH_MIN } from './create-task.constants';
import { BlockerPickerProps } from './create-task.types';

export function BlockerPicker({ selected, onToggle }: BlockerPickerProps) {
  const t = useTranslations('createTask');
  const [query, setQuery] = useState('');
  const search = useSearch(query);
  const results = query.trim().length >= BLOCKER_SEARCH_MIN ? (search.data?.tasks ?? []) : [];
  return (
    <div className="w-72 max-w-[calc(100vw-2rem)] p-1">
      <input autoFocus aria-label={t('searchBlockers')} placeholder={t('searchBlockers')} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-1 w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
      <ul role="listbox" aria-label={t('extras.dependencies')} className="max-h-60 overflow-y-auto">
        {results.map((task) => {
          const chosen = selected.some((item) => item.id === task.id);
          return (
            <li key={task.id} role="presentation">
              <button type="button" role="option" aria-selected={chosen} onClick={() => onToggle({ id: task.id, title: task.title })} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-panel2">
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                {chosen ? <Check size={14} className="shrink-0 text-accent" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {query.trim().length < BLOCKER_SEARCH_MIN ? <p className="px-2 py-1.5 text-xs text-muted">{t('blockersHint')}</p> : results.length === 0 && !search.isFetching ? <p className="px-2 py-1.5 text-xs text-muted">{t('noBlockers')}</p> : null}
    </div>
  );
}
