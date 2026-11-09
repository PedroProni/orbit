import { OwnedResourceAccessPolicy } from '@domain/policies/owned-resource-access.policy';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const who = (role: UserRole, userId = 'u1'): AuthPrincipal => ({ workspaceId: 'w', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });

describe('OwnedResourceAccessPolicy', () => {
  it.each([UserRole.GUEST, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('lets %s see a shared resource of another user', (role) => {
    expect(OwnedResourceAccessPolicy.canSee(who(role), 'other', true)).toBe(true);
  });

  it.each([UserRole.GUEST, UserRole.MEMBER])('hides a private resource of another user from %s', (role) => {
    expect(OwnedResourceAccessPolicy.canSee(who(role), 'other', false)).toBe(false);
  });

  it.each([UserRole.ADMIN, UserRole.OWNER])('lets %s see private resources of others', (role) => {
    expect(OwnedResourceAccessPolicy.canSee(who(role), 'other', false)).toBe(true);
  });

  it('lets any role see its own private resource', () => {
    expect(OwnedResourceAccessPolicy.canSee(who(UserRole.GUEST), 'u1', false)).toBe(true);
  });

  it('does not let a guest change a resource it does not own, even when shared', () => {
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.GUEST), 'other')).toBe(false);
  });

  it('lets a guest change its own resource', () => {
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.GUEST), 'u1')).toBe(true);
  });

  it('lets admins change resources of others', () => {
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.ADMIN), 'other')).toBe(true);
  });

  it('compares owner ids by exact value', () => {
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.MEMBER, 'U1'), 'u1')).toBe(false);
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.MEMBER), '')).toBe(false);
  });
});
