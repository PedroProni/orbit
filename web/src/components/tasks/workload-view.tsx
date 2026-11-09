'use client';

import { useTranslations } from 'next-intl';
import { useMembers } from '@/hooks/use-orbit';
import { computeWorkload } from './workload';
import { Task } from '@/types/api.types';

export function WorkloadView({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('workload');
  const members = useMembers();
  const rows = computeWorkload(tasks, members.data ?? []);
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-3xl text-left text-sm">
        <thead className="text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="py-2 pr-3">
              {t('person')}
            </th>
            <th scope="col" className="whitespace-nowrap pr-3">
              {t('open')}
            </th>
            <th scope="col" className="whitespace-nowrap pr-3">
              {t('points')}
            </th>
            <th scope="col" className="whitespace-nowrap pr-3">
              {t('overdue')}
            </th>
            <th scope="col" className="w-1/3 min-w-24">
              {t('load')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line">
              <td className="py-2 pr-3">{row.name || t('unassigned')}</td>
              <td>{row.open}</td>
              <td>{row.points}</td>
              <td className={row.overdue ? 'text-danger' : ''}>{row.overdue}</td>
              <td>
                <div className="h-2 rounded bg-panel2" role="presentation">
                  <div className="h-2 rounded bg-accent" style={{ width: `${(row.open / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
