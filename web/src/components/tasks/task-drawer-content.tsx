'use client';

import { useState } from 'react';
import { ArrowRight, CalendarDays, CircleDot, Clock, Flag, Hash, Hourglass, Repeat, Tag, UploadCloud, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHierarchy, useMembers, useTask, useTasks, useUpdateTask } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useUploads } from '@/hooks/use-attachments';
import { useUiStore } from '@/stores/ui.store';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { MarkdownView } from '@/components/common/markdown-view';
import { PRIORITIES } from './tasks.constants';
import { TaskActivity } from './task-activity';
import { TaskComments } from './task-comments';
import { TaskSubtasks } from './task-subtasks';
import { TaskChecklists } from './task-checklists';
import { TaskCustomFields } from './task-custom-fields';
import { TaskPeopleField } from './task-people-field';
import { TaskPointsField } from './task-points-field';
import { TaskTagsField } from './task-tags-field';
import { TaskActionLinks } from './task-action-links';
import { TaskDependencies } from './task-dependencies';
import { TaskEstimateField } from './task-estimate-field';
import { TaskKindField } from './task-kind-field';
import { TaskPropertyRow } from './task-property-row';
import { TaskRepeatField } from './task-repeat-field';
import { TaskTrackTimeField } from './task-track-time-field';
import { TaskWatchersBell } from './task-watchers-bell';
import { TaskModalSkeleton } from './task-modal-skeleton';
import { StatusChip } from './status-chip';
import { statusColor } from './task-helpers';
import { TaskDrawerContentProps } from './task-drawer-content.types';
import { TaskAttachments } from '@/components/attachments/task-attachments';
import { DateField } from '@/components/ui/date-field';
import { dayFromIso, isoFromDay } from '@/lib/calendar-day';
import { EmptyState } from '@/components/ui/empty-state';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { Select } from '@/components/ui/select';
import { TaskPriority } from '@/types/api.types';
import { TaskPatch } from '@/services/orbit.types';
import { useStatusLabel } from '@/hooks/use-status-label';
import { describeApiError } from '@/lib/api-error';

export function TaskDrawerContent({ taskId }: TaskDrawerContentProps) {
  const t = useTranslations('drawer');
  const tp = useTranslations('tasks');
  const openTask = useUiStore((s) => s.openTask);
  const task = useTask(taskId);
  const { isGuest: readOnly } = useCapabilities();
  const hierarchy = useHierarchy();
  const members = useMembers();
  const siblingTasks = useTasks(task.data?.listId ?? '', EMPTY_FILTERS);
  const update = useUpdateTask();
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusLabel = useStatusLabel();
  const tApi = useTranslations('apiErrors');
  const [dragging, setDragging] = useState(false);
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [composingSubtask, setComposingSubtask] = useState(false);
  const [relating, setRelating] = useState(false);
  const uploads = useUploads(taskId);
  const space = hierarchy.data?.find((s) => s.id === task.data?.spaceId);

  const loadedKey = task.data ? `${task.data.id}:${task.data.updatedAt}` : null;
  if (loadedKey !== syncedKey) {
    const sameTask = !!task.data && !!syncedKey && syncedKey.startsWith(`${task.data.id}:`);
    setSyncedKey(loadedKey);
    if (task.data) {
      if (!sameTask || !titleFocused) setTitle(task.data.title);
      if (!sameTask || !editing) setDescription(task.data.descriptionMd);
      if (!sameTask) {
        setEditing(false);
        setError(null);
        setAddingChecklist(false);
        setComposingSubtask(false);
        setRelating(false);
      }
    }
  }

  const data = task.data;
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name }));
  const tagSuggestions = [...new Set([...(space?.requiredTags ?? []).map((tag) => tag.toLowerCase()), ...(siblingTasks.data?.data ?? []).flatMap((item) => item.tags)])];
  const fail = (err: unknown) => {
    const described = describeApiError(err);
    setError(tApi(described.key, described.values));
  };
  const save = (patch: TaskPatch) => {
    setError(null);
    update.mutate({ id: taskId, patch }, { onError: fail });
  };

  return (
    <div
      data-testid="task-drawer-dropzone"
      onDragEnter={(e) => !readOnly && e.dataTransfer.types.includes('Files') && setDragging(true)}
      onDragOver={(e) => !readOnly && e.dataTransfer.types.includes('Files') && e.preventDefault()}
      onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget as Node) || setDragging(false)}
      onDrop={(e) => {
        if (readOnly || !e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        uploads.start(Array.from(e.dataTransfer.files));
      }}
      className="relative h-full"
    >
      {dragging ? (
        <div data-testid="drop-overlay" className="anim-fade-in pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent bg-panel/90 text-accent">
          <UploadCloud size={32} />
          <span className="text-sm">{t('dropFiles')}</span>
        </div>
      ) : null}
      <button type="button" aria-label={t('close')} className="absolute right-3 top-3 z-[5] text-muted transition-colors hover:text-fg" onClick={() => openTask(null)}>
        <X size={18} />
      </button>
      <div className="h-full overflow-x-hidden overflow-y-auto p-4">
        {!data && !task.isError ? <TaskModalSkeleton label={tp('loading')} /> : null}
        {task.isError ? (
          <div className="mt-8">
            <EmptyState title={tp('linkNotFound')} hint={tp('linkNotFoundHint')} />
          </div>
        ) : null}
        {data && space ? (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="flex items-center gap-2 pr-8 text-xs text-muted">
                <span className="max-w-48 truncate whitespace-nowrap">{space.name}</span>
                <StatusChip status={space.statuses.find((x) => x.name === data.status)} />
                {readOnly ? null : <TaskKindField taskId={data.id} onError={fail} />}
                {readOnly ? <span className="rounded bg-panel2 px-2 py-0.5">{t('readOnlyBadge')}</span> : null}
                {readOnly ? null : (
                  <div className="ml-auto">
                    <TaskWatchersBell people={people} selected={data.watcherIds} onToggle={(id) => save({ watcherIds: data.watcherIds.includes(id) ? data.watcherIds.filter((item) => item !== id) : [...data.watcherIds, id] })} />
                  </div>
                )}
              </div>
              <textarea
                aria-label={t('titleField')}
                rows={1}
                readOnly={readOnly}
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => {
                  setTitleFocused(false);
                  if (title.trim() && title !== data.title) save({ title: title.trim() });
                }}
                className="no-focus-ring w-full resize-none bg-transparent pr-8 font-heading text-lg font-semibold outline-none [field-sizing:content]"
              />
              {error ? (
                <p role="alert" className="text-xs text-danger">
                  {error}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <div>
                  <TaskPropertyRow icon={CircleDot} label={t('status')}>
                    <Select
                      ariaLabel={t('status')}
                      variant="inline"
                      disabled={readOnly}
                      value={data.status}
                      options={space.statuses.map((s) => ({ value: s.name, label: statusLabel(s.name), icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor(s) }} /> }))}
                      onChange={(status) => save({ status })}
                    />
                  </TaskPropertyRow>
                  <TaskPropertyRow icon={CalendarDays} label={t('dates')}>
                    <div className="flex min-w-0 items-center gap-1">
                      <DateField ariaLabel={t('startDate')} variant="inline" className="w-auto" disabled={readOnly} value={dayFromIso(data.startDate)} onChange={(day) => save({ startDate: isoFromDay(day) })} />
                      <ArrowRight aria-hidden="true" size={12} className="shrink-0 text-muted" />
                      <DateField ariaLabel={t('dueDate')} variant="inline" className="w-auto" disabled={readOnly} value={dayFromIso(data.dueDate)} onChange={(day) => save({ dueDate: isoFromDay(day) })} />
                    </div>
                  </TaskPropertyRow>
                  {readOnly ? null : (
                    <>
                      <TaskPropertyRow icon={Hourglass} label={t('timeEstimate')}>
                        <TaskEstimateField taskId={data.id} onError={fail} />
                      </TaskPropertyRow>
                      <TaskPropertyRow icon={Clock} label={t('trackTime')}>
                        <TaskTrackTimeField taskId={data.id} onError={fail} />
                      </TaskPropertyRow>
                      <TaskPropertyRow icon={Repeat} label={t('repeat')}>
                        <TaskRepeatField taskId={data.id} onError={fail} />
                      </TaskPropertyRow>
                    </>
                  )}
                </div>
                <div>
                  {readOnly ? null : (
                    <TaskPropertyRow icon={Users} label={t('assignees')}>
                      <TaskPeopleField label={t('assignees')} emptyLabel={t('empty')} people={people} selected={data.assigneeIds} onToggle={(id) => save(data.assigneeIds.includes(id) ? { removeAssigneeIds: [id] } : { addAssigneeIds: [id] })} />
                    </TaskPropertyRow>
                  )}
                  <TaskPropertyRow icon={Flag} label={t('priority')}>
                    <Select
                      ariaLabel={t('priority')}
                      variant="inline"
                      disabled={readOnly}
                      value={data.priority ?? ''}
                      options={[{ value: '', label: tp('priority.none'), icon: <PriorityFlag priority={null} /> }, ...PRIORITIES.map((p) => ({ value: p, label: tp(`priority.${p}`), icon: <PriorityFlag priority={p} /> }))]}
                      onChange={(priority) => save({ priority: (priority || null) as TaskPriority | null })}
                    />
                  </TaskPropertyRow>
                  <TaskPropertyRow icon={Hash} label={t('points')}>
                    <TaskPointsField key={`${data.id}:${data.points}`} value={data.points} readOnly={readOnly} onSave={(points) => save({ points })} />
                  </TaskPropertyRow>
                  <TaskPropertyRow icon={Tag} label={t('tags')}>
                    <TaskTagsField tags={data.tags} suggestions={tagSuggestions} readOnly={readOnly} onAdd={(tag) => save({ addTags: [tag] })} onRemove={(tag) => save({ removeTags: [tag] })} />
                  </TaskPropertyRow>
                </div>
              </div>
              {readOnly && !data.descriptionMd.trim() ? null : (
                <section>
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-xs uppercase text-muted">{t('description')}</h2>
                    {readOnly ? null : (
                      <button type="button" className="text-xs text-accent" onClick={() => setEditing((v) => !v)}>
                        {editing ? t('preview') : t('edit')}
                      </button>
                    )}
                  </div>
                  {editing ? (
                    <div className="space-y-2">
                      <textarea aria-label={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full rounded border border-line bg-panel2 p-2 text-sm" />
                      <button
                        type="button"
                        className="rounded bg-accent px-3 py-1 text-sm text-white"
                        onClick={() => {
                          save({ descriptionMd: description });
                          setEditing(false);
                        }}
                      >
                        {t('save')}
                      </button>
                    </div>
                  ) : (
                    <MarkdownView source={data.descriptionMd} />
                  )}
                </section>
              )}
              {readOnly ? null : <TaskCustomFields task={data} save={save} />}
              <TaskChecklists task={data} readOnly={readOnly} save={save} adding={addingChecklist} onAddingChange={setAddingChecklist} />
              {readOnly ? null : <TaskDependencies taskId={data.id} siblings={siblingTasks.data?.data ?? []} open={relating} onClose={() => setRelating(false)} onError={fail} />}
              <TaskSubtasks parentId={data.id} listId={data.listId} canAdd={!readOnly && !data.parentId} composing={composingSubtask} onComposingChange={setComposingSubtask} />
              {readOnly ? null : <TaskAttachments taskId={data.id} controller={uploads} />}
              {readOnly ? null : <TaskActionLinks canAddSubtask={!data.parentId} onAddSubtask={() => setComposingSubtask(true)} onAddDependency={() => setRelating(true)} onAddChecklist={() => setAddingChecklist(true)} onAttach={(files) => uploads.start(files)} />}
            </div>
            <div className="space-y-6 border-line lg:border-l lg:pl-5">
              {readOnly ? null : <TaskComments taskId={data.id} />}
              <TaskActivity taskId={data.id} spaceId={data.spaceId} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
