import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ChangeUserRoleUseCase } from './change-user-role.use-case';
import { ChangeUserStatusUseCase } from './change-user-status.use-case';
import { UserProvisioningService } from '@application/services/user-provisioning.service';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const user = (id: string, role: UserRole = UserRole.MEMBER) =>
  new UserEntity({
    _id: id,
    workspaceId: 'w1',
    email: `${id}@acme.test`,
    name: id,
    avatarUrl: null,
    clickupId: null,
    role,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
const principal = (role: UserRole): AuthPrincipal => ({ workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'actor', userId: 'actor', role, scopes: [], sessionId: 's1' });

const setup = (target: UserEntity, swapped: UserEntity | null) => {
  const users = {
    findByIdInWorkspace: jest.fn().mockResolvedValue(target),
    changeRoleIfCurrent: jest.fn().mockResolvedValue(swapped),
    update: jest.fn(),
    patch: jest.fn(),
    count: jest.fn().mockResolvedValue(2),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { users, audit, useCase: new ChangeUserRoleUseCase(users as never, audit as never) };
};

describe('ChangeUserRoleUseCase', () => {
  it('writes the new role only if the person still holds the role the policy checked, then audits it', async () => {
    const { useCase, users, audit } = setup(user('p1'), user('p1', UserRole.VIEWER));
    const result = await useCase.execute(principal(UserRole.ADMIN), 'p1', UserRole.VIEWER);
    expect(users.changeRoleIfCurrent).toHaveBeenCalledWith('p1', 'w1', UserRole.MEMBER, UserRole.VIEWER);
    expect(users.update).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), 'user.role_changed', 'user', 'p1', { before: UserRole.MEMBER, after: UserRole.VIEWER });
    expect(result.role).toBe(UserRole.VIEWER);
  });

  it('answers 409 and audits nothing when the role changed between the check and the write', async () => {
    const { useCase, audit } = setup(user('p1'), null);
    await expect(useCase.execute(principal(UserRole.ADMIN), 'p1', UserRole.VIEWER)).rejects.toBeInstanceOf(ConflictException);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('never reaches the write when the policy refuses', async () => {
    const { useCase, users } = setup(user('p1', UserRole.ADMIN), user('p1', UserRole.VIEWER));
    await expect(useCase.execute(principal(UserRole.ADMIN), 'p1', UserRole.VIEWER)).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.changeRoleIfCurrent).not.toHaveBeenCalled();
  });
});

describe('writers that must not overwrite the role', () => {
  it('a login refreshes only the profile fields, so it cannot bring back a role changed meanwhile', async () => {
    const existing = user('p1');
    const users = { findOne: jest.fn().mockResolvedValue(existing), update: jest.fn(), patch: jest.fn<Promise<UserEntity>, [UserEntity, string[]]>(entity => Promise.resolve(entity)) };
    const service = new UserProvisioningService(users as never, {} as never, {} as never);
    await service.provision({ email: 'p1@acme.test', name: 'P1', avatarUrl: null } as never);
    await service.provision({ email: 'p1@acme.test', name: 'P1', avatarUrl: null } as never, { clickupId: 'cu1' });
    expect(users.update).not.toHaveBeenCalled();
    expect(users.patch.mock.calls.map(call => call[1])).toEqual([
      ['name', 'avatarUrl'],
      ['name', 'avatarUrl', 'clickupId'],
    ]);
  });

  it('a status change writes only the status', async () => {
    const users = { findByIdInWorkspace: jest.fn().mockResolvedValue(user('p1')), update: jest.fn(), patch: jest.fn<Promise<UserEntity>, [UserEntity, string[]]>(entity => Promise.resolve(entity)) };
    const sessions = { revokeAllForUser: jest.fn() };
    const tokens = { invalidateUnused: jest.fn() };
    const audit = { record: jest.fn() };
    await new ChangeUserStatusUseCase(users as never, sessions as never, tokens as never, audit as never).execute(principal(UserRole.ADMIN), 'p1', UserStatus.DISABLED);
    expect(users.update).not.toHaveBeenCalled();
    expect(users.patch).toHaveBeenCalledWith(expect.anything(), ['status']);
  });
});
