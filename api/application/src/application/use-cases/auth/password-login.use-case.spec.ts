import { HttpException, UnauthorizedException } from '@nestjs/common';
import { PasswordLoginUseCase } from './password-login.use-case';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';

const user = (id: string, role: UserRole = UserRole.MEMBER, status: UserStatus = UserStatus.ACTIVE, email = `${id}@example.com`) =>
  new UserEntity({ _id: id, workspaceId: 'w1', email, name: id, avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });
const CONTEXT = { ip: '10.0.0.1', userAgent: 'agent' };
const COMMAND = { email: ' U1@Grupo-ACME.com ', password: 'senha-longa-certa', context: CONTEXT };

const setup = (verified = true, reserved = true) => {
  const users = { findOne: jest.fn().mockResolvedValue(user('u1')) };
  const credentials = { findById: jest.fn().mockResolvedValue({ getPasswordHash: () => 'stored' }) };
  const hasher = { verify: jest.fn().mockResolvedValue(verified), burn: jest.fn().mockResolvedValue(undefined) };
  const sessions = { issue: jest.fn().mockResolvedValue('session-token') };
  const throttle = { reserveLogin: jest.fn().mockResolvedValue(reserved), settleLogin: jest.fn().mockResolvedValue(undefined) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return {
    users,
    credentials,
    hasher,
    sessions,
    throttle,
    audit,
    useCase: new PasswordLoginUseCase(users as never, credentials as never, hasher as never, sessions as never, throttle as never, audit as never),
  };
};
const refusal = async (promise: Promise<unknown>) =>
  (await promise.then(
    () => null,
    error => error,
  )) as HttpException;

describe('PasswordLoginUseCase', () => {
  it('signs in with the normalized email, settles the limit and issues a session with the context', async () => {
    const { useCase, users, throttle, sessions } = setup();
    const result = await useCase.execute(COMMAND);
    expect(users.findOne).toHaveBeenCalledWith({ email: 'u1@example.com' });
    expect(throttle.settleLogin).toHaveBeenCalledWith('u1@example.com', '10.0.0.1');
    expect(sessions.issue).toHaveBeenCalledWith('u1', 'w1', CONTEXT);
    expect(result.token).toBe('session-token');
    expect(JSON.stringify(result.user)).not.toContain('stored');
  });

  it('gives the same refusal for a wrong password, an unknown email, no password yet and a disabled person', async () => {
    const wrong = setup(false);
    const unknown = setup();
    unknown.users.findOne.mockResolvedValue(null);
    const noPassword = setup();
    noPassword.credentials.findById.mockResolvedValue(null);
    const disabled = setup();
    disabled.users.findOne.mockResolvedValue(user('u1', UserRole.MEMBER, UserStatus.DISABLED));
    for (const item of [wrong, unknown, noPassword, disabled]) {
      const failure = await refusal(item.useCase.execute(COMMAND));
      expect(failure).toBeInstanceOf(UnauthorizedException);
      expect(failure.message).toBe(AUTH_ERROR.INVALID_CREDENTIALS);
      expect(item.sessions.issue).not.toHaveBeenCalled();
      expect(item.throttle.settleLogin).not.toHaveBeenCalled();
    }
  });

  it('spends the same hashing work when there is nothing to compare', async () => {
    const unknown = setup();
    unknown.users.findOne.mockResolvedValue(null);
    await refusal(unknown.useCase.execute(COMMAND));
    expect(unknown.hasher.burn).toHaveBeenCalledWith(COMMAND.password);
    const disabled = setup();
    disabled.users.findOne.mockResolvedValue(user('u1', UserRole.MEMBER, UserStatus.DISABLED));
    await refusal(disabled.useCase.execute(COMMAND));
    expect(disabled.hasher.burn).toHaveBeenCalledTimes(1);
    expect(disabled.credentials.findById).not.toHaveBeenCalled();
  });

  it('over the limit answers 429 before reading any account, also with the right password', async () => {
    const { useCase, users, hasher } = setup(true, false);
    const failure = await refusal(useCase.execute(COMMAND));
    expect(failure.getStatus()).toBe(429);
    expect(users.findOne).not.toHaveBeenCalled();
    expect(hasher.verify).not.toHaveBeenCalled();
  });

  it('records the failure of a known person and nothing for an unknown email', async () => {
    const known = setup(false);
    await refusal(known.useCase.execute(COMMAND));
    expect(known.audit.record).toHaveBeenCalledWith(expect.anything(), 'auth.login_failed', 'user', 'u1', { ip: '10.0.0.1' });
    const unknown = setup();
    unknown.users.findOne.mockResolvedValue(null);
    await refusal(unknown.useCase.execute(COMMAND));
    expect(unknown.audit.record).not.toHaveBeenCalled();
  });
});
