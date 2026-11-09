import { NotificationType } from '@domain/enums/notification.enums';
import { NotificationEntityProps } from '@domain/props/notification-entity.props';

export class NotificationEntity {
  private readonly _id: string;
  private workspaceId: string;
  private userId: string;
  private type: NotificationType;
  private taskId: string;
  private commentId: string | null;
  private actorId: string;
  private readAt: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: NotificationEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.type = props.type;
    this.taskId = props.taskId;
    this.commentId = props.commentId;
    this.actorId = props.actorId;
    this.readAt = props.readAt;
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

  getType(): NotificationType {
    return this.type;
  }

  getTaskId(): string {
    return this.taskId;
  }

  getCommentId(): string | null {
    return this.commentId;
  }

  getActorId(): string {
    return this.actorId;
  }

  getReadAt(): Date | null {
    return this.readAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): NotificationEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, userId: this.userId, type: this.type, taskId: this.taskId, commentId: this.commentId, actorId: this.actorId, readAt: this.readAt, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }

  markRead(): void {
    if (!this.readAt) this.readAt = new Date();
  }
}
