'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CREATE_TASK_SUBTASK_MAX } from './create-task.constants';
import { ExtraListEditorProps } from './create-task.types';

export function ExtraListEditor({ label, placeholder, items, onChange, onRemoveSection, removeLabel }: ExtraListEditorProps) {
  const t = useTranslations('createTask');
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (!value || items.length >= CREATE_TASK_SUBTASK_MAX) return;
    onChange([...items, value]);
    setText('');
  };
  return (
    <section aria-label={label} className="space-y-1 rounded border border-line p-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <button type="button" aria-label={removeLabel} onClick={onRemoveSection} className="rounded p-0.5 hover:bg-panel2 hover:text-fg">
          <X size={12} />
        </button>
      </div>
      <ul className="space-y-0.5">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex min-w-0 items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm border border-line" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{item}</span>
            <button type="button" aria-label={t('removeItem', { item })} onClick={() => onChange(items.filter((_, position) => position !== index))} className="text-muted hover:text-danger">
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          e.stopPropagation();
          add();
        }}
        onBlur={add}
        className="w-full rounded border border-line bg-panel2 px-2 py-1 text-sm"
      />
    </section>
  );
}
