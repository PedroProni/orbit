'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { StatusType } from '@/types/api.types';
import { ADMIN_FIELD_CLASS, ADMIN_ICON_BUTTON_CLASS, EXTRA_STATUS_STAGES, STATUS_COLOR_CHOICES, STATUS_NAME_MAX_LENGTH } from './admin.constants';
import { StatusRowProps } from './admin.types';

export function StatusRow({ status, position, canMoveUp, canMoveDown, onChange, onMove, onRemove }: StatusRowProps) {
  const t = useTranslations('admin.statuses');
  const label = status.name.trim() || t('newStatus');
  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-40">
        <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
        <input aria-label={t('nameFor', { position })} value={status.name} maxLength={STATUS_NAME_MAX_LENGTH} onChange={(event) => onChange({ ...status, name: event.target.value })} className={cn(ADMIN_FIELD_CLASS, 'min-w-0 flex-1 py-1.5')} />
      </div>
      <div className="w-36 shrink-0">
        <Select
          ariaLabel={t('stageFor', { name: label })}
          value={status.type}
          onChange={(value) => onChange({ ...status, type: value as StatusType })}
          options={EXTRA_STATUS_STAGES.map((stage) => ({
            value: stage,
            label: t(`stages.${stage}`),
          }))}
        />
      </div>
      <div role="radiogroup" aria-label={t('colorFor', { name: label })} className="flex shrink-0 flex-wrap gap-1">
        {STATUS_COLOR_CHOICES.map((color, index) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={status.color === color}
            aria-label={t('colorOption', { position: index + 1 })}
            onClick={() => onChange({ ...status, color })}
            className={cn('h-5 w-5 rounded-full border-2 transition-transform hover:scale-110', status.color === color ? 'border-fg' : 'border-transparent')}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex shrink-0 items-center">
        <button type="button" aria-label={t('moveUp', { name: label })} disabled={!canMoveUp} onClick={() => onMove(-1)} className={ADMIN_ICON_BUTTON_CLASS}>
          <ArrowUp size={14} />
        </button>
        <button type="button" aria-label={t('moveDown', { name: label })} disabled={!canMoveDown} onClick={() => onMove(1)} className={ADMIN_ICON_BUTTON_CLASS}>
          <ArrowDown size={14} />
        </button>
        <button type="button" aria-label={t('remove', { name: label })} onClick={onRemove} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
