import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AccountAccessPolicy } from './account-access.policy';

const principal = (role: UserRole, actorType = AuditActorType.USER): AuthPrincipal => ({ workspaceId: 'w', actorType, actorId: 'a', userId: 'a', role, scopes: [] });

describe('AccountAccessPolicy', () => {
  it('owner invites everyone except an owner', () => {
    expect(AccountAccessPolicy.canInvite(principal(UserRole.OWNER), UserRole.ADMIN)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.OWNER), UserRole.GUEST)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.OWNER), UserRole.OWNER)).toBe(false);
  });

  it('admin invites member, viewer and guest only', () => {
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.MEMBER)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.VIEWER)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.GUEST)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.ADMIN)).toBe(false);
  });

  it('member, viewer and guest administer nobody', () => {
    for (const role of [UserRole.MEMBER, UserRole.VIEWER, UserRole.GUEST]) {
      expect(AccountAccessPolicy.canInvite(principal(role), UserRole.GUEST)).toBe(false);
      expect(AccountAccessPolicy.canAdminister(principal(role), UserRole.GUEST)).toBe(false);
    }
  });

  it('an API token administers nobody, whatever its owner can do', () => {
    expect(AccountAccessPolicy.canInvite(principal(UserRole.OWNER, AuditActorType.TOKEN), UserRole.MEMBER)).toBe(false);
    expect(AccountAccessPolicy.canAdminister(principal(UserRole.OWNER, AuditActorType.TOKEN), UserRole.MEMBER)).toBe(false);
  });

  it('admin changes another person among member, viewer and guest', () => {
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.ADMIN), 'b', UserRole.MEMBER, UserRole.VIEWER)).toBe(true);
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.ADMIN), 'b', UserRole.VIEWER, UserRole.GUEST)).toBe(true);
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.ADMIN), 'b', UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
  });

  it('admin never changes their own role', () => {
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.ADMIN), 'a', UserRole.MEMBER, UserRole.VIEWER)).toBe(false);
  });

  it('an admin API token changes no role', () => {
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.ADMIN, AuditActorType.TOKEN), 'b', UserRole.MEMBER, UserRole.VIEWER)).toBe(false);
  });

  it('owner keeps the existing role rules', () => {
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.OWNER), 'b', UserRole.MEMBER, UserRole.ADMIN)).toBe(true);
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.OWNER, AuditActorType.TOKEN), 'b', UserRole.VIEWER, UserRole.MEMBER)).toBe(true);
  });

  it('viewer changes no role', () => {
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.VIEWER), 'a', UserRole.VIEWER, UserRole.MEMBER)).toBe(false);
    expect(AccountAccessPolicy.canChangeRole(principal(UserRole.VIEWER), 'b', UserRole.GUEST, UserRole.VIEWER)).toBe(false);
  });
});
