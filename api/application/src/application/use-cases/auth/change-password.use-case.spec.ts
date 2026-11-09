import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { ChangePasswordUseCase } from './change-password.use-case';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
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

const CURRENT = 'senha-atual-longa';
const NEXT = 'senha-nova-longa';

const setup = (verified = true, reserved = true) => {
  const tokens = { invalidateUnused: jest.fn().mockResolvedValue(undefined) };
  const sessions = { revokeAllForUser: jest.fn().mockResolvedValue(2) };
  const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(user('actor')) };
  const credentials = { findById: jest.fn().mockResolvedValue({ getPasswordHash: () => 'stored' }), savePassword: jest.fn().mockResolvedValue(undefined) };
  const hasher = { verify: jest.fn().mockResolvedValue(verified), hash: jest.fn().mockResolvedValue('new-hash') };
  const throttle = { reservePasswordChange: jest.fn().mockResolvedValue(reserved), clearPasswordChange: jest.fn().mockResolvedValue(undefined) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return {
    tokens,
    sessions,
    users,
    credentials,
    hasher,
    throttle,
    audit,
    useCase: new ChangePasswordUseCase(tokens as never, sessions as never, users as never, credentials as never, hasher as never, throttle as never, audit as never),
  };
};

describe('ChangePasswordUseCase', () => {
  it('saves the new hash, ends the other sessions only and drops pending reset links', async () => {
    const { useCase, sessions, credentials, tokens, throttle } = setup();
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: NEXT })).resolves.toEqual({ revoked: 2 });
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('actor', 's1', expect.any(Date));
    expect(credentials.savePassword).toHaveBeenCalledWith('actor', 'w1', 'new-hash', expect.any(Date));
    expect(tokens.invalidateUnused).toHaveBeenCalledWith('actor', [AuthTokenKind.RESET], expect.any(Date));
    expect(throttle.clearPasswordChange).toHaveBeenCalledWith('actor');
  });

  it('refuses an API token, which has no session', async () => {
    const { useCase, credentials, throttle } = setup();
    await expect(useCase.execute(principal(UserRole.OWNER, { sessionId: undefined }), { currentPassword: CURRENT, newPassword: NEXT })).rejects.toBeInstanceOf(ForbiddenException);
    expect(throttle.reservePasswordChange).not.toHaveBeenCalled();
    expect(credentials.savePassword).not.toHaveBeenCalled();
  });

  it('stops after too many tries before looking at the password', async () => {
    const { useCase, hasher } = setup(true, false);
    const failure = await useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: NEXT }).catch(error => error as HttpException);
    expect((failure as HttpException).getStatus()).toBe(429);
    expect(hasher.verify).not.toHaveBeenCalled();
  });

  it('refuses a wrong current password and changes nothing', async () => {
    const { useCase, sessions, credentials } = setup(false);
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: 'errada-longa', newPassword: NEXT })).rejects.toBeInstanceOf(BadRequestException);
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
    expect(credentials.savePassword).not.toHaveBeenCalled();
  });

  it('refuses an account with no password', async () => {
    const { useCase, credentials } = setup();
    credentials.findById.mockResolvedValue(null);
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: NEXT })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a weak password and the same password', async () => {
    const { useCase, credentials } = setup();
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: 'curta' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: CURRENT })).rejects.toBeInstanceOf(BadRequestException);
    expect(credentials.savePassword).not.toHaveBeenCalled();
  });

  it('answers not found for a person outside the workspace', async () => {
    const { useCase, users } = setup();
    users.findByIdInWorkspace.mockResolvedValue(null);
    await expect(useCase.execute(principal(UserRole.MEMBER), { currentPassword: CURRENT, newPassword: NEXT })).rejects.toBeInstanceOf(NotFoundException);
  });
});
