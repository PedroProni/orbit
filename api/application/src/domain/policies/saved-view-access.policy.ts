import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

export class SavedViewAccessPolicy {
  static canSee(principal: AuthPrincipal, ownerId: string, shared: boolean): boolean {
    return shared || principal.userId === ownerId;
  }

  static canChange(principal: AuthPrincipal, ownerId: string): boolean {
    return principal.userId === ownerId || principal.role === UserRole.ADMIN || principal.role === UserRole.OWNER;
  }
}
