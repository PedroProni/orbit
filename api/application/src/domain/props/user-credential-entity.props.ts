export interface UserCredentialEntityProps {
  _id: string;
  workspaceId: string;
  passwordHash: string;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
