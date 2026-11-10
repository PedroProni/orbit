import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { ChartDatum } from '@/components/charts/charts.types';
import { DashboardWidgetProps } from './dashboard-widget.types';
import { DONUT_WIDGETS } from './workspace.constants';

export function DashboardWidget({ widget, label, onRemove }: DashboardWidgetProps) {
  const t = useTranslations('dashboards');
  const title = t(`widgets.${widget.type}`);
  const data: ChartDatum[] = Object.entries(widget.result).map(([key, value]) => ({ key, label: label(key), value }));
  const isDonut = (DONUT_WIDGETS as readonly string[]).includes(widget.type);
  return (
    <section aria-label={title} className="rounded-lg border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {onRemove ? (
          <button type="button" aria-label={t('removeWidget')} onClick={onRemove} className="text-muted hover:text-danger">
            <X size={14} />
          </button>
        ) : null}
      </div>
      {data.length === 0 ? <p className="text-sm text-muted">{t('noData')}</p> : isDonut ? <DonutChart data={data} /> : <BarChart data={data} />}
    </section>
  );
}
