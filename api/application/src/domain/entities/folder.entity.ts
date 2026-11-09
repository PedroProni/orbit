import { FolderEntityProps } from '@domain/props/folder-entity.props';

export class FolderEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string;
  private name: string;
  private order: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: FolderEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.name = props.name;
    this.order = props.order;
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

  getName(): string {
    return this.name;
  }

  getOrder(): number {
    return this.order;
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

  toProps(): FolderEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, spaceId: this.spaceId, name: this.name, order: this.order, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
