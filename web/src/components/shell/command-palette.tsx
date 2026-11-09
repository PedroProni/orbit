'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHierarchy, useSearch } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useDocs } from '@/hooks/use-workspace';
import { useUiStore } from '@/stores/ui.store';
import { VIEW_MODES } from '@/components/tasks/tasks.constants';
import { NAV_ITEMS } from './sidebar.constants';
import { filterPaletteItems, moveIndex } from './command-palette.helpers';
import { PALETTE_SEARCH_DEBOUNCE_MS, PALETTE_SEARCH_MIN_CHARS } from './command-palette.constants';
import { PaletteItem } from './command-palette.types';
import { Dialog } from '@/components/ui/dialog';
import { CommandPaletteProps } from './command-palette.types';
import { triggerNewTask } from '@/lib/new-task-trigger';

export function CommandPalette({ open = true }: CommandPaletteProps) {
  const tu = useTranslations('ui');
  const t = useTranslations('palette');
  const tn = useTranslations('nav');
  const tt = useTranslations('tasks');
  const router = useRouter();
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const setView = useUiStore((s) => s.setView);
  const openTask = useUiStore((s) => s.openTask);
  const hierarchy = useHierarchy();
  const { isGuest } = useCapabilities();
  const docs = useDocs();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useSearch(debounced.length >= PALETTE_SEARCH_MIN_CHARS ? debounced : '');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), PALETTE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => router.push(href);
    const base: PaletteItem[] = [
      ...(hierarchy.data ?? []).flatMap((space) => space.lists.map((list) => ({ key: `list-${list.id}`, group: 'lists' as const, label: list.name, hint: space.name, run: go(`/lists/${list.id}`) }))),
      ...(isGuest ? [] : NAV_ITEMS).map((item) => ({ key: `page-${item.href}`, group: 'pages' as const, label: tn(item.key), run: go(item.href) })),
      ...(docs.data ?? []).map((doc) => ({ key: `doc-${doc.id}`, group: 'docs' as const, label: doc.title, run: go('/docs') })),
      ...VIEW_MODES.map((mode) => ({ key: `view-${mode}`, group: 'actions' as const, label: t('switchView', { view: tt(`views.${mode}`) }), run: () => setView(mode) })),
      ...(isGuest ? [] : [{ key: 'action-new-task', group: 'actions' as const, label: t('createTask'), run: () => setTimeout(triggerNewTask, 0) }]),
    ];
    const found = (search.data?.tasks ?? []).map((task) => ({ key: `task-${task.id}`, group: 'tasks' as const, label: task.title, run: () => openTask(task.id) }));
    return [...filterPaletteItems(base, query), ...found];
  }, [hierarchy.data, docs.data, search.data, query, router, setView, openTask, t, tn, tt, isGuest]);

  const choose = (item?: PaletteItem) => {
    if (!item) return;
    setOpen(false);
    item.run();
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} label={t('title')} closeLabel={tu('close')} panelClassName="w-full max-w-xl overflow-hidden rounded-xl border border-linestrong bg-raised shadow-floating">
      <div className="flex items-center gap-2 border-b border-line px-3">
        <Search size={16} className="text-muted" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-label={t('title')}
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => moveIndex(i, 1, items.length));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => moveIndex(i, -1, items.length));
            }
            if (e.key === 'Enter') choose(items[active]);
          }}
          className="no-focus-ring w-full bg-transparent py-3 text-sm outline-none"
        />
      </div>
      <ul id="palette-list" role="listbox" className="max-h-80 overflow-auto p-1">
        {items.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted">{t('empty')}</li> : null}
        {items.map((item, index) => (
          <li key={item.key} role="option" aria-selected={index === active}>
            <button type="button" onMouseEnter={() => setActive(index)} onClick={() => choose(item)} className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${index === active ? 'bg-accentsoft' : ''}`}>
              <span className="w-16 shrink-0 text-[11px] uppercase text-muted">{t(`groups.${item.group}`)}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.hint ? <span className="truncate text-xs text-muted">{item.hint}</span> : null}
              {index === active ? <CornerDownLeft size={12} className="text-muted" /> : null}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
