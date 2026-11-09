import { DashboardWidget } from '@domain/types/dashboard-widget.type';
import { DashboardEntityProps } from '@domain/props/dashboard-entity.props';

export class DashboardEntity {
  private readonly _id: string;
  private workspaceId: string;
  private ownerId: string;
  private name: string;
  private shared: boolean;
  private widgets: DashboardWidget[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: DashboardEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.shared = props.shared;
    this.widgets = props.widgets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getName(): string {
    return this.name;
  }

  getShared(): boolean {
    return this.shared;
  }

  getWidgets(): DashboardWidget[] {
    return this.widgets;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(name: string, shared: boolean, widgets: DashboardWidget[]): void {
    if (!name.trim()) throw new Error('Dashboard name is required');
    if (widgets.length > 20) throw new Error('A dashboard supports up to 20 widgets');
    this.name = name.trim();
    this.shared = shared;
    this.widgets = widgets;
    this.updatedAt = new Date();
  }

  toProps(): DashboardEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, ownerId: this.ownerId, name: this.name, shared: this.shared, widgets: this.widgets, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
