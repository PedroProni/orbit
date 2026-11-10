import { RolePolicy } from '@domain/policies/role.policy';
import { UserRole } from '@domain/enums/user.enums';

describe('RolePolicy canChangeRole', () => {
  it.each([UserRole.MEMBER, UserRole.VIEWER, UserRole.GUEST])('denies %s from changing any role', actor => {
    expect(RolePolicy.canChangeRole(actor, UserRole.GUEST, UserRole.MEMBER)).toBe(false);
    expect(RolePolicy.canChangeRole(actor, UserRole.MEMBER, UserRole.VIEWER)).toBe(false);
    expect(RolePolicy.canChangeRole(actor, UserRole.MEMBER, UserRole.ADMIN)).toBe(false);
  });

  it.each([
    [UserRole.MEMBER, UserRole.VIEWER],
    [UserRole.VIEWER, UserRole.MEMBER],
    [UserRole.GUEST, UserRole.VIEWER],
    [UserRole.VIEWER, UserRole.GUEST],
    [UserRole.MEMBER, UserRole.GUEST],
    [UserRole.GUEST, UserRole.MEMBER],
  ])('lets an admin move someone from %s to %s', (current, next) => {
    expect(RolePolicy.canChangeRole(UserRole.ADMIN, current, next)).toBe(true);
  });

  it.each([
    [UserRole.MEMBER, UserRole.ADMIN],
    [UserRole.VIEWER, UserRole.ADMIN],
    [UserRole.GUEST, UserRole.OWNER],
    [UserRole.ADMIN, UserRole.MEMBER],
    [UserRole.ADMIN, UserRole.VIEWER],
    [UserRole.OWNER, UserRole.VIEWER],
  ])('denies an admin moving someone from %s to %s', (current, next) => {
    expect(RolePolicy.canChangeRole(UserRole.ADMIN, current, next)).toBe(false);
  });

  it('denies an admin changing their own role even between low roles', () => {
    expect(RolePolicy.canChangeRole(UserRole.ADMIN, UserRole.MEMBER, UserRole.VIEWER, true)).toBe(false);
  });

  it.each([UserRole.GUEST, UserRole.VIEWER, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])('lets an owner set the role to %s', next => {
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
    [UserRole.ADMIN, UserRole.VIEWER, true],
    [UserRole.MEMBER, UserRole.VIEWER, true],
    [UserRole.VIEWER, UserRole.GUEST, true],
    [UserRole.VIEWER, UserRole.VIEWER, false],
    [UserRole.VIEWER, UserRole.MEMBER, false],
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
