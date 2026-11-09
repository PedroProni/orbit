import { GithubRefKind } from '@domain/enums/github.enums';
import { GithubRefEntityProps } from '@domain/props/github-ref-entity.props';

export class GithubRefEntity {
  private readonly _id: string;
  private readonly workspaceId: string;
  private readonly taskId: string;
  private readonly repository: string;
  private readonly kind: GithubRefKind;
  private readonly key: string;
  private readonly title: string;
  private readonly url: string;
  private readonly authorLogin: string | null;
  private readonly occurredAt: Date | null;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  constructor(props: GithubRefEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.repository = props.repository;
    this.kind = props.kind;
    this.key = props.key;
    this.title = props.title;
    this.url = props.url;
    this.authorLogin = props.authorLogin;
    this.occurredAt = props.occurredAt;
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

  getRepository(): string {
    return this.repository;
  }

  getKind(): GithubRefKind {
    return this.kind;
  }

  getKey(): string {
    return this.key;
  }

  getTitle(): string {
    return this.title;
  }

  getUrl(): string {
    return this.url;
  }

  getAuthorLogin(): string | null {
    return this.authorLogin;
  }

  getOccurredAt(): Date | null {
    return this.occurredAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): GithubRefEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      taskId: this.taskId,
      repository: this.repository,
      kind: this.kind,
      key: this.key,
      title: this.title,
      url: this.url,
      authorLogin: this.authorLogin,
      occurredAt: this.occurredAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
