'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NameDialog } from '@/components/admin/name-dialog';
import { useCreateSpace } from '@/hooks/use-admin';
import { useCapabilities } from '@/hooks/use-capabilities';
import { NEW_SPACE_BUTTON_CLASS } from './sidebar.constants';

export function NewSpaceButton() {
  const t = useTranslations('admin');
  const caps = useCapabilities();
  const createSpace = useCreateSpace();
  const [open, setOpen] = useState(false);

  if (!caps.canManageStructure) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={NEW_SPACE_BUTTON_CLASS}>
        <Plus size={14} />
        {t('sidebar.newSpace')}
      </button>
      <NameDialog open={open} title={t('spaces.newSpace')} submitLabel={t('create')} onSubmit={(name) => createSpace.mutateAsync(name)} onClose={() => setOpen(false)} />
    </>
  );
}
