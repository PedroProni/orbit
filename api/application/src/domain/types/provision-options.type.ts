import { UserRole } from '@domain/enums/user.enums';

export interface ProvisionOptions {
  workspaceSlug?: string;
  role?: UserRole;
  clickupId?: string;
}
