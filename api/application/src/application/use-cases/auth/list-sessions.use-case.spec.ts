import { ForbiddenException } from '@nestjs/common';
import { ListSessionsUseCase } from './list-sessions.use-case';
import { AuthSessionEntity } from '@domain/entities/auth-session.entity';
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
const session = (id: string) =>
  new AuthSessionEntity({
    _id: id,
    workspaceId: 'w1',
    userId: 'actor',
    ip: '10.0.0.1',
    userAgent: 'agent',
    expiresAt: new Date(Date.now() + 1000),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('ListSessionsUseCase', () => {
  it('lists only the sessions of the person and marks the current one', async () => {
    const sessions = { findUsableByUser: jest.fn().mockResolvedValue([session('s1'), session('s2')]) };
    const rows = await new ListSessionsUseCase(sessions as never).execute(principal(UserRole.MEMBER));
    expect(sessions.findUsableByUser).toHaveBeenCalledWith('actor', expect.any(Date));
    expect(rows.map(row => [row.id, row.current])).toEqual([
      ['s1', true],
      ['s2', false],
    ]);
  });

  it('refuses an API token, which has no session', async () => {
    const sessions = { findUsableByUser: jest.fn() };
    await expect(new ListSessionsUseCase(sessions as never).execute(principal(UserRole.OWNER, { sessionId: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.findUsableByUser).not.toHaveBeenCalled();
  });
});
