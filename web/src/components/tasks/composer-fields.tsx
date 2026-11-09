'use client';

import { CalendarDays, Hash, LayoutTemplate, Shapes, SlidersHorizontal, Tag, UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AvatarStack } from '@/components/common/avatar';
import { MenuList } from '@/components/ui/menu-list';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { TASK_KINDS } from '@/components/workspace/workspace.constants';
import { formatShortDay } from '@/lib/calendar-day';
import { TaskKind, TaskPriority } from '@/types/api.types';
import { ComposerField } from './composer-field';
import { ComposerFieldsProps } from './composer-fields.types';
import { CustomFieldsPicker } from './custom-fields-picker';
import { DatesPicker } from './dates-picker';
import { PeoplePicker } from './people-picker';
import { TagPicker } from './tag-picker';
import { TemplatePicker } from './template-picker';
import { toggleIn } from './task-composer.helpers';
import { PRIORITIES } from './tasks.constants';

export function ComposerFields({ names, look, draft, space, people, meId, suggestions, picker, onToggle, onClose, onChange, onTemplate }: ComposerFieldsProps) {
  const t = useTranslations('tasks');
  const tc = useTranslations('composer');
  const tp = useTranslations('planning');
  const locale = useLocale();
  const line = look === 'line';
  const assignees = people.filter((person) => draft.assigneeIds.includes(person.id));
  const dates = draft.startDate || draft.dueDate ? tc('datesValue', { start: draft.startDate ? formatShortDay(draft.startDate, locale) : tc('noDate'), due: draft.dueDate ? formatShortDay(draft.dueDate, locale) : tc('noDate') }) : null;
  const fieldCount = draft.customFields.filter((item) => item.value !== null).length;
  const render = {
    template: onTemplate ? (
      <ComposerField key="template" look={look} label={tc('templates')} icon={<LayoutTemplate size={14} />} active={false} open={picker === 'template'} onToggle={() => onToggle('template')} onClose={onClose}>
        <TemplatePicker spaceId={space.id} onPick={onTemplate} />
      </ComposerField>
    ) : null,
    people: (
      <ComposerField
        key="people"
        look={look}
        label={line ? tc('addAssignee') : tc('assignees')}
        icon={assignees.length && !line ? <AvatarStack people={assignees} /> : <UserPlus size={14} />}
        value={
          assignees.length ? (
            line ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <AvatarStack people={assignees} />
                <span className="truncate">{assignees.map((person) => person.name).join(', ')}</span>
              </span>
            ) : null
          ) : null
        }
        active={assignees.length > 0}
        open={picker === 'people'}
        onToggle={() => onToggle('people')}
        onClose={onClose}
      >
        <PeoplePicker people={people} selected={draft.assigneeIds} meId={meId} alwaysSearch label={tc('assignees')} onToggle={(id) => onChange({ assigneeIds: toggleIn(draft.assigneeIds, id) })} />
      </ComposerField>
    ),
    date: (
      <ComposerField key="date" look={look} label={line ? tc('addDates') : tc('dates')} icon={<CalendarDays size={14} />} value={dates} active={!!dates} open={picker === 'date'} onToggle={() => onToggle('date')} onClose={onClose}>
        <DatesPicker value={{ startDate: draft.startDate, dueDate: draft.dueDate }} onChange={(value) => onChange(value)} onDone={onClose} />
      </ComposerField>
    ),
    priority: (
      <ComposerField
        key="priority"
        look={look}
        label={line ? tc('addPriority') : tc('priority')}
        icon={<PriorityFlag priority={draft.priority} size={14} />}
        value={draft.priority && line ? t(`priority.${draft.priority}`) : null}
        active={!!draft.priority}
        open={picker === 'priority'}
        onToggle={() => onToggle('priority')}
        onClose={onClose}
      >
        <MenuList label={tc('priority')} onClose={onClose} items={[...PRIORITIES, null].map((value: TaskPriority | null) => ({ key: value ?? 'none', label: t(`priority.${value ?? 'none'}`), icon: <PriorityFlag priority={value} />, onSelect: () => onChange({ priority: value }) }))} />
        <p className="border-t border-line px-2 py-1.5 text-[11px] text-muted">{tc('priorityKeys')}</p>
      </ComposerField>
    ),
    tags: (
      <ComposerField
        key="tags"
        look={look}
        label={line ? tc('addTag') : tc('tags')}
        icon={<Tag size={14} />}
        value={
          draft.tags.length ? (
            line ? (
              <span className="flex min-w-0 flex-wrap gap-1">
                {draft.tags.map((tag) => (
                  <span key={tag} className="rounded bg-accentsoft px-1.5 py-0.5 text-[11px] text-fg">
                    {tag}
                  </span>
                ))}
              </span>
            ) : (
              draft.tags.length
            )
          ) : null
        }
        active={draft.tags.length > 0}
        open={picker === 'tags'}
        onToggle={() => onToggle('tags')}
        onClose={onClose}
      >
        <TagPicker label={tc('tags')} selected={draft.tags} suggestions={suggestions} onToggle={(tag) => onChange({ tags: toggleIn(draft.tags, tag) })} />
      </ComposerField>
    ),
    kind: (
      <ComposerField key="kind" look={look} label={tc('taskKind')} icon={<Shapes size={14} />} value={draft.taskKind ? tp(`kinds.${draft.taskKind}`) : null} active={!!draft.taskKind} open={picker === 'kind'} onToggle={() => onToggle('kind')} onClose={onClose}>
        <MenuList label={tc('taskKind')} onClose={onClose} items={TASK_KINDS.map((kind: TaskKind) => ({ key: kind, label: tp(`kinds.${kind}`), onSelect: () => onChange({ taskKind: kind === 'task' ? null : kind }) }))} />
      </ComposerField>
    ),
    fields: (
      <ComposerField key="fields" look={look} label={tc('customFields')} icon={<SlidersHorizontal size={14} />} value={fieldCount || null} active={fieldCount > 0} open={picker === 'fields'} onToggle={() => onToggle('fields')} onClose={onClose}>
        <CustomFieldsPicker spaceId={space.id} values={draft.customFields} onChange={(customFields) => onChange({ customFields })} />
      </ComposerField>
    ),
    points: (
      <ComposerField key="points" look={look} label={tc('points')} icon={<Hash size={14} />} value={draft.points ?? null} active={draft.points !== null} open={picker === 'points'} onToggle={() => onToggle('points')} onClose={onClose}>
        <div className="w-32 p-2">
          <input
            autoFocus
            type="number"
            min={0}
            step="any"
            aria-label={tc('points')}
            value={draft.points ?? ''}
            onChange={(e) => onChange({ points: Number.isFinite(e.target.valueAsNumber) && e.target.valueAsNumber >= 0 ? e.target.valueAsNumber : null })}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              onClose();
            }}
            className="w-full rounded border border-line bg-panel2 px-2 py-1 text-sm"
          />
        </div>
      </ComposerField>
    ),
  };
  return <>{names.map((name) => render[name])}</>;
}
