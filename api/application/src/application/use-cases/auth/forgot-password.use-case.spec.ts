import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';

const user = (id: string, role: UserRole = UserRole.MEMBER, status: UserStatus = UserStatus.ACTIVE, email = `${id}@example.com`) =>
  new UserEntity({ _id: id, workspaceId: 'w1', email, name: id, avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });

const setup = (configured: boolean) => {
  const users = { findOne: jest.fn().mockResolvedValue(user('u1')) };
  const credentials = { findById: jest.fn().mockResolvedValue({}) };
  const mail = { isConfigured: () => configured, sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
  const links = { issue: jest.fn().mockResolvedValue({ token: 'plain', kind: AuthTokenKind.RESET, expiresAt: new Date() }) };
  const throttle = { reserveForgot: jest.fn().mockResolvedValue(true) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return {
    users,
    credentials,
    mail,
    links,
    throttle,
    audit,
    useCase: new ForgotPasswordUseCase(users as never, credentials as never, mail as never, links as never, throttle as never, audit as never),
  };
};
const settle = () => new Promise(resolve => setImmediate(resolve));

describe('ForgotPasswordUseCase', () => {
  it('with no mail provider says to ask an admin and creates no token', async () => {
    const { useCase, links, users } = setup(false);
    expect(useCase.execute('u1@example.com')).toEqual({ delivery: 'admin' });
    await settle();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(links.issue).not.toHaveBeenCalled();
  });

  it('with a mail provider sends a reset link to a known active person', async () => {
    const { useCase, links, mail, audit } = setup(true);
    expect(useCase.execute(' U1@Grupo-ACME.com ')).toEqual({ delivery: 'email' });
    await settle();
    expect(links.issue).toHaveBeenCalledWith(expect.anything(), AuthTokenKind.RESET, null);
    expect(mail.sendPasswordReset).toHaveBeenCalledWith('u1@example.com', 'plain');
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('answers the same for an unknown email and sends nothing', async () => {
    const { useCase, users, links, mail } = setup(true);
    users.findOne.mockResolvedValue(null);
    expect(useCase.execute('nobody@example.com')).toEqual({ delivery: 'email' });
    await settle();
    expect(links.issue).not.toHaveBeenCalled();
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('sends nothing to a disabled person, to one with no password or over the limit', async () => {
    const disabled = setup(true);
    disabled.users.findOne.mockResolvedValue(user('u1', UserRole.MEMBER, UserStatus.DISABLED));
    disabled.useCase.execute('u1@example.com');
    const noPassword = setup(true);
    noPassword.credentials.findById.mockResolvedValue(null);
    noPassword.useCase.execute('u1@example.com');
    const limited = setup(true);
    limited.throttle.reserveForgot.mockResolvedValue(false);
    limited.useCase.execute('u1@example.com');
    await settle();
    for (const item of [disabled, noPassword, limited]) expect(item.mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('a mail failure never reaches the person who asked', async () => {
    const { useCase, mail } = setup(true);
    mail.sendPasswordReset.mockRejectedValue(new Error('provider down'));
    expect(useCase.execute('u1@example.com')).toEqual({ delivery: 'email' });
    await settle();
    await settle();
    expect(mail.sendPasswordReset).toHaveBeenCalledTimes(1);
  });
});
