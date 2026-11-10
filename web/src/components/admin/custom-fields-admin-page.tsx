'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateCustomField, useDeleteCustomField } from '@/hooks/use-admin';
import { useAdminSpace } from '@/hooks/use-admin-space';
import { useCustomFields } from '@/hooks/use-orbit';
import { cn } from '@/lib/cn';
import { CustomFieldDefinition } from '@/types/api.types';
import { ADMIN_ICON_BUTTON_CLASS, CUSTOM_FIELD_ICONS, ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CustomFieldDialog } from './custom-field-dialog';
import { CustomFieldListsPicker } from './custom-field-lists-picker';
import { SpacePicker } from './space-picker';

export function CustomFieldsAdminPage() {
  const t = useTranslations('admin');
  const { hierarchy, spaces, space, choose } = useAdminSpace();
  const fields = useCustomFields(space?.id);
  const create = useCreateCustomField();
  const remove = useDeleteCustomField();
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CustomFieldDefinition | null>(null);

  return (
    <AdminPageFrame
      title={t('sections.customFields')}
      subtitle={t('customFields.subtitle')}
      action={
        space ? (
          <button type="button" onClick={() => setCreating(true)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            <Plus size={14} />
            {t('customFields.add')}
          </button>
        ) : null
      }
    >
      {hierarchy.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {hierarchy.isError ? <EmptyState title={t('loadError')} /> : null}
      {hierarchy.isSuccess && !space ? <EmptyState title={t('noSpaces')} /> : null}
      {space ? (
        <>
          <SpacePicker spaces={spaces} value={space.id} onChange={choose} />
          <section aria-label={t('sections.customFields')} className={ADMIN_PANEL_CLASS}>
            {fields.isLoading ? <Skeleton className="m-3 h-16" /> : null}
            {fields.isError ? <EmptyState title={t('loadError')} /> : null}
            {fields.data?.length === 0 ? <p className="px-3 py-4 text-sm text-muted">{t('customFields.empty')}</p> : null}
            <ul className="divide-y divide-line">
              {fields.data?.map((field) => {
                const Icon = CUSTOM_FIELD_ICONS[field.type];
                return (
                  <li key={field.id} className="flex items-center gap-2 px-3 py-2">
                    <Icon size={14} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm">{field.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {field.type === 'dropdown'
                        ? t('customFields.optionCount', {
                            count: field.options.length,
                          })
                        : t(`customFields.types.${field.type}`)}
                    </span>
                    <CustomFieldListsPicker field={field} space={space} />
                    <button
                      type="button"
                      aria-label={t('customFields.deleteFor', {
                        name: field.name,
                      })}
                      onClick={() => setRemoving(field)}
                      className={cn(ADMIN_ICON_BUTTON_CLASS, 'hover:text-danger')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <CustomFieldDialog open={creating} onSubmit={(input) => create.mutateAsync({ spaceId: space.id, input })} onClose={() => setCreating(false)} />
        </>
      ) : null}
      <ConfirmDialog
        open={removing !== null}
        title={t('customFields.deleteTitle')}
        message={t('customFields.confirmDelete', {
          name: removing?.name ?? '',
        })}
        confirmLabel={t('delete')}
        onConfirm={() => (removing ? remove.mutateAsync(removing.id) : Promise.resolve())}
        onClose={() => setRemoving(null)}
      />
    </AdminPageFrame>
  );
}
