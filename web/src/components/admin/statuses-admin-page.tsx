'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageFrame } from './admin-page-frame';
import { RulesEditor } from './rules-editor';
import { SpacePicker } from './space-picker';
import { StatusesEditor } from './statuses-editor';
import { rulesEditorKey, statusesEditorKey } from './statuses.helpers';
import { useAdminSpace } from '@/hooks/use-admin-space';

export function StatusesAdminPage() {
  const t = useTranslations('admin');
  const { hierarchy, spaces, space, choose } = useAdminSpace();
  return (
    <AdminPageFrame title={t('sections.statuses')} subtitle={t('statuses.subtitle')}>
      {hierarchy.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {hierarchy.isError ? <EmptyState title={t('loadError')} /> : null}
      {hierarchy.isSuccess && !space ? <EmptyState title={t('noSpaces')} /> : null}
      {space ? (
        <>
          <SpacePicker spaces={spaces} value={space.id} onChange={choose} />
          <div className="space-y-4">
            <StatusesEditor key={statusesEditorKey(space)} space={space} />
            <RulesEditor key={rulesEditorKey(space)} space={space} />
          </div>
        </>
      ) : null}
    </AdminPageFrame>
  );
}
