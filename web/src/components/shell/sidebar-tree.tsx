'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, List, Star, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/stores/ui.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { cn } from '@/lib/cn';
import { orbitService } from '@/services/orbit.service';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { spaceColor, spaceInitial } from './sidebar.helpers';
import { BranchProps, ListLinkProps, SpaceBadgeProps, SpaceTreeProps } from './sidebar.types';
import { SpaceCreateMenu } from './space-create-menu';

export function ListLink({ list, active }: ListLinkProps) {
  const t = useTranslations('sidebar');
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const favorite = useFavoritesStore((s) => s.listIds.includes(list.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const client = useQueryClient();
  const Icon = list.kind === 'sprint' ? Zap : List;
  const prefetch = () => client.prefetchQuery({ queryKey: ['tasks', list.id, EMPTY_FILTERS], queryFn: () => orbitService.tasks(list.id, EMPTY_FILTERS) });
  return (
    <div className="row-hover group relative">
      <Link href={`/lists/${list.id}`} onMouseEnter={prefetch} onFocus={prefetch} onClick={() => toggleSidebar(false)} className={cn('flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors', active ? 'bg-accentsoft text-fg' : 'text-muted hover:bg-panel2 hover:text-fg')}>
        <Icon size={14} />
        <span className="truncate">{list.name}</span>
      </Link>
      <button type="button" aria-pressed={favorite} aria-label={favorite ? t('unfavorite', { name: list.name }) : t('favorite', { name: list.name })} onClick={() => toggleFavorite(list.id)} className={cn('absolute right-1 top-1 rounded p-0.5 text-muted hover:text-fg', favorite ? 'opacity-100' : 'row-hover-actions')}>
        <Star size={12} className={favorite ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
    </div>
  );
}

function Branch({ icon, label, count, open, onToggle, level = 0 }: BranchProps) {
  return (
    <button type="button" aria-expanded={open} onClick={onToggle} className={cn('flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-panel2', level === 0 ? 'font-semibold text-fg' : 'text-fg')}>
      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="rounded bg-panel2 px-1.5 text-[11px] text-muted">{count}</span>
    </button>
  );
}

function SpaceBadge({ name }: SpaceBadgeProps) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white" style={{ backgroundColor: spaceColor(name) }}>
      {spaceInitial(name)}
    </span>
  );
}

export function SpaceTree({ space, activeId }: SpaceTreeProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setClosed((prev) => ({ ...prev, [id]: !prev[id] }));
  const loose = space.lists.filter((l) => !l.folderId);
  return (
    <div className="mb-3">
      <div className="group flex items-center">
        <Branch icon={<SpaceBadge name={space.name} />} label={space.name} count={space.lists.length} open={!closed[space.id]} onToggle={() => toggle(space.id)} />
        <SpaceCreateMenu space={space} />
      </div>
      {!closed[space.id] ? (
        <div className="anim-fade-in ml-3 border-l border-line pl-1">
          {loose.map((l) => (
            <ListLink key={l.id} list={l} active={l.id === activeId} />
          ))}
          {space.folders.map((f) => {
            const lists = space.lists.filter((l) => l.folderId === f.id);
            const open = !closed[f.id];
            return (
              <div key={f.id} className="mt-0.5">
                <Branch icon={open ? <FolderOpen size={14} /> : <Folder size={14} />} label={f.name} count={lists.length} open={open} onToggle={() => toggle(f.id)} level={1} />
                {open ? (
                  <div className="anim-fade-in ml-3 border-l border-line pl-1">
                    {lists.map((l) => (
                      <ListLink key={l.id} list={l} active={l.id === activeId} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
