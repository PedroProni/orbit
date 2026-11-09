import { RolePolicy } from '@domain/policies/role.policy';
import { UserRole } from '@domain/enums/user.enums';

describe('RolePolicy canChangeRole', () => {
  it.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.GUEST])('denies %s from changing any role', (actor) => {
    expect(RolePolicy.canChangeRole(actor, UserRole.GUEST, UserRole.MEMBER)).toBe(false);
    expect(RolePolicy.canChangeRole(actor, UserRole.MEMBER, UserRole.ADMIN)).toBe(false);
  });

  it.each([UserRole.GUEST, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('lets an owner set the role to %s', (next) => {
    expect(RolePolicy.canChangeRole(UserRole.OWNER, UserRole.MEMBER, next)).toBe(true);
  });

  it('lets an owner demote another owner', () => {
    expect(RolePolicy.canChangeRole(UserRole.OWNER, UserRole.OWNER, UserRole.MEMBER)).toBe(true);
  });

  it('lets an owner keep another owner as owner', () => {
    expect(RolePolicy.canChangeRole(UserRole.OWNER, UserRole.OWNER, UserRole.OWNER)).toBe(true);
  });
});

describe('RolePolicy canManageUser', () => {
  it.each([
    [UserRole.OWNER, UserRole.ADMIN, true],
    [UserRole.OWNER, UserRole.OWNER, true],
    [UserRole.ADMIN, UserRole.MEMBER, true],
    [UserRole.ADMIN, UserRole.GUEST, true],
    [UserRole.MEMBER, UserRole.GUEST, true],
    [UserRole.ADMIN, UserRole.ADMIN, false],
    [UserRole.ADMIN, UserRole.OWNER, false],
    [UserRole.MEMBER, UserRole.MEMBER, false],
    [UserRole.MEMBER, UserRole.ADMIN, false],
    [UserRole.GUEST, UserRole.GUEST, false],
    [UserRole.GUEST, UserRole.MEMBER, false],
  ])('actor %s managing %s is %s', (actor, target, expected) => {
    expect(RolePolicy.canManageUser(actor, target)).toBe(expected);
  });
});
