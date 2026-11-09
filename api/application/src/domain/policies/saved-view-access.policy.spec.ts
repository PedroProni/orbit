import { SavedViewAccessPolicy } from '@domain/policies/saved-view-access.policy';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const who = (role: UserRole, userId = 'u1'): AuthPrincipal => ({ workspaceId: 'w', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });

describe('SavedViewAccessPolicy', () => {
  it.each([UserRole.ADMIN, UserRole.OWNER])('does not expose private views of others to %s', (role) => {
    expect(SavedViewAccessPolicy.canSee(who(role), 'other', false)).toBe(false);
  });

  it('shows shared views to everyone', () => {
    expect(SavedViewAccessPolicy.canSee(who(UserRole.GUEST), 'other', true)).toBe(true);
  });

  it('shows private views to their owner', () => {
    expect(SavedViewAccessPolicy.canSee(who(UserRole.MEMBER), 'u1', false)).toBe(true);
  });

  it.each([UserRole.ADMIN, UserRole.OWNER])('lets %s change views of others', (role) => {
    expect(SavedViewAccessPolicy.canChange(who(role), 'other')).toBe(true);
  });

  it.each([UserRole.MEMBER, UserRole.GUEST])('stops %s from changing views of others', (role) => {
    expect(SavedViewAccessPolicy.canChange(who(role), 'other')).toBe(false);
  });

  it('lets a guest change its own view', () => {
    expect(SavedViewAccessPolicy.canChange(who(UserRole.GUEST), 'u1')).toBe(true);
  });
});
