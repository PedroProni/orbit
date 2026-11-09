import { UserRole } from '@domain/enums/user.enums';

export interface InviteUserCommand {
  email: string;
  name: string;
  role: UserRole;
  allowExternalEmail?: boolean;
}
