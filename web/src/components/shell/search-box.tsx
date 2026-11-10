'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearch } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SM_MEDIA_QUERY } from '@/config/breakpoints.constants';

export function SearchBox() {
  const t = useTranslations('search');
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const openTask = useUiStore((s) => s.openTask);
  const result = useSearch(debounced);
  const wide = useMediaQuery(SM_MEDIA_QUERY);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 250);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative min-w-0 max-w-md">
      <Search size={14} className="absolute left-2 top-2.5 text-muted" />
      <input data-shortcut="search" aria-label={t('label')} placeholder={t(wide ? 'placeholder' : 'placeholderShort')} value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded border border-line bg-panel2 py-1.5 pl-7 pr-2 text-sm" />
      {debounced.trim().length >= 2 && result.data ? (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-auto rounded border border-line bg-panel shadow-lg">
          {result.data.tasks.length === 0 && result.data.comments.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{t('empty')}</li> : null}
          {result.data.tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-panel2"
                onClick={() => {
                  openTask(task.id);
                  setValue('');
                }}
              >
                {task.title}
              </button>
            </li>
          ))}
          {result.data.comments.map((comment) => (
            <li key={comment.id}>
              <button
                type="button"
                className="block w-full truncate px-3 py-2 text-left text-sm text-muted hover:bg-panel2"
                onClick={() => {
                  openTask(comment.taskId);
                  setValue('');
                }}
              >
                {t('inComment')}: {comment.bodyMd.slice(0, 80)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
