export const AUDIT_META_SENSITIVE_KEYS = ['secret', 'token', 'plaintoken', 'password', 'hash', 'key', 'signature', 'authorization', 'cookie', 'setcookie', 'jwt', 'refresh', 'bearer', 'private', 'credential', 'credentials'] as const;
export const AUDIT_META_MAX_DEPTH = 8;
export const AUDIT_META_KEY_SEPARATORS = /[-_\s]/g;
export const AUDIT_TOKEN_ENTITY_TYPE = 'api_token';
export const AUDIT_TOKEN_NAME_META_KEY = 'name';
