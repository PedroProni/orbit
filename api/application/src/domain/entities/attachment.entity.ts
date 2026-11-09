import { AttachmentEntityProps } from '@domain/props/attachment-entity.props';

export class AttachmentEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private commentId: string | null;
  private storageKey: string;
  private filename: string;
  private mimeType: string;
  private sizeBytes: number;
  private uploaderId: string;
  private confirmed: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: AttachmentEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.commentId = props.commentId;
    this.storageKey = props.storageKey;
    this.filename = props.filename;
    this.mimeType = props.mimeType;
    this.sizeBytes = props.sizeBytes;
    this.uploaderId = props.uploaderId;
    this.confirmed = props.confirmed;
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

  getCommentId(): string | null {
    return this.commentId;
  }

  getStorageKey(): string {
    return this.storageKey;
  }

  getFilename(): string {
    return this.filename;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getSizeBytes(): number {
    return this.sizeBytes;
  }

  getUploaderId(): string {
    return this.uploaderId;
  }

  getConfirmed(): boolean {
    return this.confirmed;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): AttachmentEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, commentId: this.commentId, storageKey: this.storageKey, filename: this.filename, mimeType: this.mimeType, sizeBytes: this.sizeBytes, uploaderId: this.uploaderId, confirmed: this.confirmed, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }

  confirm(): void {
    this.confirmed = true;
  }
}
