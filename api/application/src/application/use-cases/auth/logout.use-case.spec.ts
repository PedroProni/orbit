import { ForbiddenException } from '@nestjs/common';
import { LogoutUseCase } from './logout.use-case';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal = (role: UserRole, overrides: Partial<AuthPrincipal> = {}): AuthPrincipal => ({
  workspaceId: 'w1',
  actorType: AuditActorType.USER,
  actorId: 'actor',
  userId: 'actor',
  role,
  scopes: [],
  sessionId: 's1',
  ...overrides,
});

describe('LogoutUseCase', () => {
  it('revokes the current session on the server and records it', async () => {
    const sessions = { revokeOwn: jest.fn().mockResolvedValue(true) };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const acting = principal(UserRole.MEMBER);
    await new LogoutUseCase(sessions as never, audit as never).execute(acting);
    expect(sessions.revokeOwn).toHaveBeenCalledWith('s1', 'actor', expect.any(Date));
    expect(audit.record).toHaveBeenCalledWith(acting, 'auth.logout', 'session', 's1');
  });

  it('refuses an API token, which has no session', async () => {
    const sessions = { revokeOwn: jest.fn() };
    await expect(new LogoutUseCase(sessions as never, { record: jest.fn() } as never).execute(principal(UserRole.MEMBER, { sessionId: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.revokeOwn).not.toHaveBeenCalled();
  });
});
