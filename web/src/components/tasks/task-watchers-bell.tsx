'use client';

import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { PeoplePicker } from './people-picker';
import { TaskWatchersBellProps } from './task-field.types';

export function TaskWatchersBell({ people, selected, onToggle }: TaskWatchersBellProps) {
  const t = useTranslations('drawer');
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-label={t('watchers')}
        title={selected.length ? t('watchersCount', { count: selected.length }) : t('noWatchers')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn('flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors hover:bg-panel2', selected.length ? 'text-fg' : 'text-muted')}
      >
        <Bell size={14} />
        {selected.length ? <span>{selected.length}</span> : null}
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('watchers')} role="dialog">
        <PeoplePicker people={people} selected={selected} label={t('watchers')} onToggle={onToggle} />
      </Popover>
    </>
  );
}
