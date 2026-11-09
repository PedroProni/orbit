'use client';

import { useRef, useState } from 'react';
import { AvatarStack } from '@/components/common/avatar';
import { Popover } from '@/components/ui/popover';
import { PeoplePicker } from './people-picker';
import { TaskPeopleFieldProps } from './task-field.types';

export function TaskPeopleField({ label, emptyLabel, people, selected, onToggle }: TaskPeopleFieldProps) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const chosen = people.filter((person) => selected.includes(person.id));
  return (
    <div>
      <button ref={anchor} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-h-7 w-full items-center gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-panel2">
        {chosen.length ? <AvatarStack people={chosen} /> : null}
        <span className="min-w-0 truncate">{chosen.length ? chosen.map((person) => person.name).join(', ') : <span className="text-muted">{emptyLabel}</span>}</span>
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={label} role="dialog">
        <PeoplePicker people={people} selected={selected} label={label} onToggle={onToggle} />
      </Popover>
    </div>
  );
}
