export const AUDIT_ACTION_GROUPS = ['attachment', 'auth', 'automation', 'comment', 'custom_field', 'dashboard', 'doc', 'folder', 'form', 'goal', 'group', 'guest', 'list', 'saved_view', 'space', 'task', 'template', 'token', 'user'] as const;
export const AUDIT_ENTITY_TYPES = ['api_token', 'attachment', 'automation', 'comment', 'custom_field', 'dashboard', 'doc', 'folder', 'form', 'goal', 'group', 'list', 'saved_view', 'session', 'space', 'task', 'template', 'user'] as const;
export const AUDIT_ACTION_SEPARATOR = '.';
export const AUDIT_ACTION_GROUP_UPPER_BOUND = '/';
export const AUDIT_ACTION_FILTER_PATTERN = new RegExp(`^(${AUDIT_ACTION_GROUPS.join('|')})(\\.[a-z_]{1,60})?$`);
export const AUDIT_REFERENCE_ID_PATTERN = /^[A-Za-z0-9:_-]{1,100}$/;
