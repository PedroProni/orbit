import { GithubSyncStateEntityProps } from '@domain/props/github-sync-state-entity.props';

export class GithubSyncStateEntity {
  private readonly _id: string;
  private readonly pullCursor: Date | null;
  private readonly commitCursor: Date | null;
  private readonly lockedUntil: Date | null;
  private readonly lastSuccessAt: Date | null;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  constructor(props: GithubSyncStateEntityProps) {
    this._id = props._id;
    this.pullCursor = props.pullCursor;
    this.commitCursor = props.commitCursor;
    this.lockedUntil = props.lockedUntil;
    this.lastSuccessAt = props.lastSuccessAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getPullCursor(): Date | null {
    return this.pullCursor;
  }

  getCommitCursor(): Date | null {
    return this.commitCursor;
  }

  getLockedUntil(): Date | null {
    return this.lockedUntil;
  }

  getLastSuccessAt(): Date | null {
    return this.lastSuccessAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
