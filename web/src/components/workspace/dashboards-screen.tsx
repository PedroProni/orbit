'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardData, useDashboards, useInvalidating } from '@/hooks/use-workspace';
import { useMembers } from '@/hooks/use-orbit';
import { workspaceService } from '@/services/workspace.service';
import { DashboardWidgetType } from '@/types/workspace.types';
import { DashboardWidget } from './dashboard-widget';
import { DEFAULT_WIDGET_TYPES } from './workspace.constants';
import { Select } from '@/components/ui/select';
import { useStatusLabel } from '@/hooks/use-status-label';

export function DashboardsScreen() {
  const t = useTranslations('dashboards');
  const dashboards = useDashboards();
  const [picked, setSelected] = useState<string | null>(null);
  const selected = picked ?? dashboards.data?.[0]?.id ?? null;
  const data = useDashboardData(selected);
  const members = useMembers();
  const statusLabel = useStatusLabel();
  const label = (key: string) => (key === 'unassigned' || key === 'count' ? t(`keys.${key}`) : (members.data?.find((m) => m.id === key)?.name ?? statusLabel(key)));
  const [name, setName] = useState('');
  const create = useInvalidating(workspaceService.createDashboard, ['dashboards']);
  const remove = useInvalidating(workspaceService.deleteDashboard, ['dashboards']);
  const update = useInvalidating((args: { id: string; name: string; widgets: Array<{ type: DashboardWidgetType; title: string }> }) => workspaceService.updateDashboard(args.id, { name: args.name, widgets: args.widgets }), ['dashboards', 'dashboard-data']);
  const current = (data.data?.widgets ?? []).map((w) => ({ type: w.type, title: w.title }));
  const changeWidgets = (widgets: Array<{ type: DashboardWidgetType; title: string }>) => selected && data.data && update.mutate({ id: selected, name: data.data.name, widgets });
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-xl font-semibold">{t('title')}</h1>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate({ name: name.trim(), widgets: DEFAULT_WIDGET_TYPES.map((type) => ({ type, title: t(`widgets.${type}`) })) }, { onSuccess: (created) => setSelected(created.id) });
          setName('');
        }}
      >
        <input aria-label={t('name')} placeholder={t('name')} value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded border border-line bg-panel2 px-2 py-1.5 text-sm" />
        <button type="submit" disabled={!name.trim()} className="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50">
          {t('create')}
        </button>
      </form>
      {dashboards.data?.length === 0 ? <p className="text-sm text-muted">{t('empty')}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {dashboards.data?.map((d) => (
          <span key={d.id} className={`flex items-center gap-2 rounded border border-line px-2 py-1 text-sm ${d.id === selected ? 'bg-accentsoft' : ''}`}>
            <button type="button" onClick={() => setSelected(d.id)}>
              {d.name}
            </button>
            <button
              type="button"
              aria-label={t('delete')}
              className="text-xs text-muted hover:text-danger"
              onClick={() => {
                remove.mutate(d.id);
                if (selected === d.id) setSelected(null);
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {selected && data.data ? (
        <div className="mb-3 flex items-center gap-2">
          <Select ariaLabel={t('addWidget')} placeholder={t('addWidget')} value="" options={DEFAULT_WIDGET_TYPES.map((type) => ({ value: type, label: t(`widgets.${type}`) }))} onChange={(type) => changeWidgets([...current, { type: type as DashboardWidgetType, title: t(`widgets.${type}`) }])} className="w-auto" />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data.data?.widgets.map((widget, index) => (
          <DashboardWidget key={widget.id} widget={widget} label={label} onRemove={() => changeWidgets(current.filter((_, i) => i !== index))} />
        ))}
      </div>
    </div>
  );
}
