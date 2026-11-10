import { UserRole } from '@domain/enums/user.enums';
import { ROLE_RANK } from '@domain/constants/role-rank.constant';
import { MEMBER_SCOPES, ROLE_SCOPES, SCOPE_ATTACHMENTS_WRITE, SCOPE_COMMENTS_WRITE, SCOPE_STRUCTURE_WRITE, SCOPE_TASKS_WRITE, SCOPE_TOKENS_MANAGE, SCOPE_USERS_INVITE, SCOPE_USERS_MANAGE, SCOPE_USERS_READ, VIEWER_SCOPES } from '@domain/constants/scopes.constant';

const WRITE_SCOPES = [SCOPE_TASKS_WRITE, SCOPE_COMMENTS_WRITE, SCOPE_ATTACHMENTS_WRITE, SCOPE_STRUCTURE_WRITE, SCOPE_TOKENS_MANAGE, SCOPE_USERS_INVITE, SCOPE_USERS_MANAGE];

describe('viewer scopes', () => {
  it('maps the viewer role to the viewer scopes', () => {
    expect(ROLE_SCOPES[UserRole.VIEWER]).toBe(VIEWER_SCOPES);
  });

  it('keeps every member read scope, names included', () => {
    expect(VIEWER_SCOPES).toEqual(MEMBER_SCOPES.filter(scope => !WRITE_SCOPES.includes(scope)));
    expect(VIEWER_SCOPES).toContain(SCOPE_USERS_READ);
  });

  it('has no write scope at all', () => {
    expect(VIEWER_SCOPES.filter(scope => WRITE_SCOPES.includes(scope))).toEqual([]);
  });

  it('ranks the viewer between guest and member', () => {
    expect(ROLE_RANK[UserRole.GUEST]).toBeLessThan(ROLE_RANK[UserRole.VIEWER]);
    expect(ROLE_RANK[UserRole.VIEWER]).toBeLessThan(ROLE_RANK[UserRole.MEMBER]);
  });
});
