import { UserRole } from '@domain/enums/user.enums';

export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.MEMBER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};
