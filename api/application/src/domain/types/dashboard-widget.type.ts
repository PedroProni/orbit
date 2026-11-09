import { DashboardWidgetType } from '@domain/enums/dashboard.enums';

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  listId: string | null;
}
