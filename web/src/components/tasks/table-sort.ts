import { dayFromIso, dayStartMs } from '@/lib/calendar-day';
import { PRIORITY_RANK, TableColumn } from './table.constants';
import { Task } from '@/types/api.types';

const valueOf = (task: Task, column: TableColumn): string | number => {
  switch (column) {
    case 'title':
      return task.title.toLowerCase();
    case 'status':
      return task.status;
    case 'priority':
      return task.priority ? PRIORITY_RANK[task.priority] : 9;
    case 'assignee':
      return task.assigneeIds[0] ?? '';
    case 'dueDate':
      return task.dueDate ? dayStartMs(dayFromIso(task.dueDate)) : Number.MAX_SAFE_INTEGER;
    case 'points':
      return task.points ?? -1;
    case 'updatedAt':
      return Date.parse(task.updatedAt);
  }
};

export function sortTasks(tasks: Task[], column: TableColumn, direction: 1 | -1): Task[] {
  return [...tasks].sort((a, b) => {
    const left = valueOf(a, column);
    const right = valueOf(b, column);
    return (left < right ? -1 : left > right ? 1 : 0) * direction;
  });
}
