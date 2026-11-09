'use client';

import { useTranslations } from 'next-intl';
import { STATE_CLASS } from './people.constants';
import { accessStateOf, canAdministerPerson } from './people.helpers';
import { PersonRowProps } from './people.types';

export function PersonRow({ person, actorId, actorRole, onLink, onEndSessions, busy }: PersonRowProps) {
  const t = useTranslations('people');
  const state = accessStateOf(person);
  const allowed = canAdministerPerson(actorId, actorRole, person);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-sm font-medium">{person.name}</p>
        <p className="truncate text-xs text-muted">{person.email}</p>
      </div>
      <div className="flex w-44 items-center gap-2 text-xs">
        <span className="rounded bg-panel2 px-1.5 py-0.5">{t(`roles.${person.role}`)}</span>
        <span className={STATE_CLASS[state]}>{t(`states.${state}`)}</span>
      </div>
      <div className="flex w-56 justify-end gap-2">
        {allowed && state !== 'disabled' ? (
          <button type="button" disabled={busy} aria-label={t(state === 'pending' ? 'newInviteLabel' : 'newResetLabel', { name: person.name })} onClick={() => onLink(person)} className="rounded border border-line px-2 py-1 text-xs hover:bg-panel2 disabled:opacity-60">
            {t(state === 'pending' ? 'newInvite' : 'newReset')}
          </button>
        ) : null}
        {allowed ? (
          <button type="button" disabled={busy} aria-label={t('endSessionsLabel', { name: person.name })} onClick={() => onEndSessions(person)} className="rounded border border-line px-2 py-1 text-xs hover:bg-panel2 disabled:opacity-60">
            {t('endSessions')}
          </button>
        ) : null}
      </div>
    </li>
  );
}
