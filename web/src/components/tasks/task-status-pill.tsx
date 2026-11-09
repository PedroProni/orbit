'use client';

import { Check, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { useStatusLabel } from '@/hooks/use-status-label';
import { cn } from '@/lib/cn';
import { statusColor } from './task-helpers';
import { completeStatus, isCompleteStatus, nextStatus, orderedStatuses } from './task-status-pill.helpers';
import { TaskStatusPillProps } from './task-status-pill.types';

export function TaskStatusPill({ statuses, value, readOnly, onChange }: TaskStatusPillProps) {
  const t = useTranslations('drawer');
  const statusLabel = useStatusLabel();
  const current = statuses.find((status) => status.name === value);
  const color = current ? statusColor(current) : 'var(--muted)';
  const next = nextStatus(statuses, value);
  const complete = completeStatus(statuses);
  const canComplete = !!complete && !isCompleteStatus(current);
  return (
    <div className="flex items-center gap-1.5">
      <span data-testid="status-pill" className="inline-flex items-stretch overflow-hidden rounded text-white" style={{ backgroundColor: color }}>
        <Select
          ariaLabel={t('status')}
          variant="pill"
          disabled={readOnly}
          className={cn('disabled:opacity-100', !readOnly && next ? '' : 'rounded')}
          value={value}
          options={orderedStatuses(statuses).map((status) => ({ value: status.name, label: statusLabel(status.name), icon: <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor(status) }} /> }))}
          onChange={onChange}
        />
        {!readOnly && next ? (
          <button type="button" aria-label={t('nextStatus', { status: statusLabel(next.name) })} title={statusLabel(next.name)} onClick={() => onChange(next.name)} className="flex items-center border-l border-white/30 px-1 transition-colors hover:bg-black/15">
            <ChevronRight size={12} aria-hidden="true" />
          </button>
        ) : null}
      </span>
      {!readOnly && canComplete ? (
        <button
          type="button"
          aria-label={t('closeStatus', { status: statusLabel(complete.name) })}
          title={statusLabel(complete.name)}
          onClick={() => onChange(complete.name)}
          className="flex h-6 w-6 items-center justify-center rounded border border-line text-muted transition-colors hover:border-linestrong hover:text-fg"
        >
          <Check size={13} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
