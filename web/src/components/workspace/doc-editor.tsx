'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MarkdownView } from '@/components/common/markdown-view';
import { EDITOR_ACTIONS, EDITOR_ICONS } from './docs.constants';
import { wrapSelection } from './docs.helpers';

export function DocEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('docs');
  const ref = useRef<HTMLTextAreaElement>(null);
  const apply = (before: string, after: string) => {
    const el = ref.current;
    if (!el) return;
    const next = wrapSelection(value, el.selectionStart, el.selectionEnd, before, after);
    onChange(next.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.cursor, next.cursor);
    });
  };
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div role="toolbar" aria-label={t('toolbar')} className="flex gap-1 border-b border-line bg-panel px-2 py-1">
        {EDITOR_ACTIONS.map((action) => {
          const Icon = EDITOR_ICONS[action.key];
          return (
            <button key={action.key} type="button" aria-label={t(`actions.${action.key}`)} title={t(`actions.${action.key}`)} onClick={() => apply(action.before, action.after)} className="rounded p-1.5 text-muted hover:bg-panel2 hover:text-fg">
              <Icon size={14} />
            </button>
          );
        })}
      </div>
      <div className="grid md:grid-cols-2">
        <textarea ref={ref} aria-label={t('bodyField')} value={value} onChange={(e) => onChange(e.target.value)} rows={16} className="w-full resize-none bg-panel2 p-3 font-mono text-sm outline-none md:border-r md:border-line" />
        <div className="p-3" aria-label={t('preview')}>
          <MarkdownView source={value} />
        </div>
      </div>
    </div>
  );
}
