'use client';

import { useRef, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { useMembers } from '@/hooks/use-orbit';
import { useStatusLabel } from '@/hooks/use-status-label';
import { cn } from '@/lib/cn';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';
import { FilterChip, FiltersBarProps } from './filters-bar.types';

const toggled = (values: string[], value: string): string[] => (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

export function FiltersBar({ space }: FiltersBarProps) {
  const t = useTranslations('filters');
  const filters = useUiStore((s) => s.filters);
  const setFilters = useUiStore((s) => s.setFilters);
  const members = useMembers();
  const statusLabel = useStatusLabel();
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const nameOf = (id: string) => members.data?.find((member) => member.id === id)?.name ?? id;
  const chips: FilterChip[] = [
    ...filters.statuses.map((value) => ({ key: `status-${value}`, label: t('chipStatus', { value: statusLabel(value) }), clear: () => setFilters({ statuses: filters.statuses.filter((item) => item !== value) }) })),
    ...filters.assigneeIds.map((value) => ({ key: `assignee-${value}`, label: t('chipAssignee', { value: nameOf(value) }), clear: () => setFilters({ assigneeIds: filters.assigneeIds.filter((item) => item !== value) }) })),
    ...(filters.unassigned ? [{ key: 'unassigned', label: t('chipUnassigned'), clear: () => setFilters({ unassigned: false }) }] : []),
    ...filters.tags.map((value) => ({ key: `tag-${value}`, label: t('chipTag', { value }), clear: () => setFilters({ tags: filters.tags.filter((item) => item !== value) }) })),
    ...(filters.includeClosed ? [] : [{ key: 'closed', label: t('chipOpenOnly'), clear: () => setFilters({ includeClosed: true }) }]),
  ];
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !filters.tags.includes(tag)) setFilters({ tags: [...filters.tags, tag] });
  };
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
      <button
        ref={anchor}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={chips.length ? t('buttonActive', { count: chips.length }) : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn('flex items-center gap-1.5 rounded border px-2 py-1 transition-colors hover:text-fg', chips.length ? 'border-accent text-fg' : 'border-line text-muted')}
      >
        <Filter size={13} />
        {t('button')}
        {chips.length ? <span className="text-xs">{chips.length}</span> : null}
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('button')} role="dialog" className="w-72 max-w-[calc(100vw-2rem)]">
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-3 text-sm">
          <fieldset>
            <legend className="mb-1 text-xs text-muted">{t('status')}</legend>
            <div className="flex flex-wrap gap-1">
              {(space?.statuses ?? []).map((status) => (
                <button
                  key={status.name}
                  type="button"
                  aria-pressed={filters.statuses.includes(status.name)}
                  onClick={() => setFilters({ statuses: toggled(filters.statuses, status.name) })}
                  className={cn('rounded border px-1.5 py-0.5 text-xs transition-colors', filters.statuses.includes(status.name) ? 'border-accent bg-accentsoft text-fg' : 'border-line text-muted hover:text-fg')}
                >
                  {statusLabel(status.name)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t('tag')}</span>
            <input
              aria-label={t('tag')}
              placeholder={t('tagPlaceholder')}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                addTag(event.currentTarget.value);
                event.currentTarget.value = '';
              }}
              className="w-full rounded border border-line bg-panel2 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={filters.includeClosed} onChange={(e) => setFilters({ includeClosed: e.target.checked })} />
            {t('includeClosed')}
          </label>
        </div>
      </Popover>
      {chips.map((chip) => (
        <span key={chip.key} className="anim-fade-in flex max-w-56 items-center gap-1 rounded bg-accentsoft px-1.5 py-0.5 text-xs">
          <span className="min-w-0 truncate">{chip.label}</span>
          <button type="button" aria-label={t('removeChip', { filter: chip.label })} onClick={chip.clear} className="shrink-0 text-muted hover:text-fg">
            <X size={11} />
          </button>
        </span>
      ))}
      {chips.length ? (
        <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}>
          {t('clear')}
        </button>
      ) : null}
    </div>
  );
}
