import { FormOwnerPolicy } from './form-owner.policy';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';

describe('FormOwnerPolicy', () => {
  const user = (role: UserRole, status: UserStatus) =>
    new UserEntity({ _id: 'u1', workspaceId: 'w1', email: 'pessoa@exemplo.test', name: 'Pessoa', avatarUrl: null, clickupId: null, role, status, createdAt: new Date(), updatedAt: new Date() });

  it.each([UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER])('lets an active %s keep the form open', role => {
    expect(FormOwnerPolicy.canAct(user(role, UserStatus.ACTIVE))).toBe(true);
  });

  it.each([UserRole.VIEWER, UserRole.GUEST])('pauses the form when the creator is now a %s', role => {
    expect(FormOwnerPolicy.canAct(user(role, UserStatus.ACTIVE))).toBe(false);
  });

  it.each([UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER])('pauses the form when the %s creator is disabled', role => {
    expect(FormOwnerPolicy.canAct(user(role, UserStatus.DISABLED))).toBe(false);
  });

  it('pauses the form when the creator no longer exists', () => {
    expect(FormOwnerPolicy.canAct(null)).toBe(false);
  });
});
