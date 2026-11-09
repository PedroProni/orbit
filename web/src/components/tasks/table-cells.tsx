import { useTranslations } from 'next-intl';
import { Avatar, AvatarStack } from '@/components/common/avatar';
import { PriorityFlag } from '@/components/ui/priority-flag';
import { Select } from '@/components/ui/select';
import { TaskPriority } from '@/types/api.types';
import { PRIORITIES } from './tasks.constants';
import { TableAssigneeCellProps, TablePriorityCellProps } from './task-table-view.types';

export function TableAssigneeCell({ people }: TableAssigneeCellProps) {
  const t = useTranslations('board');
  if (people.length === 0) return <span className="text-xs text-muted">{t('unassigned')}</span>;
  if (people.length === 1) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar id={people[0].id} name={people[0].name} />
        <span className="truncate">{people[0].name}</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <AvatarStack people={people} />
      <span className="truncate text-xs">{people.map((person) => person.name.split(' ')[0]).join(', ')}</span>
    </span>
  );
}

export function TablePriorityCell({ task, readOnly, onChange }: TablePriorityCellProps) {
  const t = useTranslations('tasks');
  if (readOnly) {
    return (
      <span className="flex items-center gap-1.5">
        <PriorityFlag priority={task.priority} size={13} />
        {task.priority ? <span>{t(`priority.${task.priority}`)}</span> : null}
      </span>
    );
  }
  return (
    <Select
      variant="ghost"
      ariaLabel={t('columns.priority')}
      value={task.priority ?? ''}
      className="max-w-full text-sm text-fg"
      options={[{ value: '', label: t('priority.none'), icon: <PriorityFlag priority={null} /> }, ...PRIORITIES.map((priority) => ({ value: priority, label: t(`priority.${priority}`), icon: <PriorityFlag priority={priority} /> }))]}
      onChange={(priority) => onChange((priority || null) as TaskPriority | null)}
    />
  );
}
