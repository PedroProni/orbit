import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RevokeUserSessionsUseCase } from './revoke-user-sessions.use-case';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const user = (id: string, role: UserRole = UserRole.MEMBER, status: UserStatus = UserStatus.ACTIVE, email = `${id}@example.com`) =>
  new UserEntity({ _id: id, workspaceId: 'w1', email, name: id, avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });
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

const setup = (target: UserEntity | null) => {
  const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(target) };
  const sessions = { revokeAllForUser: jest.fn().mockResolvedValue(4) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { users, sessions, audit, useCase: new RevokeUserSessionsUseCase(users as never, sessions as never, audit as never) };
};

describe('RevokeUserSessionsUseCase', () => {
  it('ends every session of the person and records how many', async () => {
    const { useCase, sessions, audit } = setup(user('u1'));
    await expect(useCase.execute(principal(UserRole.ADMIN), 'u1')).resolves.toEqual({ revoked: 4 });
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u1', null, expect.any(Date));
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), 'auth.sessions_revoked', 'user', 'u1', { revoked: 4 });
  });

  it('on the own account keeps the session in use', async () => {
    const { useCase, sessions } = setup(user('actor', UserRole.OWNER));
    await useCase.execute(principal(UserRole.OWNER), 'actor');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('actor', 's1', expect.any(Date));
  });

  it('answers not found for someone in another workspace', async () => {
    const { useCase, users, sessions } = setup(null);
    await expect(useCase.execute(principal(UserRole.OWNER), 'elsewhere')).rejects.toBeInstanceOf(NotFoundException);
    expect(users.findByIdInWorkspace).toHaveBeenCalledWith('elsewhere', 'w1');
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });

  it.each([
    [UserRole.ADMIN, UserRole.OWNER],
    [UserRole.ADMIN, UserRole.ADMIN],
    [UserRole.MEMBER, UserRole.MEMBER],
    [UserRole.MEMBER, UserRole.GUEST],
    [UserRole.GUEST, UserRole.GUEST],
  ])('a %s can not end the sessions of a %s', async (actor, target) => {
    const { useCase, sessions } = setup(user('u1', target));
    await expect(useCase.execute(principal(actor), 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('an API token of an owner can not end sessions', async () => {
    const { useCase, sessions } = setup(user('u1'));
    await expect(useCase.execute(principal(UserRole.OWNER, { actorType: AuditActorType.TOKEN, sessionId: undefined }), 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
});
