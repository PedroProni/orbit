import { UserRole } from '@domain/enums/user.enums';

export const ADMIN_ASSIGNABLE_ROLES: UserRole[] = [UserRole.MEMBER, UserRole.VIEWER, UserRole.GUEST];
