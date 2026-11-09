import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';
import { describeAuthError } from '@/lib/auth-error';

describe('auth error words', () => {
  it.each([
    ['INVALID_CREDENTIALS', 'invalidCredentials'],
    ['TOO_MANY_ATTEMPTS', 'tooManyAttempts'],
    ['INVALID_LINK', 'invalidLink'],
    ['PASSWORD_TOO_SHORT', 'passwordTooShort'],
    ['PASSWORD_TOO_LONG', 'passwordTooLong'],
    ['PASSWORD_EQUALS_EMAIL', 'passwordEqualsEmail'],
    ['PASSWORD_UNCHANGED', 'passwordUnchanged'],
    ['CURRENT_PASSWORD_INVALID', 'currentPasswordInvalid'],
    ['USER_EXISTS', 'userExists'],
    ['EMAIL_DOMAIN_NOT_ALLOWED', 'emailDomainNotAllowed'],
    ['ACCESS_NOT_ALLOWED', 'accessNotAllowed'],
    ['USER_DISABLED', 'userDisabled'],
  ])('turns %s into the words %s, present in both languages', (code, key) => {
    expect(describeAuthError(new Error(code))).toBe(key);
    expect((en.authErrors as Record<string, string>)[key]).toBeTruthy();
    expect((pt.authErrors as Record<string, string>)[key]).toBeTruthy();
  });

  it.each([[null], [undefined], [{}], [new Error('Nenhuma conta para ana@example.com')]])('hides anything it does not know behind the generic words: %s', (error) => {
    expect(describeAuthError(error)).toBe('generic');
  });
});
