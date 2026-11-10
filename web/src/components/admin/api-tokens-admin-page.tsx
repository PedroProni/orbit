'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from '@/hooks/use-api-tokens';
import { useCapabilities, useMe } from '@/hooks/use-capabilities';
import { useMembers } from '@/hooks/use-orbit';
import { ApiToken } from '@/services/api-token.types';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ApiTokenCreatedDialog } from './api-token-created-dialog';
import { ApiTokenDialog } from './api-token-dialog';
import { ApiTokenRow } from './api-token-row';
import { grantableScopes } from './api-tokens.helpers';
import { ConfirmDialog } from './confirm-dialog';

export function ApiTokensAdminPage() {
  const t = useTranslations('admin');
  const me = useMe();
  const { isOwner } = useCapabilities();
  const tokens = useApiTokens();
  const members = useMembers();
  const create = useCreateApiToken();
  const revoke = useRevokeApiToken();
  const [creating, setCreating] = useState(false);
  const [plain, setPlain] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiToken | null>(null);
  const names = new Map((members.data ?? []).map((member) => [member.id, member.name]));
  const available = grantableScopes(me.data?.scopes ?? []);

  return (
    <AdminPageFrame
      title={t('sections.apiTokens')}
      subtitle={isOwner ? t('apiTokens.subtitleOwner') : t('apiTokens.subtitle')}
      action={
        <button type="button" onClick={() => setCreating(true)} disabled={available.length === 0} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('apiTokens.add')}
        </button>
      }
    >
      <section aria-label={t('sections.apiTokens')} className={ADMIN_PANEL_CLASS}>
        {tokens.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {tokens.isError ? <EmptyState title={t('loadError')} /> : null}
        {tokens.data?.length === 0 ? <EmptyState title={t('apiTokens.empty')} hint={t('apiTokens.emptyHint')} /> : null}
        <ul className="divide-y divide-line">
          {tokens.data?.map((token) => (
            <ApiTokenRow key={token.id} token={token} ownerName={isOwner ? (names.get(token.userId) ?? t('apiTokens.unknownOwner')) : null} onRevoke={setRevoking} />
          ))}
        </ul>
      </section>
      <ApiTokenDialog open={creating} available={available} onSubmit={(input) => create.mutateAsync(input)} onCreated={setPlain} onClose={() => setCreating(false)} />
      <ApiTokenCreatedDialog plain={plain} onClose={() => setPlain(null)} />
      <ConfirmDialog
        open={revoking !== null}
        title={t('apiTokens.revokeTitle')}
        message={t('apiTokens.confirmRevoke', { name: revoking?.name ?? '' })}
        confirmLabel={t('apiTokens.revoke')}
        onConfirm={() => (revoking ? revoke.mutateAsync(revoking.id) : Promise.resolve())}
        onClose={() => setRevoking(null)}
      />
    </AdminPageFrame>
  );
}
