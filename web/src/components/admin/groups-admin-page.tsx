'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarStack } from '@/components/common/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateGroup, useDeleteGroup, useUpdateGroup, useUserGroups } from '@/hooks/use-admin';
import { useMembers } from '@/hooks/use-orbit';
import { cn } from '@/lib/cn';
import { UserGroup, UserGroupInput } from '@/services/admin.types';
import { ADMIN_ICON_BUTTON_CLASS, ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfirmDialog } from './confirm-dialog';
import { GroupDialog } from './group-dialog';

export function GroupsAdminPage() {
  const t = useTranslations('admin');
  const groups = useUserGroups();
  const members = useMembers();
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const remove = useDeleteGroup();
  const [editing, setEditing] = useState<UserGroup | null | undefined>(undefined);
  const [removing, setRemoving] = useState<UserGroup | null>(null);
  const active = (members.data ?? []).filter((member) => member.status === 'active');

  const submit = (input: UserGroupInput) => (editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input));

  return (
    <AdminPageFrame
      title={t('sections.groups')}
      subtitle={t('groupsPage.subtitle')}
      action={
        <button type="button" onClick={() => setEditing(null)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('groupsPage.add')}
        </button>
      }
    >
      <section aria-label={t('sections.groups')} className={ADMIN_PANEL_CLASS}>
        {groups.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {groups.isError ? <EmptyState title={t('loadError')} /> : null}
        {groups.data?.length === 0 ? <p className="px-3 py-4 text-sm text-muted">{t('groupsPage.empty')}</p> : null}
        <ul className="divide-y divide-line">
          {groups.data?.map((group) => {
            const people = active.filter((member) => group.memberIds.includes(member.id));
            return (
              <li key={group.id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-muted">
                    {t('groupsPage.memberCount', {
                      count: group.memberIds.length,
                    })}
                  </p>
                </div>
                <span className="hidden sm:block">
                  <AvatarStack people={people} />
                </span>
                <button type="button" aria-label={t('groupsPage.editFor', { name: group.name })} onClick={() => setEditing(group)} className={ADMIN_ICON_BUTTON_CLASS}>
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label={t('groupsPage.deleteFor', { name: group.name })} onClick={() => setRemoving(group)} className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}>
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <GroupDialog open={editing !== undefined} group={editing ?? null} members={active} onSubmit={submit} onClose={() => setEditing(undefined)} />
      <ConfirmDialog open={removing !== null} title={t('groupsPage.deleteTitle')} message={t('groupsPage.confirmDelete', { name: removing?.name ?? '' })} confirmLabel={t('delete')} onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())} onClose={() => setRemoving(null)} />
    </AdminPageFrame>
  );
}
