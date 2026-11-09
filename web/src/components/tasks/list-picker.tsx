'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Folder, List, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { ListNode } from '@/types/api.types';
import { findList, listGroups } from './list-picker.helpers';
import { ListPickerProps } from './list-picker.types';

export function ListPicker({ spaces, value, onSelect }: ListPickerProps) {
  const t = useTranslations('composer');
  const [query, setQuery] = useState('');
  const recentIds = useRecentListsStore((s) => s.listIds);
  const hydrate = useRecentListsStore((s) => s.hydrate);
  const listbox = useRef<HTMLUListElement>(null);
  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    listbox.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, []);
  const groups = listGroups(spaces, query);
  const recents = query.trim() ? [] : recentIds.map((id) => findList(spaces, id)).filter((list): list is ListNode => !!list);
  const option = (list: ListNode, keyPrefix: string, indent: number) => (
    <li key={`${keyPrefix}-${list.id}`} role="presentation">
      <button type="button" role="option" aria-selected={list.id === value} onClick={() => onSelect(list.id)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-panel2" style={{ paddingLeft: `${0.5 + indent * 0.75}rem` }}>
        {list.kind === 'sprint' ? <Timer size={13} className="shrink-0 text-muted" /> : <List size={13} className="shrink-0 text-muted" />}
        <span className="min-w-0 flex-1 truncate">{list.name}</span>
        {list.id === value ? <Check size={14} className="shrink-0 text-accent" /> : null}
      </button>
    </li>
  );
  return (
    <div className="w-72 max-w-[calc(100vw-2rem)] p-1">
      <input autoFocus aria-label={t('searchLists')} placeholder={t('searchLists')} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-1 w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
      <ul ref={listbox} role="listbox" aria-label={t('list')} className="max-h-72 overflow-y-auto">
        {recents.length > 0 ? (
          <>
            <li role="presentation" className="px-2 pb-0.5 pt-1 text-[11px] uppercase text-muted">
              {t('recentLists')}
            </li>
            {recents.map((list) => option(list, 'recent', 0))}
          </>
        ) : null}
        {groups.map((group) => (
          <li key={group.key} role="presentation">
            <p className={cn('flex items-center gap-1.5 px-2 pb-0.5 pt-1.5 text-[11px] text-muted', group.depth === 0 ? 'font-semibold uppercase' : 'pl-4')}>
              {group.depth > 0 ? <Folder size={11} /> : null}
              <span className="truncate">{group.label}</span>
            </p>
            <ul role="presentation">{group.lists.map((list) => option(list, group.key, group.depth + 1))}</ul>
          </li>
        ))}
      </ul>
      {groups.length === 0 ? <p className="px-2 py-1.5 text-xs text-muted">{t('noLists')}</p> : null}
    </div>
  );
}
