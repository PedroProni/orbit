import { AuthTokenKind } from '@domain/enums/auth-token.enums';

export interface AuthTokenEntityProps {
  _id: string;
  workspaceId: string;
  userId: string;
  kind: AuthTokenKind;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
