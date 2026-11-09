import { TaskPropertyRowProps } from './task-property-row.types';

export function TaskPropertyRow({ icon: Icon, label, children }: TaskPropertyRowProps) {
  return (
    <div className="grid min-h-8 grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-1.5 text-muted">
        <Icon size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
