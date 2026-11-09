import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GenerateAccessLinkUseCase } from './generate-access-link.use-case';
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

const setup = (target: UserEntity | null, hasPassword = true) => {
  const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(target) };
  const credentials = { findById: jest.fn().mockResolvedValue(hasPassword ? {} : null) };
  const links = { issue: jest.fn().mockResolvedValue({ token: 'plain' }) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { users, links, audit, useCase: new GenerateAccessLinkUseCase(users as never, credentials as never, links as never, audit as never) };
};

describe('GenerateAccessLinkUseCase', () => {
  it('gives a reset to someone with a password and an invite to someone without, and never audits the token', async () => {
    const reset = setup(user('u1'));
    await reset.useCase.execute(principal(UserRole.ADMIN), 'u1');
    expect(reset.links.issue).toHaveBeenCalledWith(expect.anything(), AuthTokenKind.RESET, 'actor');
    expect(JSON.stringify(reset.audit.record.mock.calls[0])).not.toContain('plain');
    const invite = setup(user('u1'), false);
    await invite.useCase.execute(principal(UserRole.OWNER), 'u1');
    expect(invite.links.issue).toHaveBeenCalledWith(expect.anything(), AuthTokenKind.INVITE, 'actor');
  });

  it('looks the target up inside the workspace of the actor', async () => {
    const { useCase, users } = setup(null);
    await expect(useCase.execute(principal(UserRole.OWNER), 'elsewhere')).rejects.toBeInstanceOf(NotFoundException);
    expect(users.findByIdInWorkspace).toHaveBeenCalledWith('elsewhere', 'w1');
  });

  it('refuses a link for oneself, so a session alone can not take over the password', async () => {
    const { useCase, links } = setup(user('actor', UserRole.OWNER));
    await expect(useCase.execute(principal(UserRole.OWNER), 'actor')).rejects.toBeInstanceOf(BadRequestException);
    expect(links.issue).not.toHaveBeenCalled();
  });

  it.each([
    [UserRole.ADMIN, UserRole.OWNER],
    [UserRole.ADMIN, UserRole.ADMIN],
    [UserRole.MEMBER, UserRole.GUEST],
    [UserRole.MEMBER, UserRole.MEMBER],
    [UserRole.GUEST, UserRole.GUEST],
  ])('a %s can not generate a link for a %s', async (actor, target) => {
    const { useCase, links } = setup(user('u1', target));
    await expect(useCase.execute(principal(actor), 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(links.issue).not.toHaveBeenCalled();
  });

  it('an API token of an owner can not generate links', async () => {
    const { useCase, links } = setup(user('u1'));
    await expect(useCase.execute(principal(UserRole.OWNER, { actorType: AuditActorType.TOKEN, sessionId: undefined }), 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(links.issue).not.toHaveBeenCalled();
  });

  it('refuses a disabled person', async () => {
    const { useCase, links } = setup(user('u1', UserRole.MEMBER, UserStatus.DISABLED));
    await expect(useCase.execute(principal(UserRole.OWNER), 'u1')).rejects.toBeInstanceOf(ConflictException);
    expect(links.issue).not.toHaveBeenCalled();
  });
});
