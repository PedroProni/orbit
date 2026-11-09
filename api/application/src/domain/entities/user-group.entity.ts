import { UserGroupEntityProps } from '@domain/props/user-group-entity.props';

export class UserGroupEntity {
  private readonly _id: string;
  private workspaceId: string;
  private name: string;
  private memberIds: string[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: UserGroupEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.memberIds = props.memberIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getName(): string {
    return this.name;
  }

  getMemberIds(): string[] {
    return this.memberIds;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(name: string, memberIds: string[]): void {
    if (!name.trim()) throw new Error('Group name is required');
    this.name = name.trim();
    this.memberIds = [...new Set(memberIds)];
    this.updatedAt = new Date();
  }

  toProps(): UserGroupEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, name: this.name, memberIds: this.memberIds, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
