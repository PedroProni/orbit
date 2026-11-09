import { PasswordPolicy } from './password.policy';

describe('PasswordPolicy', () => {
  it('accepts the shortest and the longest allowed password', () => {
    expect(PasswordPolicy.violation('a'.repeat(10), 'a@b.test')).toBeNull();
    expect(PasswordPolicy.violation('a'.repeat(200), 'a@b.test')).toBeNull();
  });

  it('refuses too short and too long', () => {
    expect(PasswordPolicy.violation('a'.repeat(9), 'a@b.test')).toBe('PASSWORD_TOO_SHORT');
    expect(PasswordPolicy.violation('a'.repeat(201), 'a@b.test')).toBe('PASSWORD_TOO_LONG');
  });

  it('refuses the email in any case', () => {
    expect(PasswordPolicy.violation('Pessoa@Empresa.test', 'pessoa@empresa.test')).toBe('PASSWORD_EQUALS_EMAIL');
  });
});
