import { UserRole } from '@domain/enums/user.enums';

export interface DevLoginCommand {
  email: string;
  name: string;
  role?: UserRole;
  workspaceSlug?: string;
  clickupId?: string;
}
