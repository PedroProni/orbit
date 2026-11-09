import { BadRequestException, GoneException } from '@nestjs/common';
import { SetPasswordUseCase } from './set-password.use-case';
import { AccessLinkService } from '@application/services/access-link.service';
import { AuthTokenEntity } from '@domain/entities/auth-token.entity';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';

const user = (id: string, role: UserRole = UserRole.MEMBER, status: UserStatus = UserStatus.ACTIVE, email = `${id}@example.com`) =>
  new UserEntity({ _id: id, workspaceId: 'w1', email, name: id, avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });
const token = (kind: AuthTokenKind = AuthTokenKind.INVITE) =>
  new AuthTokenEntity({
    _id: 't1',
    workspaceId: 'w1',
    userId: 'u1',
    kind,
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000),
    usedAt: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
const PASSWORD = 'senha-nova-longa';

const setup = (consumed = true) => {
  const tokens = { findUsable: jest.fn().mockResolvedValue(token()), consume: jest.fn().mockResolvedValue(consumed), invalidateUnused: jest.fn().mockResolvedValue(undefined) };
  const sessions = { revokeAllForUser: jest.fn().mockResolvedValue(1) };
  const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(user('u1')) };
  const credentials = { savePassword: jest.fn().mockResolvedValue(undefined) };
  const hasher = { hash: jest.fn().mockResolvedValue('new-hash') };
  const throttle = { clearAccount: jest.fn().mockResolvedValue(undefined) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return {
    tokens,
    sessions,
    users,
    credentials,
    hasher,
    throttle,
    audit,
    useCase: new SetPasswordUseCase(tokens as never, sessions as never, users as never, credentials as never, hasher as never, throttle as never, audit as never),
  };
};

describe('SetPasswordUseCase', () => {
  it('consumes the link before saving, ends every session, drops other links and unlocks the account', async () => {
    const { useCase, tokens, credentials, sessions, throttle } = setup();
    await useCase.execute({ token: 'plain', password: PASSWORD });
    expect(tokens.consume).toHaveBeenCalledWith(AccessLinkService.hash('plain'), expect.any(Date));
    expect(tokens.consume.mock.invocationCallOrder[0]).toBeLessThan(credentials.savePassword.mock.invocationCallOrder[0]);
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u1', null, expect.any(Date));
    expect(credentials.savePassword).toHaveBeenCalledWith('u1', 'w1', 'new-hash', expect.any(Date));
    expect(tokens.invalidateUnused).toHaveBeenCalledWith('u1', [AuthTokenKind.INVITE, AuthTokenKind.RESET], expect.any(Date));
    expect(throttle.clearAccount).toHaveBeenCalledWith('u1@example.com');
  });

  it('two requests racing on one link: the one that loses saves nothing', async () => {
    const { useCase, credentials, sessions } = setup(false);
    await expect(useCase.execute({ token: 'plain', password: PASSWORD })).rejects.toBeInstanceOf(GoneException);
    expect(credentials.savePassword).not.toHaveBeenCalled();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('refuses an unusable link and a disabled person', async () => {
    const missing = setup();
    missing.tokens.findUsable.mockResolvedValue(null);
    await expect(missing.useCase.execute({ token: 'plain', password: PASSWORD })).rejects.toBeInstanceOf(GoneException);
    const disabled = setup();
    disabled.users.findByIdInWorkspace.mockResolvedValue(user('u1', UserRole.MEMBER, UserStatus.DISABLED));
    await expect(disabled.useCase.execute({ token: 'plain', password: PASSWORD })).rejects.toBeInstanceOf(GoneException);
    expect(disabled.tokens.consume).not.toHaveBeenCalled();
  });

  it('a weak password does not spend the link, so the person can try again', async () => {
    const { useCase, tokens } = setup();
    await expect(useCase.execute({ token: 'plain', password: 'curta' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(useCase.execute({ token: 'plain', password: 'u1@example.com' })).rejects.toBeInstanceOf(BadRequestException);
    expect(tokens.consume).not.toHaveBeenCalled();
  });
});
