import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubChecksState } from '@domain/enums/github.enums';
import { PullRequestLinkEntityProps } from '@domain/props/pull-request-link-entity.props';
import { GithubPullRequest } from '@domain/types/github-pull-request.type';
import { PullRequestLinkSeed } from '@domain/types/pull-request-link-seed.type';
import { PULL_REQUEST_CHECKS_FIELDS, PULL_REQUEST_GITHUB_FIELDS } from '@domain/constants/pull-request-link.constant';

export class PullRequestLinkEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private repository: string;
  private number: number;
  private url: string;
  private title: string;
  private state: PullRequestState | null;
  private readonly source: PullRequestLinkSource;
  private readonly createdBy: string | null;
  private authorLogin: string | null;
  private authorAvatarUrl: string | null;
  private headRef: string | null;
  private headSha: string | null;
  private draft: boolean;
  private checksState: GithubChecksState | null;
  private githubUpdatedAt: Date | null;
  private syncedAt: Date | null;
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
    this.source = props.source;
    this.createdBy = props.createdBy;
    this.authorLogin = props.authorLogin;
    this.authorAvatarUrl = props.authorAvatarUrl;
    this.headRef = props.headRef;
    this.headSha = props.headSha;
    this.draft = props.draft;
    this.checksState = props.checksState;
    this.githubUpdatedAt = props.githubUpdatedAt;
    this.syncedAt = props.syncedAt;
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

  getState(): PullRequestState | null {
    return this.state;
  }

  getSource(): PullRequestLinkSource {
    return this.source;
  }

  getCreatedBy(): string | null {
    return this.createdBy;
  }

  getAuthorLogin(): string | null {
    return this.authorLogin;
  }

  getAuthorAvatarUrl(): string | null {
    return this.authorAvatarUrl;
  }

  getHeadRef(): string | null {
    return this.headRef;
  }

  getHeadSha(): string | null {
    return this.headSha;
  }

  isDraft(): boolean {
    return this.draft;
  }

  getChecksState(): GithubChecksState | null {
    return this.checksState;
  }

  getGithubUpdatedAt(): Date | null {
    return this.githubUpdatedAt;
  }

  getSyncedAt(): Date | null {
    return this.syncedAt;
  }

  isManual(): boolean {
    return this.source === PullRequestLinkSource.MANUAL;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): PullRequestLinkEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      taskId: this.taskId,
      repository: this.repository,
      number: this.number,
      url: this.url,
      title: this.title,
      state: this.state,
      source: this.source,
      createdBy: this.createdBy,
      authorLogin: this.authorLogin,
      authorAvatarUrl: this.authorAvatarUrl,
      headRef: this.headRef,
      headSha: this.headSha,
      draft: this.draft,
      checksState: this.checksState,
      githubUpdatedAt: this.githubUpdatedAt,
      syncedAt: this.syncedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  applyGithub(pullRequest: GithubPullRequest, checks: GithubChecksState | null, now: Date): string[] {
    if (this.githubUpdatedAt && pullRequest.updatedAt.getTime() < this.githubUpdatedAt.getTime()) return [];
    this.title = pullRequest.title;
    this.url = pullRequest.url;
    this.state = pullRequest.state;
    this.draft = pullRequest.draft;
    this.authorLogin = pullRequest.authorLogin;
    this.authorAvatarUrl = pullRequest.authorAvatarUrl;
    this.headRef = pullRequest.headRef || null;
    this.headSha = pullRequest.headSha || null;
    this.githubUpdatedAt = pullRequest.updatedAt;
    if (checks) this.checksState = checks;
    this.syncedAt = now;
    return [...PULL_REQUEST_GITHUB_FIELDS];
  }

  applyChecks(checks: GithubChecksState, now: Date): string[] {
    this.checksState = checks;
    this.syncedAt = now;
    return [...PULL_REQUEST_CHECKS_FIELDS];
  }

  static fromSeed(seed: PullRequestLinkSeed): PullRequestLinkEntity {
    return new PullRequestLinkEntity({
      _id: seed._id,
      workspaceId: seed.workspaceId,
      taskId: seed.taskId,
      repository: seed.repository,
      number: seed.number,
      url: seed.url,
      title: '',
      state: null,
      source: seed.source,
      createdBy: seed.createdBy,
      authorLogin: null,
      authorAvatarUrl: null,
      headRef: null,
      headSha: null,
      draft: false,
      checksState: null,
      githubUpdatedAt: null,
      syncedAt: null,
      createdAt: seed.now,
      updatedAt: seed.now,
    });
  }
}
