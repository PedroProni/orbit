import { useTranslations } from 'next-intl';
import { TAG_CHIP_CLASS } from './task-tags-field.constants';
import { tagColor } from './task-helpers';
import { TagChipsProps } from './tag-chips.types';

export function TagChips({ tags, max }: TagChipsProps) {
  const t = useTranslations('tasks.indicators');
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const hidden = tags.length - shown.length;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {shown.map((tag) => (
        <span
          key={tag}
          data-tag-color={tagColor(tag)}
          className={`${TAG_CHIP_CLASS} max-w-[140px] truncate`}
          style={{ backgroundColor: `color-mix(in srgb, ${tagColor(tag)} 22%, transparent)`, color: `color-mix(in srgb, ${tagColor(tag)} var(--status-ink), var(--text))` }}
        >
          <span className="truncate">{tag}</span>
        </span>
      ))}
      {hidden > 0 ? (
        <span className="text-[11px] text-muted" title={tags.slice(max).join(', ')}>
          {t('moreTags', { count: hidden })}
        </span>
      ) : null}
    </span>
  );
}
