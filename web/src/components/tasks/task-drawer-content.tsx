'use client';

import { useState } from 'react';
import { ArrowRight, CalendarDays, CircleDot, Clock, Flag, Hash, Hourglass, Tag, UploadCloud, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHierarchy, useMembers, useTask, useTasks, useUpdateTask } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useUploads } from '@/hooks/use-attachments';
import { useUiStore } from '@/stores/ui.store';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { PRIORITIES } from './tasks.constants';
import { TaskSubtasks } from './task-subtasks';
import { TaskChecklists } from './task-checklists';
import { TaskFieldsSection } from './task-fields-section';
import { TaskPeopleField } from './task-people-field';
import { TaskPointsField } from './task-points-field';
import { TaskTagsField } from './task-tags-field';
import { TaskActionLinks } from './task-action-links';
import { TaskDependencies } from './task-dependencies';
import { TaskDescription } from './task-description';
import { TaskDrawerHeader } from './task-drawer-header';
import { TaskEstimateField } from './task-estimate-field';
import { TaskKindField } from './task-kind-field';
import { TaskPropertyRow } from './task-property-row';
import { TaskRepeatIndicator } from './task-repeat-indicator';
import { TaskRepeatSection } from './task-repeat-section';
import { TaskStatusPill } from './task-status-pill';
import { TaskTimeline } from './task-timeline';
import { TaskTrackTimeField } from './task-track-time-field';
import { TaskModalSkeleton } from './task-modal-skeleton';
import { TaskDrawerContentProps } from './task-drawer-content.types';
import { ICON_BUTTON_CLASS } from './task-drawer-header.constants';
import { TaskAttachments } from '@/components/attachments/task-attachments';
import { DateField } from '@/components/ui/date-field';
import { dayFromIso, isoFromDay } from '@/lib/calendar-day';
import { EmptyState } from '@/components/ui/empty-state';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { Select } from '@/components/ui/select';
import { TaskPriority } from '@/types/api.types';
import { TaskPatch } from '@/services/orbit.types';
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
  const [titleFocused, setTitleFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (!sameTask) {
        setError(null);
        setAddingChecklist(false);
        setComposingSubtask(false);
        setRelating(false);
      }
    }
  }

  const data = task.data;
  const people = (members.data ?? []).map((m) => ({ id: m.id, name: m.name }));
  const siblings = (siblingTasks.data?.data ?? []).filter((item) => !item.parentId);
  const tagSuggestions = [...new Set([...(space?.requiredTags ?? []).map((tag) => tag.toLowerCase()), ...siblings.flatMap((item) => item.tags)])];
  const fail = (err: unknown) => {
    const described = describeApiError(err);
    setError(tApi(described.key, described.values));
  };
  const save = (patch: TaskPatch) => {
    setError(null);
    update.mutate({ id: taskId, patch }, { onError: fail });
  };
  const canRepeat = !readOnly && !!data && !data.parentId;

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
        void uploads.start(Array.from(e.dataTransfer.files));
      }}
      className="relative flex h-full flex-col"
    >
      {dragging ? (
        <div data-testid="drop-overlay" className="anim-fade-in pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent bg-panel/90 text-accent">
          <UploadCloud size={32} />
          <span className="text-sm">{t('dropFiles')}</span>
        </div>
      ) : null}
      {data && space ? (
        <TaskDrawerHeader task={data} space={space} siblings={siblings} readOnly={readOnly} people={people} onToggleWatcher={(id) => save({ watcherIds: data.watcherIds.includes(id) ? data.watcherIds.filter((item) => item !== id) : [...data.watcherIds, id] })} />
      ) : (
        <header className="flex h-11 shrink-0 items-center justify-end border-b border-line px-3">
          <button type="button" aria-label={t('close')} onClick={() => openTask(null)} className={ICON_BUTTON_CLASS}>
            <X size={16} />
          </button>
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
        <div className="min-w-0 lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-[720px] space-y-5 px-4 py-6 text-[13px] sm:px-8">
            {!data && !task.isError ? <TaskModalSkeleton label={tp('loading')} /> : null}
            {task.isError ? (
              <div className="mt-8">
                <EmptyState title={tp('linkNotFound')} hint={tp('linkNotFoundHint')} />
              </div>
            ) : null}
            {data && space ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted">{readOnly ? <span className="rounded bg-panel2 px-2 py-0.5">{t('readOnlyBadge')}</span> : <TaskKindField taskId={data.id} onError={fail} />}</div>
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
                    className="no-focus-ring w-full resize-none bg-transparent font-heading text-2xl font-bold leading-tight outline-none [field-sizing:content]"
                  />
                  {error ? (
                    <p role="alert" className="text-xs text-danger">
                      {error}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div>
                    <TaskPropertyRow icon={CircleDot} label={t('status')}>
                      <TaskStatusPill statuses={space.statuses} value={data.status} readOnly={readOnly} onChange={(status) => save({ status })} />
                    </TaskPropertyRow>
                    <TaskPropertyRow icon={CalendarDays} label={t('dates')}>
                      <div className="flex min-w-0 items-center gap-1">
                        <DateField ariaLabel={t('startDate')} placeholder={t('start')} variant="inline" className="w-auto" disabled={readOnly} value={dayFromIso(data.startDate)} onChange={(day) => save({ startDate: isoFromDay(day) })} />
                        <ArrowRight aria-hidden="true" size={12} className="shrink-0 text-muted" />
                        <DateField
                          ariaLabel={t('dueDate')}
                          placeholder={t('due')}
                          variant="inline"
                          className="w-auto"
                          disabled={readOnly}
                          value={dayFromIso(data.dueDate)}
                          onChange={(day) => save({ dueDate: isoFromDay(day) })}
                          footer={canRepeat ? <TaskRepeatSection taskId={data.id} onError={fail} /> : undefined}
                        />
                        {canRepeat ? <TaskRepeatIndicator taskId={data.id} /> : null}
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
                        placeholder={t('empty')}
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
                <hr className="border-line" />
                <TaskDescription key={data.id} value={data.descriptionMd} readOnly={readOnly} onSave={(descriptionMd) => save({ descriptionMd })} />
                <TaskFieldsSection task={data} readOnly={readOnly} save={save} />
                <TaskChecklists task={data} readOnly={readOnly} save={save} adding={addingChecklist} onAddingChange={setAddingChecklist} />
                {readOnly ? null : <TaskDependencies taskId={data.id} siblings={siblings} open={relating} onClose={() => setRelating(false)} onError={fail} />}
                <TaskSubtasks parentId={data.id} listId={data.listId} canAdd={!readOnly && !data.parentId} composing={composingSubtask} onComposingChange={setComposingSubtask} />
                {readOnly ? null : <TaskAttachments taskId={data.id} controller={uploads} />}
                {readOnly ? null : <TaskActionLinks canAddSubtask={!data.parentId} onAddSubtask={() => setComposingSubtask(true)} onAddDependency={() => setRelating(true)} onAddChecklist={() => setAddingChecklist(true)} onAttach={(files) => void uploads.start(files)} />}
              </>
            ) : null}
          </div>
        </div>
        {data && space ? (
          <aside className="min-w-0 border-t border-line bg-panel lg:min-h-0 lg:border-l lg:border-t-0">
            <TaskTimeline task={data} statuses={space.statuses} readOnly={readOnly} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
