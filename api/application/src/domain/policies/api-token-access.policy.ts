import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

export class ApiTokenAccessPolicy {
  static seesAll(principal: AuthPrincipal): boolean {
    return principal.role === UserRole.OWNER;
  }

  static canManage(principal: AuthPrincipal, tokenUserId: string): boolean {
    return ApiTokenAccessPolicy.seesAll(principal) || principal.userId === tokenUserId;
  }
}
