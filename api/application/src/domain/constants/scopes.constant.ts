import { UserRole } from '@domain/enums/user.enums';

export const SCOPE_WORKSPACE_READ = 'workspace:read';
export const SCOPE_STRUCTURE_WRITE = 'structure:write';
export const SCOPE_TASKS_READ = 'tasks:read';
export const SCOPE_TASKS_WRITE = 'tasks:write';
export const SCOPE_COMMENTS_WRITE = 'comments:write';
export const SCOPE_ATTACHMENTS_WRITE = 'attachments:write';
export const SCOPE_USERS_READ = 'users:read';
export const SCOPE_USERS_MANAGE = 'users:manage';
export const SCOPE_USERS_INVITE = 'users:invite';
export const SCOPE_TOKENS_MANAGE = 'tokens:manage';
export const SCOPE_AUDIT_READ = 'audit:read';

export const MEMBER_SCOPES: string[] = [SCOPE_WORKSPACE_READ, SCOPE_TASKS_READ, SCOPE_TASKS_WRITE, SCOPE_COMMENTS_WRITE, SCOPE_ATTACHMENTS_WRITE, SCOPE_USERS_READ];
export const VIEWER_SCOPES: string[] = [SCOPE_WORKSPACE_READ, SCOPE_TASKS_READ, SCOPE_USERS_READ];
export const GUEST_SCOPES: string[] = [SCOPE_WORKSPACE_READ, SCOPE_TASKS_READ];
export const ADMIN_SCOPES: string[] = [...MEMBER_SCOPES, SCOPE_STRUCTURE_WRITE, SCOPE_TOKENS_MANAGE, SCOPE_AUDIT_READ, SCOPE_USERS_INVITE];
export const OWNER_SCOPES: string[] = [...ADMIN_SCOPES, SCOPE_USERS_MANAGE];

export const ROLE_SCOPES: Record<UserRole, string[]> = {
  [UserRole.OWNER]: OWNER_SCOPES,
  [UserRole.ADMIN]: ADMIN_SCOPES,
  [UserRole.MEMBER]: MEMBER_SCOPES,
  [UserRole.VIEWER]: VIEWER_SCOPES,
  [UserRole.GUEST]: GUEST_SCOPES,
};

export const ALL_SCOPES: string[] = OWNER_SCOPES;
