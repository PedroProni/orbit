import { SUMMARY_STAT_CLASS } from './general-admin.constants';
import { SummaryStatProps } from './github-admin.types';

export function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className={SUMMARY_STAT_CLASS}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
