import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

export class CommentAccessPolicy {
  static canEdit(principal: AuthPrincipal, authorId: string): boolean {
    return principal.userId === authorId;
  }

  static canDelete(principal: AuthPrincipal, authorId: string): boolean {
    return principal.userId === authorId || principal.role === UserRole.ADMIN || principal.role === UserRole.OWNER;
  }
}
