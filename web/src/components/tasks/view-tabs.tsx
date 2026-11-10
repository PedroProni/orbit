'use client';

import { useRef, useState } from 'react';
import { Bookmark, MoreHorizontal, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Popover } from '@/components/ui/popover';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useDeleteView, useSavedViews, useSaveView, useUpdateView } from '@/hooks/use-orbit';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { SavedView } from '@/types/api.types';
import { VIEW_ICONS } from './view-tabs.constants';
import { VIEW_MODES } from './tasks.constants';
import { displayOf, viewIsDirty } from './view-state.helpers';
import { ViewFormState, ViewTabsProps } from './view-tabs.types';

export function ViewTabs({ listId }: ViewTabsProps) {
  const t = useTranslations('tasks');
  const ts = useTranslations('savedViews');
  const views = useSavedViews(listId);
  const save = useSaveView();
  const update = useUpdateView();
  const remove = useDeleteView();
  const push = useToastStore((s) => s.push);
  const { canWrite, userId, canManageAccess } = useCapabilities();
  const { view, filters, display, activeViewId, setView, applyView } = useUiStore();
  const addRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState<ViewFormState | null>(null);
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);
  const [confirming, setConfirming] = useState<SavedView | null>(null);
  const saved = views.data ?? [];
  const closeForm = () => setForm(null);
  const openForm = (renaming: SavedView | null) => {
    setName(renaming?.name ?? '');
    setShared(renaming?.shared ?? false);
    setForm({ renaming });
  };
  const select = (item: SavedView) => applyView(item.id, item.viewType, item.filters, displayOf(item));
  const refused = () => push('error', 'viewSaveFailed');
  const submitForm = () => {
    const trimmed = name.trim();
    if (!trimmed || !form) return;
    if (form.renaming) {
      const target = form.renaming;
      update.mutate({ id: target.id, view: { name: trimmed, viewType: target.viewType, listId: target.listId, filters: target.filters, shared, display: target.display } }, { onSuccess: closeForm });
      return;
    }
    save.mutate({ name: trimmed, viewType: view, listId, filters, shared, display }, { onSuccess: (created) => { select(created); closeForm(); }, onError: refused });
  };
  const menuFor = (item: SavedView) => {
    const canChange = item.ownerId === userId || canManageAccess;
    return [
      ...(canChange ? [{ key: 'rename', label: ts('rename'), onSelect: () => openForm(item) }] : []),
      { key: 'duplicate', label: ts('duplicate'), onSelect: () => save.mutate({ name: ts('copyName', { name: item.name }), viewType: item.viewType, listId: item.listId, filters: item.filters, shared: false, display: item.display }, { onSuccess: select, onError: refused }) },
      ...(canChange ? [{ key: 'share', label: item.shared ? ts('unshare') : ts('share'), onSelect: () => update.mutate({ id: item.id, view: { name: item.name, viewType: item.viewType, listId: item.listId, filters: item.filters, shared: !item.shared, display: item.display } }) }] : []),
      ...(canChange ? [{ key: 'delete', label: ts('delete'), danger: true, onSelect: () => setConfirming(item) }] : []),
    ];
  };
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-4" role="tablist" aria-label={t('view')}>
      {VIEW_MODES.map((mode) => {
        const Icon = VIEW_ICONS[mode];
        const active = view === mode && !activeViewId;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              setView(mode);
              useUiStore.setState({ activeViewId: null });
            }}
            className={cn('relative flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            <Icon size={14} />
            {t(`views.${mode}`)}
            <span className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded bg-accent transition-opacity duration-150', active ? 'opacity-100' : 'opacity-0')} />
          </button>
        );
      })}
      {saved.map((item) => {
        const active = item.id === activeViewId;
        const dirty = active && viewIsDirty(item, view, filters, display);
        return (
          <span key={item.id} className="relative flex shrink-0 items-center">
            <button type="button" role="tab" aria-selected={active} onClick={() => select(item)} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}>
              <Bookmark size={13} />
              {item.name}
              {dirty ? <span role="img" aria-label={ts('unsaved')} className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
            </button>
            {active && canWrite ? (
              <DropdownMenu items={menuFor(item)} label={ts('menu', { name: item.name })} className="rounded p-0.5 text-muted hover:text-fg">
                <MoreHorizontal size={13} />
              </DropdownMenu>
            ) : null}
            <span className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded bg-accent transition-opacity duration-150', active ? 'opacity-100' : 'opacity-0')} />
          </span>
        );
      })}
      {!canWrite ? null : (
        <button ref={addRef} type="button" onClick={() => openForm(null)} className="ml-1 flex shrink-0 items-center gap-1 px-2 py-2 text-xs text-muted hover:text-fg">
          <Plus size={12} />
          {t('addView')}
        </button>
      )}
      <Popover open={!!form} anchorRef={addRef} onClose={closeForm} label={form?.renaming ? ts('rename') : ts('save')} role="dialog" className="w-64 max-w-[calc(100vw-2rem)]">
        <form
          className="space-y-2 p-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            submitForm();
          }}
        >
          <input autoFocus aria-label={ts('nameLabel')} placeholder={ts('namePlaceholder')} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-line bg-panel2 px-2 py-1" />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            {ts('shareHint')}
          </label>
          <button type="submit" disabled={!name.trim() || save.isPending || update.isPending} className="rounded bg-accent px-2 py-1 text-xs text-white disabled:opacity-50">
            {ts('save')}
          </button>
        </form>
      </Popover>
      <Popover open={!!confirming} anchorRef={addRef} onClose={() => setConfirming(null)} label={ts('delete')} role="dialog" className="w-64 max-w-[calc(100vw-2rem)]">
        <div className="space-y-2 p-3 text-sm">
          <p>{ts('confirmDelete', { name: confirming?.name ?? '' })}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirming(null)} className="rounded border border-line px-2 py-1 text-xs">
              {ts('cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirming) remove.mutate(confirming.id);
                if (confirming?.id === activeViewId) useUiStore.setState({ activeViewId: null });
                setConfirming(null);
              }}
              className="rounded bg-danger px-2 py-1 text-xs text-white"
            >
              {ts('delete')}
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
}
