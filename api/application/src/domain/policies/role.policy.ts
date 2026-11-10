import { UserRole } from '@domain/enums/user.enums';
import { ROLE_RANK } from '@domain/constants/role-rank.constant';
import { ADMIN_ASSIGNABLE_ROLES } from '@domain/constants/admin-assignable-roles.constant';

export class RolePolicy {
  static canChangeRole(actor: UserRole, targetCurrent: UserRole, targetNext: UserRole, self = false): boolean {
    if (actor === UserRole.ADMIN) return !self && ADMIN_ASSIGNABLE_ROLES.includes(targetCurrent) && ADMIN_ASSIGNABLE_ROLES.includes(targetNext);
    if (actor !== UserRole.OWNER) return false;
    if (targetCurrent === UserRole.OWNER && targetNext !== UserRole.OWNER) return true;
    return ROLE_RANK[actor] >= ROLE_RANK[targetNext];
  }

  static canManageUser(actor: UserRole, target: UserRole): boolean {
    return ROLE_RANK[actor] > ROLE_RANK[target] || (actor === UserRole.OWNER && target === UserRole.OWNER);
  }
}
