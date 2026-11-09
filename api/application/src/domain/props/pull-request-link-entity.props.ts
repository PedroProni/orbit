import { PullRequestState } from '@domain/enums/pull-request-link.enums';

export interface PullRequestLinkEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  repository: string;
  number: number;
  url: string;
  title: string;
  state: PullRequestState;
  createdAt: Date;
  updatedAt: Date;
}
