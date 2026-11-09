import { SprintKind } from '@domain/enums/list.enums';
import { TaskListEntityProps } from '@domain/props/task-list-entity.props';

export class TaskListEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string;
  private folderId: string | null;
  private name: string;
  private kind: SprintKind;
  private startDate: Date | null;
  private endDate: Date | null;
  private order: number;
  private clickupId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TaskListEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.folderId = props.folderId;
    this.name = props.name;
    this.kind = props.kind;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.order = props.order;
    this.clickupId = props.clickupId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSpaceId(): string {
    return this.spaceId;
  }

  getFolderId(): string | null {
    return this.folderId;
  }

  getName(): string {
    return this.name;
  }

  getKind(): SprintKind {
    return this.kind;
  }

  getStartDate(): Date | null {
    return this.startDate;
  }

  getEndDate(): Date | null {
    return this.endDate;
  }

  getOrder(): number {
    return this.order;
  }

  getClickupId(): string | null {
    return this.clickupId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rename(name: string): void {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  moveToFolder(folderId: string | null): void {
    this.folderId = folderId;
    this.updatedAt = new Date();
  }

  setDates(startDate: Date | null, endDate: Date | null): void {
    if (this.kind === SprintKind.SPRINT && (!startDate || !endDate)) throw new Error('Sprint requires start and end dates');
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) throw new Error('End date must not be before start date');
    this.startDate = startDate;
    this.endDate = endDate;
    this.updatedAt = new Date();
  }

  toProps(): TaskListEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, spaceId: this.spaceId, folderId: this.folderId, name: this.name, kind: this.kind, startDate: this.startDate, endDate: this.endDate, order: this.order, clickupId: this.clickupId, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
