'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, CornerDownLeft, List, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Popover } from '@/components/ui/popover';
import { useEscapeLayer } from '@/hooks/use-escape-layer';
import { useHierarchy, useMe, useMembers, useTasks } from '@/hooks/use-orbit';
import { useInstantiateTemplate } from '@/hooks/use-workspace';
import { useOptimisticCreate } from '@/hooks/use-optimistic-create';
import { useComposerStore } from '@/stores/composer.store';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';
import { ComposerPicker } from './composer-field.types';
import { ComposerFields } from './composer-fields';
import { ComposerRuleHints } from './composer-rule-hints';
import { COMPOSER_CARD_FIELDS, COMPOSER_CARD_EXTRA_FIELDS, COMPOSER_ROW_FIELDS, COMPOSER_ROW_LEAD_FIELDS } from './composer-fields.constants';
import { ListPicker } from './list-picker';
import { announceCreated } from './task-created-toast';
import { describeCreateError } from './task-create-error';
import { composerRule, composerTarget, draftFromPresets, inputFromDraft, matchesFilters, priorityFromKey, titlePrefixOf } from './task-composer.helpers';
import { ComposerOrigin, ComposerRule, TaskComposerProps } from './task-composer.types';
import { TitleTextarea } from './title-textarea';
import { TaskTemplate } from '@/types/workspace.types';
import { statusColor } from './task-helpers';

export function TaskComposer({ listId, space, label, variant = 'card', initialPicker = null }: TaskComposerProps) {
  const t = useTranslations('tasks');
  const tc = useTranslations('composer');
  const draft = useComposerStore((s) => s.draft);
  const presets = useComposerStore((s) => s.presets);
  const refusal = useComposerStore((s) => s.refusal);
  const setDraft = useComposerStore((s) => s.setDraft);
  const close = useComposerStore((s) => s.close);
  const clearRefusal = useComposerStore((s) => s.clearRefusal);
  const remember = useRecentListsStore((s) => s.remember);
  const filters = useUiStore((s) => s.filters);
  const hierarchy = useHierarchy();
  const me = useMe();
  const members = useMembers();
  const tasks = useTasks(listId, filters);
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name, email: m.email }));
  const spaces = hierarchy.data ?? [space];
  const target = composerTarget(spaces, draft.listId ?? listId, space);
  const sameSpace = target.space.id === space.id;
  const [picker, setPicker] = useState<ComposerPicker | null>(initialPicker);
  const [rule, setRule] = useState<ComposerRule | null>(null);
  const [confirming, setConfirming] = useState(false);
  const root = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const listAnchor = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const prefix = titlePrefixOf(draft.title, target.space.titlePrefixes);
  const isBlank = draft.title.trim() === prefix.trim();

  const create = useOptimisticCreate<ComposerOrigin>({
    onCreated: (task, origin) => {
      announceCreated(task, origin.listName);
      if (task.listId === listId && !matchesFilters(task, useUiStore.getState().filters, space.statuses)) useToastStore.getState().push('info', 'createdHidden');
    },
    onRefused: (error, origin) => {
      const described = describeCreateError(error);
      const store = useComposerStore.getState();
      if (!store.anchor) {
        useToastStore.getState().push('error', described.key, described.values);
        store.open(origin.anchor, origin.presets);
        useComposerStore.getState().setDraft(origin.draft);
      } else if (store.draft.title.trim() === titlePrefixOf(store.draft.title, target.space.titlePrefixes).trim()) {
        store.setDraft(origin.draft);
      }
      useComposerStore.getState().refuse({ ...described, draft: origin.draft });
    },
  });

  const focusTitle = () => input.current?.focus();
  const requestClose = () => {
    if (isBlank) close();
    else setConfirming(true);
  };

  useEscapeLayer(true, () => (confirming ? setConfirming(false) : requestClose()));

  useEffect(() => {
    if (confirming) return;
    if (!mounted.current) {
      mounted.current = true;
      if (initialPicker) return;
    }
    focusTitle();
  }, [confirming, initialPicker]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (picker || root.current?.contains(event.target as Node)) return;
      if (isBlank) close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [picker, isBlank, close]);

  const closePicker = () => {
    setPicker(null);
    focusTitle();
  };
  const togglePicker = (next: ComposerPicker) => setPicker((current) => (current === next ? null : next));
  const change = (patch: Parameters<typeof setDraft>[0]) => {
    setRule(null);
    setDraft(patch);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    const priority = priorityFromKey(event);
    if (priority === undefined) return;
    event.preventDefault();
    change({ priority });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isBlank || confirming) return;
    const broken = composerRule(draft, target.space);
    if (broken) {
      setRule(broken);
      if (broken.key === 'tagError') setPicker('tags');
      if (broken.key === 'datesError') setPicker('date');
      return;
    }
    const anchor = useComposerStore.getState().anchor as string;
    const fallbackStatus = target.space.statuses.find((status) => status.type === 'open')?.name ?? target.space.statuses[0]?.name ?? '';
    create.mutate({ listId: target.listId, spaceId: target.space.id, fallbackStatus, input: inputFromDraft(draft, presets, sameSpace), origin: { draft, anchor, presets, listName: target.listName } });
    remember(target.listId);
    setRule(null);
    clearRefusal();
    setDraft(draftFromPresets(prefix, presets, draft.listId));
    focusTitle();
  };

  const instantiate = useInstantiateTemplate();
  const fromTemplate = (template: TaskTemplate) => {
    setPicker(null);
    const listName = target.listName;
    instantiate.mutate(
      { id: template.id, listId: target.listId, title: isBlank ? undefined : draft.title.trim() },
      {
        onSuccess: (task) => announceCreated(task, listName),
        onError: (error) => setRule(describeCreateError(error as Error & { status?: number }) as ComposerRule),
      },
    );
    remember(target.listId);
    setDraft(draftFromPresets(prefix, presets, draft.listId));
    focusTitle();
  };

  const suggestions = [...new Set([...target.space.requiredTags.map((tag) => tag.toLowerCase()), ...(tasks.data?.data ?? []).flatMap((task) => task.tags)])];
  const message = rule ?? refusal;
  const status = target.space.statuses.find((item) => item.name === presets.status) ?? target.space.statuses.find((item) => item.type === 'open');
  const row = variant === 'row';
  const fields = { look: row ? ('icon' as const) : ('line' as const), draft, space: target.space, people, meId: me.data?.id ?? null, suggestions, picker, onToggle: togglePicker, onClose: closePicker, onChange: change, onTemplate: fromTemplate };

  const listLink = (
    <>
      <button
        ref={listAnchor}
        type="button"
        aria-label={tc('chooseList', { list: target.listName })}
        aria-haspopup="dialog"
        aria-expanded={picker === 'list'}
        onClick={() => togglePicker('list')}
        className="flex min-w-0 max-w-full items-center gap-1 rounded px-1 py-0.5 text-[11px] text-muted transition-colors hover:bg-panel hover:text-fg"
      >
        <List size={12} className="shrink-0" />
        <span className="min-w-0 truncate">{target.listName}</span>
        <ChevronDown size={12} className="shrink-0" />
      </button>
      <Popover open={picker === 'list'} anchorRef={listAnchor} onClose={closePicker} label={tc('list')} role="dialog">
        <ListPicker
          spaces={spaces}
          value={target.listId}
          onSelect={(id) => {
            change({ listId: id === listId ? null : id });
            closePicker();
          }}
        />
      </Popover>
    </>
  );

  const saveButton = (
    <button type="submit" disabled={isBlank || confirming} className="ml-auto flex shrink-0 items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs text-white transition-opacity disabled:opacity-50">
      {tc('save')}
      <CornerDownLeft size={12} aria-hidden />
    </button>
  );

  return (
    <form
      ref={root}
      onSubmit={submit}
      onKeyDown={onKeyDown}
      aria-label={label}
      data-testid="task-composer"
      data-variant={variant}
      className={cn('anim-pop-in text-sm', row ? 'space-y-1.5 border-y border-accent bg-panel2 px-3 py-1.5' : 'space-y-2 rounded-lg border border-accent bg-panel2 p-2.5 shadow-md')}
    >
      {row ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full border-2" style={{ borderColor: status ? statusColor(status) : 'var(--muted)' }} aria-hidden />
          <TitleTextarea ref={input} label={t('newLabel')} placeholder={t('inlineAddPlaceholder')} value={draft.title} onChange={(e) => change({ title: e.target.value })} className="min-w-[10rem] flex-1 basis-40 font-medium" />
          <div className="flex flex-wrap items-center gap-0.5">
            <ComposerFields names={COMPOSER_ROW_LEAD_FIELDS} {...fields} />
            <span className="mx-1 h-4 w-px bg-line" aria-hidden />
            <ComposerFields names={COMPOSER_ROW_FIELDS} {...fields} />
            <button type="button" aria-label={tc('cancel')} title={tc('cancel')} onClick={requestClose} className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-panel hover:text-fg">
              <X size={14} />
            </button>
            {saveButton}
          </div>
        </div>
      ) : (
        <>
          {listLink}
          <TitleTextarea ref={input} label={t('newLabel')} placeholder={t('inlineAddPlaceholder')} value={draft.title} onChange={(e) => change({ title: e.target.value })} className="font-medium" />
        </>
      )}
      {row ? <div className="flex min-w-0 items-center gap-2 pl-5">{listLink}</div> : null}
      {message ? (
        <p role="alert" className="flex flex-wrap items-center gap-2 text-xs text-danger">
          <span className="min-w-0 flex-1">{t(message.key, message.values)}</span>
          {!rule && refusal && draft.title !== refusal.draft.title ? (
            <button
              type="button"
              onClick={() => {
                setDraft(refusal.draft);
                focusTitle();
              }}
              className="shrink-0 underline"
            >
              {tc('restore')}
            </button>
          ) : null}
        </p>
      ) : null}
      <ComposerRuleHints space={target.space} draft={draft} onChange={change} onFocus={focusTitle} />
      {row ? null : (
        <>
          <div className="space-y-0.5">
            <ComposerFields names={COMPOSER_CARD_FIELDS} {...fields} />
          </div>
          <div className="flex flex-wrap items-center gap-0.5 border-t border-line pt-1.5">
            <ComposerFields names={COMPOSER_CARD_EXTRA_FIELDS} {...fields} look="icon" />
            {saveButton}
          </div>
        </>
      )}
      {confirming ? (
        <div role="alertdialog" aria-label={tc('discardTitle')} className="flex flex-wrap items-center gap-2 rounded border border-line bg-panel px-2 py-1.5 text-xs">
          <span className="basis-full">{tc('discardTitle')}</span>
          <button type="button" autoFocus onClick={() => setConfirming(false)} className="rounded border border-line px-2 py-0.5 hover:bg-panel2">
            {tc('keepEditing')}
          </button>
          <button type="button" onClick={close} className="rounded bg-danger px-2 py-0.5 text-white">
            {tc('discard')}
          </button>
        </div>
      ) : null}
    </form>
  );
}
