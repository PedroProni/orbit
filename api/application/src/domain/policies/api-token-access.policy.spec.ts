import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ApiTokenAccessPolicy } from './api-token-access.policy';

const principal = (role: UserRole, userId: string): AuthPrincipal => ({ workspaceId: 'w', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });

describe('ApiTokenAccessPolicy', () => {
  it('lets the owner manage every token', () => {
    expect(ApiTokenAccessPolicy.seesAll(principal(UserRole.OWNER, 'o'))).toBe(true);
    expect(ApiTokenAccessPolicy.canManage(principal(UserRole.OWNER, 'o'), 'someone')).toBe(true);
  });

  it('limits an admin to their own tokens', () => {
    expect(ApiTokenAccessPolicy.seesAll(principal(UserRole.ADMIN, 'a'))).toBe(false);
    expect(ApiTokenAccessPolicy.canManage(principal(UserRole.ADMIN, 'a'), 'a')).toBe(true);
    expect(ApiTokenAccessPolicy.canManage(principal(UserRole.ADMIN, 'a'), 'b')).toBe(false);
  });
});
