import { CHART_COLORS, DONUT_RADIUS, DONUT_STROKE } from './charts.constants';
import { ChartDatum } from './charts.types';

export function DonutChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const circumference = 2 * Math.PI * DONUT_RADIUS;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={String(total)}>
        <circle cx="50" cy="50" r={DONUT_RADIUS} fill="none" strokeWidth={DONUT_STROKE} className="stroke-panel2" />
        {total > 0
          ? data.map((d, i) => {
              const length = (d.value / total) * circumference;
              const circle = <circle key={d.key} data-testid="slice" cx="50" cy="50" r={DONUT_RADIUS} fill="none" strokeWidth={DONUT_STROKE} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
              offset += length;
              return circle;
            })
          : null}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1 text-xs">
        {data.map((d, i) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="truncate text-muted">{d.label}</span>
            <span className="ml-auto font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
