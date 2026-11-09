'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { TagPicker } from './tag-picker';
import { tagColor } from './task-helpers';
import { TaskTagsFieldProps } from './task-field.types';
import { TAG_ADD_EMPTY_CLASS, TAG_ADD_ICON_CLASS, TAG_CHIP_CLASS, TAG_REMOVE_CLASS } from './task-tags-field.constants';

export function TaskTagsField({ tags, suggestions, readOnly, onAdd, onRemove }: TaskTagsFieldProps) {
  const t = useTranslations('drawer');
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  if (readOnly && tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('tags')}>
      {tags.map((tag) => (
        <span key={tag} data-tag-color={tagColor(tag)} className={TAG_CHIP_CLASS} style={{ backgroundColor: `color-mix(in srgb, ${tagColor(tag)} 22%, transparent)`, color: `color-mix(in srgb, ${tagColor(tag)} var(--status-ink), var(--text))` }}>
          {tag}
          {readOnly ? null : (
            <button type="button" aria-label={t('removeTag', { tag })} onClick={() => onRemove(tag)} className={TAG_REMOVE_CLASS}>
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {readOnly ? null : (
        <>
          <button ref={anchor} type="button" aria-label={t('addTag')} title={t('addTag')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={tags.length > 0 ? TAG_ADD_ICON_CLASS : TAG_ADD_EMPTY_CLASS}>
            {tags.length > 0 ? <Plus size={12} /> : t('empty')}
          </button>
          <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('tags')} role="dialog">
            <TagPicker label={t('tags')} selected={tags} suggestions={suggestions} onToggle={(tag) => (tags.includes(tag) ? onRemove(tag) : onAdd(tag))} />
          </Popover>
        </>
      )}
    </div>
  );
}
