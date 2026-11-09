export interface GithubSyncStateEntityProps {
  _id: string;
  pullCursor: Date | null;
  commitCursor: Date | null;
  lockedUntil: Date | null;
  lastSuccessAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
