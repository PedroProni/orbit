'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, FileText, List, MoreHorizontal, Paperclip, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { validateFile } from '@/components/attachments/attachments.helpers';
import { Dialog } from '@/components/ui/dialog';
import { MenuList } from '@/components/ui/menu-list';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { useHierarchy, useMe, useMembers } from '@/hooks/use-orbit';
import { orbitService } from '@/services/orbit.service';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { useToastStore } from '@/stores/toast.store';
import { TaskTemplate } from '@/types/workspace.types';
import { ComposerFields } from '../composer-fields';
import { ComposerRuleHints } from '../composer-rule-hints';
import { ListPicker } from '../list-picker';
import { findList } from '../list-picker.helpers';
import { PeoplePicker } from '../people-picker';
import { announceCreated } from '../task-created-toast';
import { describeCreateError } from '../task-create-error';
import { EMPTY_PRESETS } from '../task-composer.constants';
import { TitleTextarea } from '../title-textarea';
import { composerRule, composerTarget, draftFromPresets, inputFromDraft, priorityFromKey, seedTags, titlePrefixOf, toggleIn } from '../task-composer.helpers';
import { ComposerDraft, ComposerRule } from '../task-composer.types';
import { taskListPath } from '../task-link.helpers';
import { openTaskLink } from '../open-task-link';
import { findSpaceByList } from '../task-helpers';
import { BlockerPicker } from './blocker-picker';
import { CREATE_TASK_DESCRIPTION_MAX, CREATE_TASK_EXTRAS } from './create-task.constants';
import { filterCommands, slashMatch, withoutSlash } from './create-task.helpers';
import { BlockerChoice, CreateTaskExtra, CreateTaskFormProps, CreateTaskMode, CreateTaskPicker, CreateTaskTab, SlashCommandId, SlashState } from './create-task.types';
import { runCreateExtras } from './create-task-extras';
import { CreateDocForm } from './create-doc-form';
import { ExtraListEditor } from './extra-list-editor';
import { SlashMenu } from './slash-menu';

export function CreateTaskForm({ open, defaults, onHide }: CreateTaskFormProps) {
  const t = useTranslations('createTask');
  const tc = useTranslations('composer');
  const tt = useTranslations('tasks');
  const ta = useTranslations('attachments');
  const ts = useTranslations('toast');
  const tu = useTranslations('ui');
  const router = useRouter();
  const client = useQueryClient();
  const hierarchy = useHierarchy();
  const me = useMe();
  const members = useMembers();
  const recentIds = useRecentListsStore((s) => s.listIds);
  const hydrateRecents = useRecentListsStore((s) => s.hydrate);
  const remember = useRecentListsStore((s) => s.remember);
  useEffect(() => hydrateRecents(), [hydrateRecents]);
  const spaces = hierarchy.data ?? [];
  const initialSpace = defaults.listId ? findSpaceByList(spaces, defaults.listId) : undefined;
  const presets = { ...EMPTY_PRESETS, status: defaults.status };
  const [tab, setTab] = useState<CreateTaskTab>('task');
  const [draft, setDraftState] = useState<ComposerDraft>(() => draftFromPresets('', { ...presets, tags: seedTags(initialSpace) }, defaults.listId));
  const [description, setDescription] = useState('');
  const [watcherIds, setWatcherIds] = useState<string[]>([]);
  const [extras, setExtras] = useState<CreateTaskExtra[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<BlockerChoice[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [picker, setPicker] = useState<CreateTaskPicker | null>(null);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [rule, setRule] = useState<ComposerRule | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLButtonElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const blockerRef = useRef<HTMLButtonElement>(null);

  const listId = draft.listId ?? (recentIds.find((id) => findList(spaces, id)) || null);
  const fallbackSpace = listId ? findSpaceByList(spaces, listId) : undefined;
  const target = listId && fallbackSpace ? composerTarget(spaces, listId, fallbackSpace) : null;
  const sameSpace = !!target && !!defaults.listId && findSpaceByList(spaces, defaults.listId)?.id === target.space.id;
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name, email: m.email }));
  const meId = me.data?.id ?? null;
  const prefix = target ? titlePrefixOf(draft.title, target.space.titlePrefixes) : '';
  const isBlank = draft.title.trim() === prefix.trim();
  const dirty = !isBlank || !!description.trim() || subtasks.length > 0 || checklist.length > 0 || blockers.length > 0 || files.length > 0;
  const suggestions = target ? target.space.requiredTags.map((tag) => tag.toLowerCase()) : [];

  useEffect(() => {
    if (open && tab === 'task' && !confirming) titleRef.current?.focus();
  }, [open, tab, confirming]);

  const [seededSpace, setSeededSpace] = useState<string | null>(initialSpace?.id ?? null);
  if (target && seededSpace !== target.space.id) {
    setSeededSpace(target.space.id);
    const seeded = seedTags(target.space);
    if (seeded.length) setDraftState((current) => ({ ...current, tags: [...new Set([...current.tags, ...seeded])] }));
  }

  const change = (patch: Partial<ComposerDraft>) => {
    setRule(null);
    setDraftState((current) => ({ ...current, ...patch }));
  };
  const closePicker = () => {
    setPicker(null);
    titleRef.current?.focus();
  };
  const togglePicker = (next: CreateTaskPicker) => setPicker((current) => (current === next ? null : next));
  const showExtra = (extra: CreateTaskExtra) => setExtras((current) => (current.includes(extra) ? current : [...current, extra]));
  const hideExtra = (extra: CreateTaskExtra) => {
    setExtras((current) => current.filter((item) => item !== extra));
    if (extra === 'subtasks') setSubtasks([]);
    if (extra === 'checklist') setChecklist([]);
    if (extra === 'dependencies') setBlockers([]);
  };

  const requestClose = () => {
    if (confirming) setConfirming(false);
    else if (dirty && tab === 'task') setConfirming(true);
    else onHide();
  };

  const applyTemplate = (template: TaskTemplate) => {
    setPicker(null);
    change({ title: isBlank ? template.titleTemplate : draft.title, tags: [...new Set([...draft.tags, ...template.tags])], priority: template.priority ?? draft.priority, taskKind: template.taskKind === 'task' ? draft.taskKind : template.taskKind });
    if (!description.trim()) setDescription(template.descriptionMd);
    titleRef.current?.focus();
  };

  const runCommand = (id: SlashCommandId) => {
    if (slash) change({ title: withoutSlash(draft.title, slash.match) });
    setSlash(null);
    if (id === 'template') setPicker('template');
    if (id === 'attachment') fileRef.current?.click();
    if (id === 'assign') setPicker('people');
    if (id === 'assignMe' && meId) change({ assigneeIds: draft.assigneeIds.includes(meId) ? draft.assigneeIds : [...draft.assigneeIds, meId] });
    if (id === 'follower') setPicker('follower');
    if (id === 'move') setPicker('list');
    if (id === 'subtask') showExtra('subtasks');
    if (id === 'taskKind') setPicker('kind');
  };

  const onTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    change({ title: event.target.value });
    const match = slashMatch(event.target.value, event.target.selectionStart ?? event.target.value.length);
    setSlash(match ? { match, active: 0 } : null);
  };

  const onTitleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const priority = priorityFromKey(event);
    if (priority !== undefined) {
      event.preventDefault();
      change({ priority });
      return;
    }
    if (!slash) return;
    const commands = filterCommands(slash.match.query, (command) => t(`commands.${command.id}`));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setSlash({ ...slash, active: (slash.active + step + commands.length) % Math.max(commands.length, 1) });
    } else if (event.key === 'Enter' && commands[slash.active]) {
      event.preventDefault();
      runCommand(commands[slash.active].id);
    }
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    const checks = picked.map((file) => ({ file, check: validateFile(file) }));
    setFiles((current) => [...current, ...checks.filter((item) => !item.check.errorKey).map((item) => item.file)]);
    setRejected(checks.filter((item) => item.check.errorKey).map((item) => ta(`errors.${item.check.errorKey}`, item.check.values)));
  };

  const reset = () => {
    setDraftState(draftFromPresets(prefix, { ...presets, tags: seedTags(target?.space) }, draft.listId));
    setDescription('');
    setWatcherIds([]);
    setExtras([]);
    setSubtasks([]);
    setChecklist([]);
    setBlockers([]);
    setFiles([]);
    setRejected([]);
    setRule(null);
  };

  const create = async (mode: CreateTaskMode) => {
    setPicker(null);
    if (!target || isBlank || busy || confirming) return;
    const broken = composerRule(draft, target.space);
    if (broken) {
      setRule(broken);
      if (broken.key === 'tagError') setPicker('tags');
      if (broken.key === 'datesError') setPicker('date');
      return;
    }
    setBusy(true);
    try {
      const task = await orbitService.createTask(target.listId, { ...inputFromDraft(draft, presets, sameSpace), ...(description.trim() ? { descriptionMd: description } : {}), ...(watcherIds.length ? { watcherIds } : {}) });
      const failed = await runCreateExtras(task, {
        listId: target.listId,
        subtasks,
        checklist,
        checklistName: t('extras.checklist'),
        blockers,
        files,
      });
      await Promise.all([client.invalidateQueries({ queryKey: ['tasks', target.listId] }), client.invalidateQueries({ queryKey: ['subtasks', task.id] })]);
      remember(target.listId);
      announceCreated(task, target.listName);
      if (failed.length) useToastStore.getState().push('error', 'createExtrasFailed', { items: failed.map((item) => ts(`extrasFailed.${item}`)).join(', ') });
      if (mode === 'another') {
        reset();
        titleRef.current?.focus();
      } else {
        onHide();
        if (mode === 'open') openTaskLink((href) => router.push(href), taskListPath(task.listId, task.id), task.id);
      }
    } catch (error) {
      setRule(describeCreateError(error as Error & { status?: number }) as ComposerRule);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!slash) void create('close');
  };

  const fields = { look: 'icon' as const, draft, people, meId, suggestions, picker, onToggle: togglePicker, onClose: closePicker, onChange: change };

  return (
    <Dialog open={open} onClose={requestClose} label={t('title')} closeLabel={tu('close')} panelClassName="flex max-h-[90vh] w-[min(46rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-xl">
      <div className="flex items-center gap-1 border-b border-line px-3 pt-2" role="tablist" aria-label={t('title')}>
        {(['task', 'doc'] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={cn('-mb-px border-b-2 px-3 py-1.5 text-sm', tab === value ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}>
            {t(`tabs.${value}`)}
          </button>
        ))}
        <button type="button" aria-label={tu('close')} onClick={requestClose} className="ml-auto rounded p-1 text-muted hover:bg-panel2 hover:text-fg">
          <X size={16} />
        </button>
      </div>
      {tab === 'doc' ? (
        <CreateDocForm onDone={onHide} />
      ) : (
        <form onSubmit={submit} aria-label={t('tabs.task')} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button ref={listRef} type="button" aria-haspopup="dialog" aria-expanded={picker === 'list'} onClick={() => togglePicker('list')} className="flex min-w-0 max-w-full items-center gap-1.5 rounded border border-line px-2 py-0.5 text-xs text-fg hover:bg-panel2">
                <List size={12} className="shrink-0 text-muted" />
                <span className="min-w-0 truncate">{target ? target.listName : t('selectList')}</span>
                <ChevronDown size={12} className="shrink-0 text-muted" />
              </button>
              <Popover open={picker === 'list'} anchorRef={listRef} onClose={closePicker} label={tc('list')} role="dialog">
                <ListPicker
                  spaces={spaces}
                  value={target?.listId ?? null}
                  onSelect={(id) => {
                    change({ listId: id });
                    closePicker();
                  }}
                />
              </Popover>
              {target ? (
                <span className="flex items-center rounded border border-line text-xs">
                  <ComposerFields names={['kind']} space={target.space} {...fields} />
                </span>
              ) : null}
            </div>
            <TitleTextarea ref={titleRef} label={t('taskName')} placeholder={t('taskNamePlaceholder')} value={draft.title} maxLength={500} onChange={onTitleChange} onKeyDown={onTitleKeyDown} className="text-lg font-semibold" />
            <Popover open={!!slash} anchorRef={titleRef} onClose={() => setSlash(null)} label={t('commandsLabel')}>
              {slash ? <SlashMenu query={slash.match.query} active={slash.active} onPick={runCommand} onHover={(index) => setSlash({ ...slash, active: index })} /> : null}
            </Popover>
            {rule ? (
              <p role="alert" className="text-xs text-danger">
                {tt(rule.key, rule.values)}
              </p>
            ) : null}
            {target ? <ComposerRuleHints space={target.space} draft={draft} onChange={change} onFocus={() => titleRef.current?.focus()} /> : <p className="text-xs text-muted">{t('pickListFirst')}</p>}
            <textarea aria-label={t('description')} placeholder={t('descriptionPlaceholder')} value={description} maxLength={CREATE_TASK_DESCRIPTION_MAX} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full resize-y rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
            {target ? (
              <div className="flex flex-wrap items-center gap-1">
                <ComposerFields names={['people', 'date', 'priority', 'tags', 'points', 'fields']} space={target.space} {...fields} />
                <button ref={moreRef} type="button" aria-label={t('more')} title={t('more')} aria-haspopup="menu" aria-expanded={picker === 'more'} onClick={() => togglePicker('more')} className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-panel2 hover:text-fg">
                  <MoreHorizontal size={14} />
                </button>
                <Popover open={picker === 'more'} anchorRef={moreRef} onClose={closePicker} label={t('more')}>
                  <MenuList label={t('more')} onClose={closePicker} items={CREATE_TASK_EXTRAS.map((extra) => ({ key: extra, label: t(`extras.${extra}`), onSelect: () => showExtra(extra) }))} />
                </Popover>
              </div>
            ) : null}
            {extras.includes('dependencies') ? (
              <section aria-label={t('extras.dependencies')} className="space-y-1 rounded border border-line p-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <span className="min-w-0 flex-1 truncate">{t('extras.dependencies')}</span>
                  <button type="button" aria-label={t('removeSection', { section: t('extras.dependencies') })} onClick={() => hideExtra('dependencies')} className="rounded p-0.5 hover:bg-panel2 hover:text-fg">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {blockers.map((blocker) => (
                    <span key={blocker.id} className="flex max-w-full items-center gap-1 rounded bg-panel2 px-1.5 py-0.5 text-xs">
                      <span className="min-w-0 truncate">{blocker.title}</span>
                      <button type="button" aria-label={t('removeItem', { item: blocker.title })} onClick={() => setBlockers((current) => current.filter((item) => item.id !== blocker.id))} className="text-muted hover:text-danger">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <button ref={blockerRef} type="button" onClick={() => togglePicker('blockers')} className="rounded border border-dashed border-line px-1.5 py-0.5 text-xs text-muted hover:text-fg">
                    {t('addBlocker')}
                  </button>
                  <Popover open={picker === 'blockers'} anchorRef={blockerRef} onClose={closePicker} label={t('extras.dependencies')} role="dialog">
                    <BlockerPicker selected={blockers} onToggle={(choice) => setBlockers((current) => (current.some((item) => item.id === choice.id) ? current.filter((item) => item.id !== choice.id) : [...current, choice]))} />
                  </Popover>
                </div>
              </section>
            ) : null}
            {extras.includes('subtasks') ? <ExtraListEditor label={t('extras.subtasks')} placeholder={t('addSubtask')} items={subtasks} onChange={setSubtasks} onRemoveSection={() => hideExtra('subtasks')} removeLabel={t('removeSection', { section: t('extras.subtasks') })} /> : null}
            {extras.includes('checklist') ? <ExtraListEditor label={t('extras.checklist')} placeholder={t('addChecklistItem')} items={checklist} onChange={setChecklist} onRemoveSection={() => hideExtra('checklist')} removeLabel={t('removeSection', { section: t('extras.checklist') })} /> : null}
            {files.length || rejected.length ? (
              <section aria-label={t('attachments')} className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {files.map((file, index) => (
                    <span key={`${index}-${file.name}`} className="flex max-w-full items-center gap-1 rounded bg-panel2 px-1.5 py-0.5 text-xs">
                      <Paperclip size={10} className="shrink-0 text-muted" />
                      <span className="min-w-0 truncate">{file.name}</span>
                      <button type="button" aria-label={t('removeItem', { item: file.name })} onClick={() => setFiles((current) => current.filter((_, position) => position !== index))} className="text-muted hover:text-danger">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                {rejected.map((message) => (
                  <p key={message} role="alert" className="text-xs text-danger">
                    {message}
                  </p>
                ))}
              </section>
            ) : null}
          </div>
          {confirming ? (
            <div role="alertdialog" aria-label={tc('discardTitle')} className="flex flex-wrap items-center gap-2 border-t border-line bg-panel2 px-4 py-2 text-xs">
              <span className="min-w-0 flex-1">{tc('discardTitle')}</span>
              <button type="button" autoFocus onClick={() => setConfirming(false)} className="rounded border border-line px-2 py-0.5 hover:bg-panel">
                {tc('keepEditing')}
              </button>
              <button type="button" onClick={onHide} className="rounded bg-danger px-2 py-0.5 text-white">
                {tc('discard')}
              </button>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-1 border-t border-line px-4 py-2">
            {target ? <ComposerFields names={['template']} space={target.space} {...fields} onTemplate={applyTemplate} /> : null}
            <button type="button" aria-label={t('commands.attachment')} title={t('commands.attachment')} onClick={() => fileRef.current?.click()} className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-panel2 hover:text-fg">
              <Paperclip size={14} />
            </button>
            <input ref={fileRef} type="file" multiple hidden onChange={onFiles} aria-label={t('commands.attachment')} />
            <button
              ref={bellRef}
              type="button"
              aria-label={t('followers', { count: watcherIds.length })}
              title={t('followers', { count: watcherIds.length })}
              aria-haspopup="dialog"
              aria-expanded={picker === 'follower'}
              onClick={() => togglePicker('follower')}
              className="flex h-6 items-center gap-1 rounded px-1 text-xs text-muted hover:bg-panel2 hover:text-fg"
            >
              <Bell size={14} />
              {watcherIds.length}
            </button>
            <Popover open={picker === 'follower'} anchorRef={bellRef} onClose={closePicker} label={t('followersLabel')} role="dialog">
              <PeoplePicker people={people} selected={watcherIds} meId={meId} alwaysSearch label={t('followersLabel')} onToggle={(id) => setWatcherIds((current) => toggleIn(current, id))} />
            </Popover>
            <div className="ml-auto flex items-center">
              <button type="submit" disabled={!target || isBlank || busy || confirming} className="flex items-center gap-1.5 rounded-l bg-accent px-3 py-1 text-sm text-white disabled:opacity-50">
                <FileText size={14} aria-hidden />
                {t('create')}
              </button>
              <button
                ref={submitRef}
                type="button"
                aria-label={t('createOptions')}
                aria-haspopup="menu"
                aria-expanded={picker === 'submit'}
                disabled={!target || isBlank || busy || confirming}
                onClick={() => togglePicker('submit')}
                className="rounded-r border-l border-white/30 bg-accent px-1.5 py-1 text-white disabled:opacity-50"
              >
                <ChevronDown size={14} />
              </button>
              <Popover open={picker === 'submit'} anchorRef={submitRef} onClose={closePicker} label={t('createOptions')} align="end">
                <MenuList
                  label={t('createOptions')}
                  onClose={() => setPicker(null)}
                  items={[
                    { key: 'open', label: t('createAndOpen'), onSelect: () => void create('open') },
                    { key: 'another', label: t('createAnother'), onSelect: () => void create('another') },
                  ]}
                />
              </Popover>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
