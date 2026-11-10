'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapabilities, useMe } from '@/hooks/use-capabilities';
import { useChangeUserRole, useGenerateAccessLink, useRevokeUserSessions, useUserAccess } from '@/hooks/use-account';
import { describeAuthError } from '@/lib/auth-error';
import { UserAccess } from '@/services/auth.types';
import { useToastStore } from '@/stores/toast.store';
import { AccessLinkDialog } from './access-link-dialog';
import { InviteDialog } from './invite-dialog';
import { PersonRow } from './person-row';
import { IssuedLinkState } from './people.types';

export function PeoplePage() {
  const t = useTranslations('people');
  const tc = useTranslations('common');
  const te = useTranslations('authErrors');
  const me = useMe();
  const caps = useCapabilities();
  const people = useUserAccess(caps.canManageAccess);
  const generate = useGenerateAccessLink();
  const revoke = useRevokeUserSessions();
  const changeRole = useChangeUserRole();
  const [inviting, setInviting] = useState(false);
  const [issued, setIssued] = useState<IssuedLinkState | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  if (me.isLoading) return <Skeleton className="m-6 h-40" />;
  if (!caps.canManageAccess) {
    return (
      <div className="p-6">
        <EmptyState title={tc('accessDenied')} hint={t('deniedHint')} />
      </div>
    );
  }

  const link = async (person: UserAccess) => {
    setRefusal(null);
    try {
      setIssued({ name: person.name, link: await generate.mutateAsync(person.id) });
    } catch (failure) {
      setRefusal(te(describeAuthError(failure)));
      useToastStore.getState().push('error', 'accessLinkFailed');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
          <p className="mt-1 text-xs text-muted">{t('subtitle')}</p>
        </div>
        <button type="button" onClick={() => setInviting(true)} className="flex items-center gap-1 rounded bg-accent px-3 py-2 text-sm font-medium text-white">
          <UserPlus size={14} />
          {t('invite')}
        </button>
      </div>
      {refusal ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {refusal}
        </p>
      ) : null}
      <section className="rounded-xl border border-line bg-panel px-4">
        {people.isLoading ? <Skeleton className="my-4 h-24 w-full" /> : null}
        {people.isError ? (
          <div className="py-4">
            <EmptyState title={t('loadError')} />
          </div>
        ) : null}
        {people.data?.length === 0 ? (
          <div className="py-4">
            <EmptyState title={t('empty')} />
          </div>
        ) : null}
        <ul className="divide-y divide-line">
          {people.data?.map((person) => (
            <PersonRow key={person.id} person={person} actorId={me.data?.id ?? ''} actorRole={me.data?.role ?? ''} busy={generate.isPending || revoke.isPending || changeRole.isPending} onLink={(target) => void link(target)} onEndSessions={(target) => revoke.mutate(target.id)} onChangeRole={(target, role) => changeRole.mutate({ userId: target.id, role })} />
          ))}
        </ul>
      </section>
      <InviteDialog open={inviting} actorRole={me.data?.role ?? ''} onClose={() => setInviting(false)} onInvited={(name, inviteLink) => setIssued({ name, link: inviteLink })} />
      <AccessLinkDialog name={issued?.name ?? ''} link={issued?.link ?? null} onClose={() => setIssued(null)} />
    </div>
  );
}
