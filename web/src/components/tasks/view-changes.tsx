'use client';

import { useTranslations } from 'next-intl';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useSavedViews, useUpdateView } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';
import { displayOf, viewIsDirty } from './view-state.helpers';
import { ViewChangesProps } from './view-changes.types';

export function ViewChanges({ listId }: ViewChangesProps) {
  const t = useTranslations('savedViews');
  const views = useSavedViews(listId);
  const update = useUpdateView();
  const { userId, canManageAccess } = useCapabilities();
  const { activeViewId, view, filters, display, applyView } = useUiStore();
  const saved = views.data?.find((item) => item.id === activeViewId);
  if (!saved || !viewIsDirty(saved, view, filters, display)) return null;
  const canChange = saved.ownerId === userId || canManageAccess;
  return (
    <div className="anim-fade-in flex items-center gap-2 text-xs">
      <span className="text-muted">{t('unsaved')}</span>
      {canChange ? (
        <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: saved.id, view: { name: saved.name, viewType: view, listId: saved.listId, filters, shared: saved.shared, display } })} className="rounded border border-line px-1.5 py-0.5 hover:border-accent disabled:opacity-50">
          {t('saveChanges')}
        </button>
      ) : null}
      <button type="button" onClick={() => applyView(saved.id, saved.viewType, saved.filters, displayOf(saved))} className="text-muted hover:text-fg">
        {t('discard')}
      </button>
    </div>
  );
}
