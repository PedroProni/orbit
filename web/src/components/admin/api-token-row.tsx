'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { notAfter } from '@/components/tasks/task-github.helpers';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { API_TOKEN_SCOPE_KEYS } from './api-tokens.constants';
import { ApiTokenRowProps } from './api-tokens.types';

export function ApiTokenRow({ token, ownerName, onRevoke }: ApiTokenRowProps) {
  const t = useTranslations('admin.apiTokens');
  const format = useFormatter();
  const now = new Date();
  const revoked = token.revokedAt !== null;
  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className={cn('break-words text-sm font-medium', revoked && 'text-muted line-through')}>{token.name}</p>
            <span className={cn(ADMIN_BADGE_CLASS, revoked ? 'bg-panel2 text-muted' : 'bg-accentsoft text-fg')}>{revoked ? t('status.revoked') : t('status.active')}</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {ownerName !== null ? <span>{t('owner', { name: ownerName })}</span> : null}
            <span>{t('created', { date: format.dateTime(new Date(token.createdAt), { dateStyle: 'medium' }) })}</span>
            <span>{token.lastUsedAt ? t('lastUsed', { when: format.relativeTime(notAfter(token.lastUsedAt, now), now) }) : t('neverUsed')}</span>
          </div>
          <ul aria-label={t('scopesFor', { name: token.name })} className="flex flex-wrap gap-1 pt-1">
            {token.scopes.map((scope) => (
              <li key={scope} className="rounded bg-panel2 px-1.5 py-0.5 text-[11px] text-fg/80">
                {API_TOKEN_SCOPE_KEYS[scope] ? t(`scopes.${API_TOKEN_SCOPE_KEYS[scope]}`) : scope}
              </li>
            ))}
          </ul>
        </div>
        {revoked ? null : (
          <button type="button" aria-label={t('revokeFor', { name: token.name })} onClick={() => onRevoke(token)} className={cn(ADMIN_SECONDARY_BUTTON_CLASS, 'shrink-0 hover:text-danger')}>
            {t('revoke')}
          </button>
        )}
      </div>
    </li>
  );
}
