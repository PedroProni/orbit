import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { RolePolicy } from '@domain/policies/role.policy';

export class AccountAccessPolicy {
  static isPerson(principal: AuthPrincipal): boolean {
    return principal.actorType === AuditActorType.USER;
  }

  static canInvite(principal: AuthPrincipal, role: UserRole): boolean {
    return role !== UserRole.OWNER && AccountAccessPolicy.canAdminister(principal, role);
  }

  static canAdminister(principal: AuthPrincipal, targetRole: UserRole): boolean {
    const administrator = principal.role === UserRole.OWNER || principal.role === UserRole.ADMIN;
    return administrator && AccountAccessPolicy.isPerson(principal) && RolePolicy.canManageUser(principal.role, targetRole);
  }
}
