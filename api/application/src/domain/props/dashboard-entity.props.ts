import { DashboardWidget } from '@domain/types/dashboard-widget.type';

export interface DashboardEntityProps {
  _id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  shared: boolean;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}
