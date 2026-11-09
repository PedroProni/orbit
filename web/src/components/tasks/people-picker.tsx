'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/common/avatar';
import { PEOPLE_SEARCH_MIN } from './people-picker.constants';
import { orderPeople } from './people-picker.helpers';
import { PeoplePickerProps } from './people-picker.types';

export function PeoplePicker({ people, selected, onToggle, label, meId = null, alwaysSearch = false }: PeoplePickerProps) {
  const t = useTranslations('composer');
  const [query, setQuery] = useState('');
  const shown = orderPeople(people, query, meId);
  return (
    <div className="w-60 p-1">
      {alwaysSearch || people.length >= PEOPLE_SEARCH_MIN ? <input autoFocus aria-label={t('searchPeople')} placeholder={t('searchPeople')} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-1 w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" /> : null}
      <ul role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-56 overflow-y-auto">
        {shown.map((person) => {
          const active = selected.includes(person.id);
          const isMe = person.id === meId;
          return (
            <li key={person.id} role="presentation">
              <button type="button" role="option" aria-selected={active} onClick={() => onToggle(person.id)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-panel2">
                <Avatar id={person.id} name={person.name} />
                <span className="min-w-0 flex-1 truncate">{isMe ? t('me', { name: person.name }) : person.name}</span>
                {active ? <Check size={14} className="shrink-0 text-accent" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 ? <p className="px-2 py-1.5 text-xs text-muted">{t('noPeople')}</p> : null}
    </div>
  );
}
