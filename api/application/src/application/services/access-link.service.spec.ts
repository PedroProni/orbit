import { createHash } from 'node:crypto';
import { AccessLinkService } from './access-link.service';
import { INVITE_TTL_SECONDS, RESET_TTL_SECONDS } from '@domain/constants/auth.constant';
import { AuthTokenEntity } from '@domain/entities/auth-token.entity';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';

const user = (id: string, role: UserRole = UserRole.MEMBER, status: UserStatus = UserStatus.ACTIVE, email = `${id}@example.com`) =>
  new UserEntity({ _id: id, workspaceId: 'w1', email, name: id, avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });

describe('AccessLinkService', () => {
  const setup = () => {
    const tokens = { invalidateUnused: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) };
    return { tokens, service: new AccessLinkService(tokens as never) };
  };

  it('stores only the hash of the token and returns the plain one once', async () => {
    const { tokens, service } = setup();
    const link = await service.issue(user('u1'), AuthTokenKind.INVITE, 'admin');
    const stored = tokens.create.mock.calls[0][0] as AuthTokenEntity;
    expect(link.token.length).toBeGreaterThan(40);
    expect(JSON.stringify(stored)).not.toContain(link.token);
    expect(stored.getTokenHash()).toBe(createHash('sha256').update(link.token).digest('hex'));
    expect(AccessLinkService.hash(link.token)).toBe(stored.getTokenHash());
  });

  it('gives invites and resets their own lifetimes', async () => {
    const { service } = setup();
    const before = Date.now();
    const invite = await service.issue(user('u1'), AuthTokenKind.INVITE, null);
    const reset = await service.issue(user('u1'), AuthTokenKind.RESET, null);
    expect(invite.expiresAt.getTime()).toBeGreaterThanOrEqual(before + INVITE_TTL_SECONDS * 1000);
    expect(invite.expiresAt.getTime()).toBeLessThan(before + INVITE_TTL_SECONDS * 1000 + 5000);
    expect(reset.expiresAt.getTime()).toBeLessThan(before + RESET_TTL_SECONDS * 1000 + 5000);
  });

  it('invalidates the earlier unused links of the same kind before issuing a new one', async () => {
    const { tokens, service } = setup();
    await service.issue(user('u1'), AuthTokenKind.RESET, 'admin');
    expect(tokens.invalidateUnused).toHaveBeenCalledWith('u1', [AuthTokenKind.RESET], expect.any(Date));
    expect(tokens.invalidateUnused.mock.invocationCallOrder[0]).toBeLessThan(tokens.create.mock.invocationCallOrder[0]);
  });

  it('never repeats a token', async () => {
    const { service } = setup();
    const first = await service.issue(user('u1'), AuthTokenKind.RESET, null);
    const second = await service.issue(user('u1'), AuthTokenKind.RESET, null);
    expect(first.token).not.toBe(second.token);
  });
});
