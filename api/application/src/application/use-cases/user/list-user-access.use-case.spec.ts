import { ListUserAccessUseCase } from './list-user-access.use-case';
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

describe('ListUserAccessUseCase', () => {
  it('stays in the workspace of the actor, says who has a password and never exposes the hash', async () => {
    const users = { findMany: jest.fn().mockResolvedValue([user('com'), user('sem')]) };
    const credentials = { findMany: jest.fn().mockResolvedValue([{ getId: () => 'com', getPasswordHash: () => 'stored-hash' }]) };
    const rows = await new ListUserAccessUseCase(users as never, credentials as never).execute(principal(UserRole.ADMIN));
    expect(users.findMany).toHaveBeenCalledWith({ workspace_id: 'w1' }, { name: 1 });
    expect(credentials.findMany).toHaveBeenCalledWith({ workspace_id: 'w1' });
    expect(rows.map(row => [row.id, row.hasPassword])).toEqual([
      ['com', true],
      ['sem', false],
    ]);
    expect(JSON.stringify(rows)).not.toContain('stored-hash');
  });
});
