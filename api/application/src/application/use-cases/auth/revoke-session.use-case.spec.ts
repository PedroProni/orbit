import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RevokeSessionUseCase } from './revoke-session.use-case';
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

const setup = (own = true) => {
  const sessions = { revokeOwn: jest.fn().mockResolvedValue(own), revokeAllForUser: jest.fn().mockResolvedValue(3) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { sessions, audit, useCase: new RevokeSessionUseCase(sessions as never, audit as never) };
};

describe('RevokeSessionUseCase', () => {
  it('revokes an own session scoped to the person and says when it was the current one', async () => {
    const { useCase, sessions } = setup();
    await expect(useCase.one(principal(UserRole.MEMBER), 's2')).resolves.toEqual({ current: false });
    await expect(useCase.one(principal(UserRole.MEMBER), 's1')).resolves.toEqual({ current: true });
    expect(sessions.revokeOwn).toHaveBeenCalledWith('s2', 'actor', expect.any(Date));
  });

  it('answers not found for a session of another person and records nothing', async () => {
    const { useCase, audit } = setup(false);
    await expect(useCase.one(principal(UserRole.OWNER), 'theirs')).rejects.toBeInstanceOf(NotFoundException);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('ending the others keeps the current session', async () => {
    const { useCase, sessions } = setup();
    await expect(useCase.others(principal(UserRole.MEMBER))).resolves.toEqual({ revoked: 3 });
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('actor', 's1', expect.any(Date));
  });

  it('refuses an API token on both paths', async () => {
    const { useCase, sessions } = setup();
    const acting = principal(UserRole.OWNER, { sessionId: undefined });
    await expect(useCase.one(acting, 's1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(useCase.others(acting)).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.revokeOwn).not.toHaveBeenCalled();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
});
