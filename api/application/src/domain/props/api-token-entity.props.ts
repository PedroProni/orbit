

export interface ApiTokenEntityProps {
  _id: string;
  workspaceId: string;
  userId: string;
  name: string;
  tokenHash: string;
  scopes: string[];
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
