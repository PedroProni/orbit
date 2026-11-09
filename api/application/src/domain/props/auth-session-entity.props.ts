export interface AuthSessionEntityProps {
  _id: string;
  workspaceId: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
