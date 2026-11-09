import { ChatChannelKind } from '@domain/enums/chat.enums';
import { ChatChannelEntityProps } from '@domain/props/chat-channel-entity.props';

export class ChatChannelEntity {
  private readonly _id: string;
  private workspaceId: string;
  private name: string;
  private kind: ChatChannelKind;
  private memberIds: string[];
  private createdBy: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: ChatChannelEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.kind = props.kind;
    this.memberIds = props.memberIds;
    this.createdBy = props.createdBy;
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

  getKind(): ChatChannelKind {
    return this.kind;
  }

  getMemberIds(): string[] {
    return this.memberIds;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(name: string, kind: ChatChannelKind, memberIds: string[]): void {
    if (!name.trim()) throw new Error('Channel name is required');
    this.name = name.trim();
    this.kind = kind;
    this.memberIds = [...new Set(memberIds)];
    this.updatedAt = new Date();
  }

  canAccess(userId: string): boolean {
    return this.kind === ChatChannelKind.PUBLIC || this.memberIds.includes(userId);
  }

  toProps(): ChatChannelEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, name: this.name, kind: this.kind, memberIds: this.memberIds, createdBy: this.createdBy, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
