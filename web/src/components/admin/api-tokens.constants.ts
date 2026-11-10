export const API_TOKEN_SCOPE_KEYS: Record<string, string> = {
  'workspace:read': 'workspaceRead',
  'tasks:read': 'tasksRead',
  'tasks:write': 'tasksWrite',
  'comments:write': 'commentsWrite',
  'attachments:write': 'attachmentsWrite',
  'users:read': 'usersRead',
  'structure:write': 'structureWrite',
  'tokens:manage': 'tokensManage',
  'audit:read': 'auditRead',
  'users:invite': 'usersInvite',
  'users:manage': 'usersManage',
};
export const API_TOKEN_SCOPES = Object.keys(API_TOKEN_SCOPE_KEYS);
export const API_TOKEN_NAME_MAX_LENGTH = 80;
