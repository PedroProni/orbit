import { GuestAccessEntityProps } from '@domain/props/guest-access-entity.props';

export class GuestAccessEntity {
  private readonly _id: string;
  private workspaceId: string;
  private userId: string;
  private listIds: string[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: GuestAccessEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.listIds = props.listIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string {
    return this.userId;
  }

  getListIds(): string[] {
    return this.listIds;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  replace(listIds: string[]): void {
    this.listIds = [...new Set(listIds)];
    this.updatedAt = new Date();
  }

  toProps(): GuestAccessEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, userId: this.userId, listIds: this.listIds, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
