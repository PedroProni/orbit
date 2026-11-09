export const AUTH_ERROR_KEYS: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: 'invalidCredentials',
  TOO_MANY_ATTEMPTS: 'tooManyAttempts',
  INVALID_LINK: 'invalidLink',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
  PASSWORD_TOO_LONG: 'passwordTooLong',
  PASSWORD_EQUALS_EMAIL: 'passwordEqualsEmail',
  PASSWORD_UNCHANGED: 'passwordUnchanged',
  CURRENT_PASSWORD_INVALID: 'currentPasswordInvalid',
  USER_EXISTS: 'userExists',
  EMAIL_DOMAIN_NOT_ALLOWED: 'emailDomainNotAllowed',
  ACCESS_NOT_ALLOWED: 'accessNotAllowed',
  USER_DISABLED: 'userDisabled',
};
export const AUTH_ERROR_FALLBACK = 'generic';
