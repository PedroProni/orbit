import { PullRequestState } from '@domain/enums/pull-request-link.enums';
import { PullRequestLinkEntityProps } from '@domain/props/pull-request-link-entity.props';

export class PullRequestLinkEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private repository: string;
  private number: number;
  private url: string;
  private title: string;
  private state: PullRequestState;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: PullRequestLinkEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.repository = props.repository;
    this.number = props.number;
    this.url = props.url;
    this.title = props.title;
    this.state = props.state;
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

  getNumber(): number {
    return this.number;
  }

  getUrl(): string {
    return this.url;
  }

  getTitle(): string {
    return this.title;
  }

  getState(): PullRequestState {
    return this.state;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): PullRequestLinkEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, repository: this.repository, number: this.number, url: this.url, title: this.title, state: this.state, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }

  sync(title: string, url: string, state: PullRequestState): void {
    this.title = title;
    this.url = url;
    this.state = state;
  }
}
