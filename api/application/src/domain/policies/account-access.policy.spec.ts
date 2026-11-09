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

  it('admin invites member and guest only', () => {
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.MEMBER)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.GUEST)).toBe(true);
    expect(AccountAccessPolicy.canInvite(principal(UserRole.ADMIN), UserRole.ADMIN)).toBe(false);
  });

  it('member and guest administer nobody', () => {
    for (const role of [UserRole.MEMBER, UserRole.GUEST]) {
      expect(AccountAccessPolicy.canInvite(principal(role), UserRole.GUEST)).toBe(false);
      expect(AccountAccessPolicy.canAdminister(principal(role), UserRole.GUEST)).toBe(false);
    }
  });

  it('an API token administers nobody, whatever its owner can do', () => {
    expect(AccountAccessPolicy.canInvite(principal(UserRole.OWNER, AuditActorType.TOKEN), UserRole.MEMBER)).toBe(false);
    expect(AccountAccessPolicy.canAdminister(principal(UserRole.OWNER, AuditActorType.TOKEN), UserRole.MEMBER)).toBe(false);
  });
});
