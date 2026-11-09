import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { useStatusLabel } from '@/hooks/use-status-label';
import { statusColor } from './task-helpers';
import { orderedStatuses } from './task-status-pill.helpers';
import { TableStatusCellProps } from './table-status-cell.types';

export function TableStatusCell({ statuses, value, readOnly, onChange }: TableStatusCellProps) {
  const t = useTranslations('table.columns');
  const statusLabel = useStatusLabel();
  const current = statuses.find((status) => status.name === value);
  const color = current ? statusColor(current) : 'var(--muted)';
  const options = orderedStatuses(statuses).map((status) => ({ value: status.name, label: statusLabel(status.name), icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor(status) }} /> }));
  const withCurrent = current ? options : [{ value, label: statusLabel(value), icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} /> }, ...options];
  return (
    <span data-testid="table-status" data-status-color={color} className="inline-flex max-w-full items-stretch overflow-hidden rounded text-white" style={{ backgroundColor: color }}>
      <Select ariaLabel={t('status')} variant="pill" disabled={readOnly || statuses.length === 0} className="max-w-full truncate rounded disabled:opacity-100" value={value} options={withCurrent} onChange={onChange} />
    </span>
  );
}
