import { UserRole } from '@domain/enums/user.enums';
import { UserStatus } from '@domain/enums/user.enums';

export interface UserEntityProps {
  _id: string;
  workspaceId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  clickupId: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
