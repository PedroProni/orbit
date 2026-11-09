'use client';

import { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/use-workspace';
import { TemplatePickerProps } from './template-picker.types';

export function TemplatePicker({ spaceId, onPick }: TemplatePickerProps) {
  const t = useTranslations('composer');
  const [query, setQuery] = useState('');
  const templates = useTemplates(spaceId);
  const needle = query.trim().toLowerCase();
  const shown = (templates.data ?? []).filter((template) => !needle || template.name.toLowerCase().includes(needle));
  return (
    <div className="w-64 max-w-[calc(100vw-2rem)] p-1">
      <input autoFocus aria-label={t('searchTemplates')} placeholder={t('searchTemplates')} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-1 w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
      <ul role="listbox" aria-label={t('templates')} className="max-h-60 overflow-y-auto">
        {shown.map((template) => (
          <li key={template.id} role="presentation">
            <button type="button" role="option" aria-selected={false} onClick={() => onPick(template)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-panel2">
              <LayoutTemplate size={13} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{template.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {templates.isLoading ? null : shown.length === 0 ? <p className="px-2 py-1.5 text-xs text-muted">{t('noTemplates')}</p> : null}
    </div>
  );
}
