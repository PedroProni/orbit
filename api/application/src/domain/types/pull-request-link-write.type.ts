import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestState } from '@domain/enums/pull-request-link.enums';

export interface PullRequestLinkWrite {
  link: PullRequestLinkEntity;
  previous: PullRequestState | null | undefined;
  created: boolean;
}
