import { UserRole } from '@domain/enums/user.enums';
import { ROLE_RANK } from '@domain/constants/role-rank.constant';

export class RolePolicy {
  static canChangeRole(actor: UserRole, targetCurrent: UserRole, targetNext: UserRole): boolean {
    if (actor !== UserRole.OWNER) return false;
    if (targetCurrent === UserRole.OWNER && targetNext !== UserRole.OWNER) return true;
    return ROLE_RANK[actor] >= ROLE_RANK[targetNext];
  }

  static canManageUser(actor: UserRole, target: UserRole): boolean {
    return ROLE_RANK[actor] > ROLE_RANK[target] || (actor === UserRole.OWNER && target === UserRole.OWNER);
  }
}
