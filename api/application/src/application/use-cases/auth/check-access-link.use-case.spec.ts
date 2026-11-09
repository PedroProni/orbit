import { GoneException } from '@nestjs/common';
import { CheckAccessLinkUseCase } from './check-access-link.use-case';
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

const setup = (row: AuthTokenEntity | null, person: UserEntity | null) => {
  const tokens = { findUsable: jest.fn().mockResolvedValue(row) };
  const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(person) };
  return { tokens, users, useCase: new CheckAccessLinkUseCase(tokens as never, users as never) };
};

describe('CheckAccessLinkUseCase', () => {
  it('looks the link up by hash and answers kind, email and expiry', async () => {
    const row = token(AuthTokenKind.RESET);
    const { useCase, tokens } = setup(row, user('u1'));
    await expect(useCase.execute('plain')).resolves.toEqual({ kind: AuthTokenKind.RESET, email: 'u1@example.com', expiresAt: row.getExpiresAt() });
    expect(tokens.findUsable).toHaveBeenCalledWith(AccessLinkService.hash('plain'), expect.any(Date));
  });

  it('answers gone for an unusable link without looking at any person', async () => {
    const { useCase, users } = setup(null, user('u1'));
    await expect(useCase.execute('plain')).rejects.toBeInstanceOf(GoneException);
    expect(users.findByIdInWorkspace).not.toHaveBeenCalled();
  });

  it('answers gone when the person is disabled or missing', async () => {
    await expect(setup(token(), user('u1', UserRole.MEMBER, UserStatus.DISABLED)).useCase.execute('plain')).rejects.toBeInstanceOf(GoneException);
    await expect(setup(token(), null).useCase.execute('plain')).rejects.toBeInstanceOf(GoneException);
  });
});
