import { CommentEntityProps } from '@domain/props/comment-entity.props';

export class CommentEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private authorId: string;
  private bodyMd: string;
  private mentionIds: string[];
  private attachmentIds: string[];
  private dailyLogDate: string | null;
  private editedAt: Date | null;
  private clickupId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: CommentEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.authorId = props.authorId;
    this.bodyMd = props.bodyMd;
    this.mentionIds = props.mentionIds;
    this.attachmentIds = props.attachmentIds;
    this.dailyLogDate = props.dailyLogDate;
    this.editedAt = props.editedAt;
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

  getTaskId(): string {
    return this.taskId;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getBodyMd(): string {
    return this.bodyMd;
  }

  getMentionIds(): string[] {
    return this.mentionIds;
  }

  getAttachmentIds(): string[] {
    return this.attachmentIds;
  }

  getDailyLogDate(): string | null {
    return this.dailyLogDate;
  }

  getEditedAt(): Date | null {
    return this.editedAt;
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

  toProps(): CommentEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, authorId: this.authorId, bodyMd: this.bodyMd, mentionIds: this.mentionIds, attachmentIds: this.attachmentIds, dailyLogDate: this.dailyLogDate, editedAt: this.editedAt, clickupId: this.clickupId, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }

  edit(bodyMd: string, mentionIds: string[]): void {
    const body = bodyMd.trim();
    if (!body) throw new Error('Comment body is required');
    this.bodyMd = body;
    this.mentionIds = [...new Set(mentionIds)];
    this.editedAt = new Date();
  }

  isDailyLog(): boolean {
    return this.dailyLogDate !== null;
  }

  withAttachment(attachmentId: string): this {
    this.attachmentIds = [...new Set([...this.attachmentIds, attachmentId])];
    return this;
  }
}
