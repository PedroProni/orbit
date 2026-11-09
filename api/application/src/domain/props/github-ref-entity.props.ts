import { GithubRefKind } from '@domain/enums/github.enums';

export interface GithubRefEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  repository: string;
  kind: GithubRefKind;
  key: string;
  title: string;
  url: string;
  authorLogin: string | null;
  occurredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
