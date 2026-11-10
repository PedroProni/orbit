'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutomations, useCreateAutomation, useDeleteAutomation, useUpdateAutomation } from '@/hooks/use-automations';
import { useHierarchy, useMembers } from '@/hooks/use-orbit';
import { Automation, AutomationInput, AutomationSaved } from '@/services/automation.types';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { AutomationDialog } from './automation-dialog';
import { AutomationRow } from './automation-row';
import { AutomationSecretDialog } from './automation-secret-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function AutomationsAdminPage() {
  const t = useTranslations('admin');
  const automations = useAutomations();
  const hierarchy = useHierarchy();
  const members = useMembers();
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const remove = useDeleteAutomation();
  const [editing, setEditing] = useState<Automation | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Automation | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const spaces = hierarchy.data ?? [];
  const everyone = members.data ?? [];
  const active = everyone.filter((member) => member.status === 'active');

  const submit = (input: AutomationInput): Promise<AutomationSaved> => (editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input));
  const saved = (result: AutomationSaved) => {
    if (result.webhookSecret) setSecret(result.webhookSecret);
  };

  return (
    <AdminPageFrame
      title={t('sections.automations')}
      subtitle={t('automations.subtitle')}
      action={
        <button type="button" onClick={() => setEditing(null)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('automations.add')}
        </button>
      }
    >
      <section aria-label={t('sections.automations')} className={ADMIN_PANEL_CLASS}>
        {automations.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {automations.isError ? <EmptyState title={t('loadError')} /> : null}
        {automations.data?.length === 0 ? <EmptyState title={t('automations.empty')} hint={t('automations.emptyHint')} /> : null}
        <ul className="divide-y divide-line">
          {automations.data?.map((automation) => (
            <AutomationRow key={automation.id} automation={automation} spaces={spaces} members={everyone} onEdit={setEditing} onDelete={setRemoving} />
          ))}
        </ul>
      </section>
      <AutomationDialog open={editing !== undefined} automation={editing ?? null} spaces={spaces} members={active} onSubmit={submit} onSaved={saved} onClose={() => setEditing(undefined)} />
      <AutomationSecretDialog secret={secret} onClose={() => setSecret(null)} />
      <ConfirmDialog
        open={removing !== null}
        title={t('automations.deleteTitle')}
        message={t('automations.confirmDelete', { name: removing?.name ?? '' })}
        confirmLabel={t('delete')}
        onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      />
    </AdminPageFrame>
  );
}
