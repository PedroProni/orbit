import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';

export interface PullRequestLinkSeed {
  _id: string;
  workspaceId: string;
  taskId: string;
  repository: string;
  number: number;
  url: string;
  source: PullRequestLinkSource;
  createdBy: string | null;
  now: Date;
}
