'use client';

import { useRef, useState } from 'react';
import { Search, UserRound, Users, UserX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/common/avatar';
import { Popover } from '@/components/ui/popover';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useAssigneeCounts, useMe, useMembers } from '@/hooks/use-orbit';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui.store';
import { assigneeRows } from './assignee-filter.helpers';
import { AssigneeFilterProps } from './assignee-filter.types';

export function AssigneeFilter({ listId }: AssigneeFilterProps) {
  const t = useTranslations('assigneeFilter');
  const filters = useUiStore((s) => s.filters);
  const setFilters = useUiStore((s) => s.setFilters);
  const { member } = useCapabilities();
  const me = useMe();
  const members = useMembers();
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const counts = useAssigneeCounts(listId, filters, open);
  if (!member) return null;
  const meId = me.data?.id;
  const unassigned = !!filters.unassigned;
  const chosen = filters.assigneeIds.length + (unassigned ? 1 : 0);
  const onlyMine = !!meId && !unassigned && filters.assigneeIds.length === 1 && filters.assigneeIds[0] === meId;
  const rows = assigneeRows(members.data ?? [], meId, counts.data, filters.assigneeIds, query);
  const showUnassigned = !query.trim() || t('unassigned').toLowerCase().includes(query.trim().toLowerCase());
  const toggle = (id: string) => setFilters({ assigneeIds: filters.assigneeIds.includes(id) ? filters.assigneeIds.filter((item) => item !== id) : [...filters.assigneeIds, id] });
  const rowClass = 'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-panel2';
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        aria-pressed={onlyMine}
        disabled={!meId}
        onClick={() => meId && setFilters(onlyMine ? { assigneeIds: [] } : { assigneeIds: [meId], unassigned: false })}
        title={t('meHint')}
        className={cn('flex items-center gap-1.5 rounded border px-2 py-1 transition-colors hover:text-fg', onlyMine ? 'border-accent bg-accentsoft text-fg' : 'border-line text-muted')}
      >
        <UserRound size={13} />
        {t('me')}
      </button>
      <button
        ref={anchor}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={chosen ? t('buttonActive', { count: chosen }) : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn('flex items-center gap-1.5 rounded border px-2 py-1 transition-colors hover:text-fg', chosen ? 'border-accent text-fg' : 'border-line text-muted')}
      >
        <Users size={13} />
        {t('button')}
        {chosen ? <span className="text-xs">{chosen}</span> : null}
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('button')} role="dialog" className="w-72 max-w-[calc(100vw-2rem)]">
        <div className="space-y-2 p-2 text-sm">
          <label className="flex items-center gap-1.5 rounded border border-line bg-panel2 px-2 py-1">
            <Search size={13} className="shrink-0 text-muted" />
            <input aria-label={t('search')} placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} className="no-focus-ring w-full min-w-0 bg-transparent outline-none" />
          </label>
          <div className="flex items-center justify-between px-2 text-xs text-muted">
            <span>{t('people')}</span>
            {chosen ? (
              <button type="button" className="hover:text-fg" onClick={() => setFilters({ assigneeIds: [], unassigned: false })}>
                {t('clear')}
              </button>
            ) : null}
          </div>
          <ul className="max-h-[50vh] overflow-y-auto">
            {showUnassigned ? (
              <li>
                <label className={rowClass}>
                  <input type="checkbox" aria-label={t('unassigned')} checked={unassigned} onChange={() => setFilters({ unassigned: !unassigned })} />
                  <UserX size={16} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{t('unassigned')}</span>
                  <span data-testid="count-unassigned" className="text-xs text-muted">
                    {counts.data?.unassigned ?? ''}
                  </span>
                </label>
              </li>
            ) : null}
            {rows.map((row) => {
              const name = row.me ? t('meSuffix', { name: row.member.name }) : row.member.name;
              return (
                <li key={row.member.id}>
                  <label className={rowClass}>
                    <input type="checkbox" aria-label={name} checked={filters.assigneeIds.includes(row.member.id)} onChange={() => toggle(row.member.id)} />
                    <span aria-hidden="true">
                      <Avatar id={row.member.id} name={row.member.name} size={20} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    <span data-testid={`count-${row.member.id}`} className="text-xs text-muted">
                      {row.count ?? ''}
                    </span>
                  </label>
                </li>
              );
            })}
            {!rows.length && !showUnassigned ? <li className="px-2 py-1.5 text-xs text-muted">{t('empty')}</li> : null}
          </ul>
        </div>
      </Popover>
    </div>
  );
}
