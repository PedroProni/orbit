import { useStatusLabel } from '@/hooks/use-status-label';
import { StatusDefinition } from '@/types/api.types';
import { statusColor } from './task-helpers';

export function StatusChip({ status }: { status?: StatusDefinition; name?: string }) {
  const statusLabel = useStatusLabel();
  if (!status) return null;
  const color = statusColor(status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`, color: `color-mix(in srgb, ${color} var(--status-ink), var(--text))` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {statusLabel(status.name)}
    </span>
  );
}
