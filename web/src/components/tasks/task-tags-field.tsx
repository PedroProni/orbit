'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { TagPicker } from './tag-picker';
import { TaskTagsFieldProps } from './task-field.types';

export function TaskTagsField({ tags, suggestions, readOnly, onAdd, onRemove }: TaskTagsFieldProps) {
  const t = useTranslations('drawer');
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  if (readOnly && tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('tags')}>
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded bg-panel2 px-2 py-0.5 text-xs text-muted">
          {tag}
          {readOnly ? null : (
            <button type="button" aria-label={t('removeTag', { tag })} onClick={() => onRemove(tag)} className="hover:text-fg">
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {readOnly ? null : (
        <>
          <button ref={anchor} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex items-center gap-1 rounded border border-dashed border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
            <Plus size={11} />
            {t('addTag')}
          </button>
          <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('tags')} role="dialog">
            <TagPicker label={t('tags')} selected={tags} suggestions={suggestions} onToggle={(tag) => (tags.includes(tag) ? onRemove(tag) : onAdd(tag))} />
          </Popover>
        </>
      )}
    </div>
  );
}
