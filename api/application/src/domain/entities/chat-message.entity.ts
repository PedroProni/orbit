import { ChatMessageEntityProps } from '@domain/props/chat-message-entity.props';

export class ChatMessageEntity {
  private readonly _id: string;
  private workspaceId: string;
  private channelId: string;
  private authorId: string;
  private bodyMd: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: ChatMessageEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.channelId = props.channelId;
    this.authorId = props.authorId;
    this.bodyMd = props.bodyMd;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getChannelId(): string {
    return this.channelId;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getBodyMd(): string {
    return this.bodyMd;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): ChatMessageEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, channelId: this.channelId, authorId: this.authorId, bodyMd: this.bodyMd, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
