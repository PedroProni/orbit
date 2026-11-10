import { UserRole } from '@domain/enums/user.enums';

export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.VIEWER]: 1,
  [UserRole.MEMBER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.OWNER]: 4,
};
