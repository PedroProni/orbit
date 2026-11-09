import { FIELD_ROW_CLASS } from './task-link-slots.constants';
import { TaskFieldRowProps } from './task-link-slots.types';

export function TaskFieldRow({ icon: Icon, label, children }: TaskFieldRowProps) {
  return (
    <li className={FIELD_ROW_CLASS}>
      <span className="flex min-h-6 min-w-0 items-center gap-1.5 text-muted" title={label}>
        <Icon size={13} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}
