'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MarkdownView } from '@/components/common/markdown-view';
import { TaskDescriptionProps } from './task-description.types';

export function TaskDescription({ value, readOnly, onSave }: TaskDescriptionProps) {
  const t = useTranslations('drawer');
  const [draft, setDraft] = useState<string | null>(null);
  if (draft !== null) {
    const save = () => {
      if (draft !== value) onSave(draft);
      setDraft(null);
    };
    return (
      <section aria-label={t('description')} className="space-y-2">
        <textarea
          autoFocus
          aria-label={t('description')}
          placeholder={t('addDescription')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setDraft(null);
            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          rows={8}
          className="w-full rounded border border-line bg-panel2 p-2 text-[13px] leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <button type="button" className="rounded bg-accent px-3 py-1 text-xs text-white" onClick={save}>
            {t('save')}
          </button>
          <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => setDraft(null)}>
            {t('cancel')}
          </button>
        </div>
      </section>
    );
  }
  if (!value.trim()) {
    return readOnly ? null : (
      <button type="button" onClick={() => setDraft('')} className="w-full rounded px-1.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-panel2">
        {t('addDescription')}
      </button>
    );
  }
  return (
    <section aria-label={t('description')} className="group relative">
      {readOnly ? null : (
        <button type="button" aria-label={t('editDescription')} onClick={() => setDraft(value)} className="absolute right-0 top-0 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-panel2 hover:text-fg group-hover:opacity-100 focus-visible:opacity-100">
          <Pencil size={13} />
        </button>
      )}
      <div
        className={readOnly ? 'text-[13px]' : 'cursor-text rounded px-1.5 py-1 text-[13px] transition-colors hover:bg-panel2/50'}
        onClick={(e) => {
          if (readOnly || (e.target as HTMLElement).closest('a')) return;
          setDraft(value);
        }}
      >
        <MarkdownView source={value} />
      </div>
    </section>
  );
}
