import { OwnedResourceAccessPolicy } from '@domain/policies/owned-resource-access.policy';
import { SavedViewAccessPolicy } from '@domain/policies/saved-view-access.policy';
import { RolePolicy } from '@domain/policies/role.policy';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const who = (role: UserRole, userId = 'u1'): AuthPrincipal => ({ workspaceId: 'w', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });

describe('OwnedResourceAccessPolicy', () => {
  it('lets owners and admins see and change anything, members only their own or shared', () => {
    expect(OwnedResourceAccessPolicy.canSee(who(UserRole.MEMBER), 'other', false)).toBe(false);
    expect(OwnedResourceAccessPolicy.canSee(who(UserRole.MEMBER), 'other', true)).toBe(true);
    expect(OwnedResourceAccessPolicy.canSee(who(UserRole.ADMIN), 'other', false)).toBe(true);
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.MEMBER), 'u1')).toBe(true);
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.MEMBER), 'other')).toBe(false);
    expect(OwnedResourceAccessPolicy.canChange(who(UserRole.OWNER), 'other')).toBe(true);
  });
});

describe('SavedViewAccessPolicy', () => {
  it('hides private views from others', () => {
    expect(SavedViewAccessPolicy.canSee(who(UserRole.MEMBER), 'other', false)).toBe(false);
    expect(SavedViewAccessPolicy.canChange(who(UserRole.MEMBER), 'other')).toBe(false);
  });
});

describe('RolePolicy', () => {
  it('owners change any role and admins only move people among the low roles', () => {
    expect(RolePolicy.canChangeRole(UserRole.ADMIN, UserRole.MEMBER, UserRole.GUEST)).toBe(true);
    expect(RolePolicy.canChangeRole(UserRole.ADMIN, UserRole.MEMBER, UserRole.ADMIN)).toBe(false);
    expect(RolePolicy.canChangeRole(UserRole.OWNER, UserRole.MEMBER, UserRole.GUEST)).toBe(true);
  });
});
