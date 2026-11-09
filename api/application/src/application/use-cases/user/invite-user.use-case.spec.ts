import { ConflictException, ForbiddenException } from '@nestjs/common';
import { InviteUserUseCase } from './invite-user.use-case';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
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
const INVITE = { email: ' Nova@Grupo-ACME.com ', name: ' Nova ', role: UserRole.MEMBER, allowExternalEmail: false };

const setup = (domain = 'example.com') => {
  const users = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(async (entity: UserEntity) => entity) };
  const links = { issue: jest.fn().mockResolvedValue({ token: 'plain', kind: AuthTokenKind.INVITE, expiresAt: new Date() }) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const env = { getAllowedEmailDomain: () => domain };
  return { users, links, audit, useCase: new InviteUserUseCase(users as never, links as never, audit as never, env as never) };
};

describe('InviteUserUseCase', () => {
  it('creates the person in the workspace of the actor with no password and one invite link', async () => {
    const { useCase, users, links, audit } = setup();
    const result = await useCase.execute(principal(UserRole.ADMIN), INVITE);
    const created = users.create.mock.calls[0][0];
    expect(created.getEmail()).toBe('nova@example.com');
    expect(created.getName()).toBe('Nova');
    expect(created.getWorkspaceId()).toBe('w1');
    expect(links.issue).toHaveBeenCalledWith(created, AuthTokenKind.INVITE, 'actor');
    expect(result.link.token).toBe('plain');
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), 'user.invited', 'user', created.getId(), { role: UserRole.MEMBER, external: false });
  });

  it('refuses an email outside the company unless the override is on, and audits the override', async () => {
    const { useCase, users, audit } = setup();
    await expect(useCase.execute(principal(UserRole.OWNER), { ...INVITE, email: 'nova@fora.test' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.create).not.toHaveBeenCalled();
    await useCase.execute(principal(UserRole.OWNER), { ...INVITE, email: 'nova@fora.test', allowExternalEmail: true });
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), 'user.invited', 'user', expect.any(String), { role: UserRole.MEMBER, external: true });
  });

  it('does not accept a domain that only ends like the company one', async () => {
    const { useCase } = setup();
    await expect(useCase.execute(principal(UserRole.OWNER), { ...INVITE, email: 'nova@falso-example.com' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(useCase.execute(principal(UserRole.OWNER), { ...INVITE, email: 'nova@example.com.fora.test' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails closed when no company domain is configured', async () => {
    const { useCase, users } = setup('');
    await expect(useCase.execute(principal(UserRole.OWNER), INVITE)).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it.each([
    [UserRole.OWNER, UserRole.OWNER],
    [UserRole.ADMIN, UserRole.OWNER],
    [UserRole.ADMIN, UserRole.ADMIN],
    [UserRole.MEMBER, UserRole.MEMBER],
    [UserRole.MEMBER, UserRole.GUEST],
    [UserRole.GUEST, UserRole.GUEST],
  ])('a %s can not invite a %s', async (actor, role) => {
    const { useCase, users } = setup();
    await expect(useCase.execute(principal(actor), { ...INVITE, role })).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('answers conflict for an email in use, also when two invites race', async () => {
    const existing = setup();
    existing.users.findOne.mockResolvedValue(user('u1'));
    await expect(existing.useCase.execute(principal(UserRole.OWNER), INVITE)).rejects.toBeInstanceOf(ConflictException);
    const racing = setup();
    racing.users.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: DUPLICATE_KEY_CODE }));
    await expect(racing.useCase.execute(principal(UserRole.OWNER), INVITE)).rejects.toBeInstanceOf(ConflictException);
    expect(racing.links.issue).not.toHaveBeenCalled();
  });

  it('does not hide other database failures', async () => {
    const { useCase, users } = setup();
    users.create.mockRejectedValue(new Error('database down'));
    await expect(useCase.execute(principal(UserRole.OWNER), INVITE)).rejects.toThrow('database down');
  });
});
