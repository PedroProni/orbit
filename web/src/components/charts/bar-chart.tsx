import { CHART_COLORS } from './charts.constants';
import { ChartDatum } from './charts.types';

export function BarChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2" role="list">
      {data.map((d, i) => (
        <li key={d.key} className="text-xs">
          <div className="mb-0.5 flex justify-between gap-2">
            <span className="truncate text-muted">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </div>
          <div className="h-2 rounded bg-panel2">
            <div data-testid="bar" className="h-2 rounded" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
