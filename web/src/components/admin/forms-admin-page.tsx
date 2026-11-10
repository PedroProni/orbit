'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateForm, useDeleteForm, useForms, useRotateFormKey, useUpdateForm } from '@/hooks/use-forms';
import { useHierarchy } from '@/hooks/use-orbit';
import { AdminForm, FormInput } from '@/services/form.types';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfirmDialog } from './confirm-dialog';
import { FormDialog } from './form-dialog';
import { FormRow } from './form-row';

export function FormsAdminPage() {
  const t = useTranslations('admin');
  const forms = useForms();
  const hierarchy = useHierarchy();
  const create = useCreateForm();
  const update = useUpdateForm();
  const rotate = useRotateFormKey();
  const remove = useDeleteForm();
  const [editing, setEditing] = useState<AdminForm | null | undefined>(undefined);
  const [rotating, setRotating] = useState<AdminForm | null>(null);
  const [removing, setRemoving] = useState<AdminForm | null>(null);
  const spaces = hierarchy.data ?? [];

  const submit = (input: FormInput) => (editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input));

  return (
    <AdminPageFrame
      title={t('sections.forms')}
      subtitle={t('forms.subtitle')}
      action={
        <button type="button" onClick={() => setEditing(null)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          <Plus size={14} />
          {t('forms.add')}
        </button>
      }
    >
      <section aria-label={t('sections.forms')} className={ADMIN_PANEL_CLASS}>
        {forms.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {forms.isError ? <EmptyState title={t('loadError')} /> : null}
        {forms.data?.length === 0 ? <EmptyState title={t('forms.empty')} hint={t('forms.emptyHint')} /> : null}
        <ul className="divide-y divide-line">
          {forms.data?.map((form) => (
            <FormRow key={form.id} form={form} spaces={spaces} onEdit={setEditing} onRotate={setRotating} onDelete={setRemoving} />
          ))}
        </ul>
      </section>
      <FormDialog open={editing !== undefined} form={editing ?? null} spaces={spaces} onSubmit={submit} onClose={() => setEditing(undefined)} />
      <ConfirmDialog
        open={rotating !== null}
        title={t('forms.rotateTitle')}
        message={t('forms.confirmRotate', { name: rotating?.name ?? '' })}
        confirmLabel={t('forms.rotate')}
        onConfirm={() => (rotating ? rotate.mutateAsync(rotating.id) : Promise.resolve())}
        onClose={() => setRotating(null)}
      />
      <ConfirmDialog
        open={removing !== null}
        title={t('forms.deleteTitle')}
        message={t('forms.confirmDelete', { name: removing?.name ?? '' })}
        confirmLabel={t('delete')}
        onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      />
    </AdminPageFrame>
  );
}
