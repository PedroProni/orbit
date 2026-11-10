import { DashboardData } from '@/types/workspace.types';

export type WidgetView = DashboardData['widgets'][number];

export interface DashboardWidgetProps {
  widget: WidgetView;
  label: (key: string) => string;
  onRemove?: () => void;
}
