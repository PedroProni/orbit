import { CommentAccessPolicy } from '@domain/policies/comment-access.policy';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const who = (role: UserRole, userId = 'u1'): AuthPrincipal => ({ workspaceId: 'w', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });

describe('CommentAccessPolicy', () => {
  it.each([UserRole.GUEST, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('lets %s edit its own comment', (role) => {
    expect(CommentAccessPolicy.canEdit(who(role), 'u1')).toBe(true);
  });

  it.each([UserRole.GUEST, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('stops %s from editing comments of others', (role) => {
    expect(CommentAccessPolicy.canEdit(who(role), 'other')).toBe(false);
  });

  it.each([UserRole.GUEST, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('lets %s delete its own comment', (role) => {
    expect(CommentAccessPolicy.canDelete(who(role), 'u1')).toBe(true);
  });

  it.each([UserRole.ADMIN, UserRole.OWNER])('lets %s delete comments of others', (role) => {
    expect(CommentAccessPolicy.canDelete(who(role), 'other')).toBe(true);
  });

  it.each([UserRole.GUEST, UserRole.MEMBER])('stops %s from deleting comments of others', (role) => {
    expect(CommentAccessPolicy.canDelete(who(role), 'other')).toBe(false);
  });
});
