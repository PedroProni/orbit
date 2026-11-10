import { cn } from '@/lib/cn';
import { AUTOMATION_RUN_BADGE_CLASS } from './automation.constants';
import { AutomationRunBadgeProps } from './automation.types';

export function AutomationRunBadge({ status, label, title }: AutomationRunBadgeProps) {
  return (
    <span data-run-status={status} title={title} className={cn('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium', AUTOMATION_RUN_BADGE_CLASS[status])}>
      {label}
    </span>
  );
}
