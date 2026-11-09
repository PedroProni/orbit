'use client';

import { useRef, useState } from 'react';
import { ListTree } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from '@/components/ui/popover';
import { useUpdateCustomField } from '@/hooks/use-admin';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/stores/toast.store';
import { ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { CustomFieldListsPickerProps } from './admin.types';
import { nextFieldListIds } from './custom-field.helpers';

export function CustomFieldListsPicker({ field, space }: CustomFieldListsPickerProps) {
  const t = useTranslations('admin');
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const update = useUpdateCustomField();
  const allIds = space.lists.map((list) => list.id);
  const selected = field.listIds?.filter((id) => allIds.includes(id)) ?? null;
  const folderName = (folderId: string | null) => space.folders.find((folder) => folder.id === folderId)?.name;
  const save = (listIds: string[] | null) => update.mutate({ id: field.id, patch: { listIds } }, { onError: () => useToastStore.getState().push('error', 'updateFailed') });
  return (
    <>
      <button ref={anchor} type="button" aria-label={t('customFields.listsFor', { name: field.name })} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={cn(ADMIN_ICON_BUTTON_CLASS, 'flex items-center gap-1 px-1.5 text-xs')}>
        <ListTree size={14} aria-hidden="true" />
        {selected === null ? t('customFields.allLists') : t('customFields.listCount', { count: selected.length })}
      </button>
      <Popover open={open} anchorRef={anchor} onClose={() => setOpen(false)} label={t('customFields.listsFor', { name: field.name })} role="dialog" align="end">
        <fieldset disabled={update.isPending} className="max-h-72 w-64 space-y-1 overflow-y-auto p-2 text-sm">
          <legend className="mb-1 px-1 text-xs text-muted">{t('customFields.listsHint')}</legend>
          <label className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-panel2">
            <input type="checkbox" checked={selected === null} disabled={selected === null} onChange={() => save(null)} />
            {t('customFields.allLists')}
          </label>
          {space.lists.map((list) => (
            <label key={list.id} className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-panel2">
              <input type="checkbox" checked={selected?.includes(list.id) ?? false} onChange={() => save(nextFieldListIds(selected, list.id, allIds))} />
              <span className="min-w-0 truncate">{folderName(list.folderId) ? `${folderName(list.folderId)} / ${list.name}` : list.name}</span>
            </label>
          ))}
        </fieldset>
      </Popover>
    </>
  );
}
