'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTemplates, useCreateTemplate, useDeleteTemplate, useUpdateTemplate } from '@/hooks/use-admin-templates';
import { useHierarchy } from '@/hooks/use-orbit';
import { TemplateInput } from '@/services/template.types';
import { TaskTemplate } from '@/types/workspace.types';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TemplateDialog } from './template-dialog';
import { TemplateRow } from './template-row';

export function TemplatesAdminPage() {
  const t = useTranslations('admin');
  const templates = useAllTemplates();
  const hierarchy = useHierarchy();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const [editing, setEditing] = useState<TaskTemplate | null | undefined>(undefined);
  const [removing, setRemoving] = useState<TaskTemplate | null>(null);
  const spaces = hierarchy.data ?? [];
  const spaceNames = new Map(spaces.map((space) => [space.id, space.name]));

  const submit = (input: TemplateInput) => (editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input));

  return (
    <AdminPageFrame
      title={t('sections.templates')}
      subtitle={t('templates.subtitle')}
      action={
        <button type="button" onClick={() => setEditing(null)} disabled={spaces.length === 0} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('templates.add')}
        </button>
      }
    >
      <section aria-label={t('sections.templates')} className={ADMIN_PANEL_CLASS}>
        {templates.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {templates.isError ? <EmptyState title={t('loadError')} /> : null}
        {templates.data?.length === 0 ? <EmptyState title={t('templates.empty')} hint={t('templates.emptyHint')} /> : null}
        <ul className="divide-y divide-line">
          {templates.data?.map((template) => (
            <TemplateRow key={template.id} template={template} spaceName={spaceNames.get(template.spaceId) ?? null} onEdit={setEditing} onDelete={setRemoving} />
          ))}
        </ul>
      </section>
      <TemplateDialog open={editing !== undefined} template={editing ?? null} spaces={spaces} onSubmit={submit} onClose={() => setEditing(undefined)} />
      <ConfirmDialog
        open={removing !== null}
        title={t('templates.deleteTitle')}
        message={t('templates.confirmDelete', { name: removing?.name ?? '' })}
        confirmLabel={t('delete')}
        onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      />
    </AdminPageFrame>
  );
}
