import { isOverdueDay, todayDay } from '@/lib/calendar-day';
import { Member, Task } from '@/types/api.types';
import { WorkloadRow } from './workload.types';

export function computeWorkload(tasks: Task[], members: Member[], today: string = todayDay()): WorkloadRow[] {
  const rows = new Map<string, WorkloadRow>();
  const row = (id: string): WorkloadRow => {
    const existing = rows.get(id);
    if (existing) return existing;
    const created = { id, name: members.find((m) => m.id === id)?.name ?? '', open: 0, points: 0, overdue: 0 };
    rows.set(id, created);
    return created;
  };
  for (const task of tasks) {
    if (task.dateClosed || task.archived) continue;
    const owners = task.assigneeIds.length ? task.assigneeIds : [''];
    for (const owner of owners) {
      const entry = row(owner);
      entry.open += 1;
      entry.points += task.points ?? 0;
      if (isOverdueDay(task.dueDate, today)) entry.overdue += 1;
    }
  }
  return [...rows.values()].sort((a, b) => b.open - a.open);
}
