import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@domain/constants/auth.constant';

export class PasswordPolicy {
  static violation(password: string, email: string): string | null {
    if (password.length < PASSWORD_MIN_LENGTH) return AUTH_ERROR.PASSWORD_TOO_SHORT;
    if (password.length > PASSWORD_MAX_LENGTH) return AUTH_ERROR.PASSWORD_TOO_LONG;
    if (password.trim().toLowerCase() === email.trim().toLowerCase()) return AUTH_ERROR.PASSWORD_EQUALS_EMAIL;
    return null;
  }
}
