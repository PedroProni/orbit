'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useMembers } from '@/hooks/use-orbit';
import { useStatusLabel } from '@/hooks/use-status-label';
import { useDashboardData, useDashboards, useInvalidating } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { Dashboard, DashboardUpdateInput, DashboardWidgetDraft, DashboardWidgetType } from '@/types/workspace.types';
import { DashboardWidget } from './dashboard-widget';
import { DashboardsSkeleton, WidgetsSkeleton } from './screen-skeletons';
import { SCREEN_ICON_BUTTON_CLASS, SCREEN_INPUT_CLASS, SCREEN_PRIMARY_BUTTON_CLASS, SCREEN_WIDE_CLASS } from './screens.constants';
import { DEFAULT_WIDGET_TYPES } from './workspace.constants';

export function DashboardsScreen() {
  const t = useTranslations('dashboards');
  const tu = useTranslations('ui');
  const dashboards = useDashboards();
  const { canWrite } = useCapabilities();
  const [picked, setSelected] = useState<string | null>(null);
  const selected = picked ?? dashboards.data?.[0]?.id ?? null;
  const data = useDashboardData(selected);
  const members = useMembers();
  const statusLabel = useStatusLabel();
  const label = (key: string) => (key === 'unassigned' || key === 'count' ? t(`keys.${key}`) : (members.data?.find((m) => m.id === key)?.name ?? statusLabel(key)));
  const [name, setName] = useState('');
  const [removing, setRemoving] = useState<Dashboard | null>(null);
  const create = useInvalidating(workspaceService.createDashboard, ['dashboards'], 'dashboardCreateFailed');
  const remove = useInvalidating(workspaceService.deleteDashboard, ['dashboards']);
  const update = useInvalidating((args: DashboardUpdateInput) => workspaceService.updateDashboard(args.id, { name: args.name, widgets: args.widgets }), ['dashboards', 'dashboard-data'], 'dashboardUpdateFailed');
  const current = (data.data?.widgets ?? []).map((w) => ({ type: w.type, title: w.title }));
  const changeWidgets = (widgets: DashboardWidgetDraft[]) => selected && data.data && update.mutate({ id: selected, name: data.data.name, widgets });

  if (dashboards.isLoading) return <DashboardsSkeleton />;

  return (
    <div className={SCREEN_WIDE_CLASS}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          canWrite ? (
            <form
              className="flex w-full gap-2 sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                create.mutate(
                  { name: name.trim(), widgets: DEFAULT_WIDGET_TYPES.map((type) => ({ type, title: t(`widgets.${type}`) })) },
                  {
                    onSuccess: (created) => {
                      setSelected(created.id);
                      setName('');
                    },
                  },
                );
              }}
            >
              <input aria-label={t('name')} placeholder={t('name')} value={name} onChange={(e) => setName(e.target.value)} className={`${SCREEN_INPUT_CLASS} flex-1 sm:w-56`} />
              <button type="submit" disabled={!name.trim() || create.isPending} className={SCREEN_PRIMARY_BUTTON_CLASS}>
                {t('create')}
              </button>
            </form>
          ) : null
        }
      />
      {dashboards.isError ? <ErrorState title={tu('loadError')} onRetry={dashboards.refetch} /> : null}
      {dashboards.data?.length === 0 ? <EmptyState title={t('empty')} hint={t(canWrite ? 'emptyHint' : 'emptyHintReadOnly')} /> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {dashboards.data?.map((d) => (
          <span key={d.id} className={`flex max-w-full items-center gap-1 rounded border border-line px-2 py-1 text-sm ${d.id === selected ? 'bg-accentsoft' : ''}`}>
            <button type="button" aria-pressed={d.id === selected} onClick={() => setSelected(d.id)} className="min-w-0 truncate rounded px-1" title={d.name}>
              {d.name}
            </button>
            {canWrite ? (
              <button type="button" aria-label={t('deleteNamed', { name: d.name })} className={SCREEN_ICON_BUTTON_CLASS} onClick={() => setRemoving(d)}>
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {canWrite && selected && data.data ? (
        <div className="mb-3 flex items-center gap-2">
          <Select
            ariaLabel={t('addWidget')}
            placeholder={t('addWidget')}
            value=""
            options={DEFAULT_WIDGET_TYPES.map((type) => ({ value: type, label: t(`widgets.${type}`) }))}
            onChange={(type) => changeWidgets([...current, { type: type as DashboardWidgetType, title: t(`widgets.${type}`) }])}
            className="w-auto"
          />
        </div>
      ) : null}
      {data.isLoading ? <WidgetsSkeleton /> : null}
      {data.isError ? <ErrorState title={tu('loadError')} onRetry={data.refetch} /> : null}
      {data.data && data.data.widgets.length === 0 ? <EmptyState title={t('noWidgets')} hint={canWrite ? t('noWidgetsHint') : undefined} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data.data?.widgets.map((widget, index) => (
          <DashboardWidget key={widget.id} widget={widget} label={label} onRemove={canWrite ? () => changeWidgets(current.filter((_, i) => i !== index)) : undefined} />
        ))}
      </div>
      <ConfirmDialog
        open={removing !== null}
        title={t('deleteTitle')}
        message={t('confirmDelete', { name: removing?.name ?? '' })}
        confirmLabel={t('deleteConfirm')}
        onConfirm={async () => {
          if (!removing) return;
          await remove.mutateAsync(removing.id);
          if (selected === removing.id) setSelected(null);
        }}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
