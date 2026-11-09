import { SavedViewType } from '@domain/enums/saved-view.enums';
import { SavedViewFilters } from '@domain/types/saved-view-filters.type';
import { SavedViewDisplay } from '@domain/types/saved-view-display.type';
import { SavedViewEntityProps } from '@domain/props/saved-view-entity.props';

export class SavedViewEntity {
  private readonly _id: string;
  private workspaceId: string;
  private ownerId: string;
  private name: string;
  private viewType: SavedViewType;
  private listId: string | null;
  private filters: SavedViewFilters;
  private display: SavedViewDisplay | null;
  private shared: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: SavedViewEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.viewType = props.viewType;
    this.listId = props.listId;
    this.filters = props.filters;
    this.display = props.display;
    this.shared = props.shared;
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

  getViewType(): SavedViewType {
    return this.viewType;
  }

  getListId(): string | null {
    return this.listId;
  }

  getFilters(): SavedViewFilters {
    return this.filters;
  }

  getDisplay(): SavedViewDisplay | null {
    return this.display;
  }

  getShared(): boolean {
    return this.shared;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  apply(name: string, viewType: SavedViewType, listId: string | null, filters: SavedViewFilters, shared: boolean, display: SavedViewDisplay | null): void {
    if (!name || name.trim().length === 0) throw new Error('View name cannot be empty');
    this.name = name.trim();
    this.viewType = viewType;
    this.listId = listId;
    this.filters = filters;
    this.display = display;
    this.shared = shared;
    this.updatedAt = new Date();
  }

  toProps(): SavedViewEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, ownerId: this.ownerId, name: this.name, viewType: this.viewType, listId: this.listId, filters: this.filters, display: this.display, shared: this.shared, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
