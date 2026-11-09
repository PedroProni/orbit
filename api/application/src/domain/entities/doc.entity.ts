import { DocEntityProps } from '@domain/props/doc-entity.props';

export class DocEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string | null;
  private parentId: string | null;
  private title: string;
  private bodyMd: string;
  private authorId: string;
  private archived: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: DocEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.parentId = props.parentId;
    this.title = props.title;
    this.bodyMd = props.bodyMd;
    this.authorId = props.authorId;
    this.archived = props.archived;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSpaceId(): string | null {
    return this.spaceId;
  }

  getParentId(): string | null {
    return this.parentId;
  }

  getTitle(): string {
    return this.title;
  }

  getBodyMd(): string {
    return this.bodyMd;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getArchived(): boolean {
    return this.archived;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(title: string, bodyMd: string, spaceId: string | null, parentId: string | null): void {
    if (!title.trim()) throw new Error('Doc title is required');
    if (parentId === this._id) throw new Error('A doc cannot be its own parent');
    this.title = title.trim();
    this.bodyMd = bodyMd;
    this.spaceId = spaceId;
    this.parentId = parentId;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.archived = true;
    this.updatedAt = new Date();
  }

  toProps(): DocEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, spaceId: this.spaceId, parentId: this.parentId, title: this.title, bodyMd: this.bodyMd, authorId: this.authorId, archived: this.archived, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
