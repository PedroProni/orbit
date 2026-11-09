import { GithubRefKind } from '@domain/enums/github.enums';

export interface GithubRefInput {
  repository: string;
  kind: GithubRefKind;
  key: string;
  title: string;
  url: string;
  authorLogin: string | null;
  occurredAt: Date | null;
}
