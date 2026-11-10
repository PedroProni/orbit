import { AutomationSecretService } from '@application/services/automation-secret.service';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { SecretCipher } from '@common/helpers/functions/secret-cipher.helper';
import { AutomationError } from '@domain/errors/automation.error';
import { AUTOMATION_ERROR } from '@domain/constants/automation-error.constant';

const keyA = Buffer.alloc(32, 7);
const keyB = Buffer.alloc(32, 9);
const serviceWith = (raw: string) => new AutomationSecretService({ getAutomationSecretKey: () => raw } as unknown as EnvConfigService);

describe('AutomationSecretService', () => {
  it('issues a fresh hex secret and stores only its AES-GCM ciphertext', () => {
    const service = serviceWith(keyA.toString('base64'));
    const first = service.generate();
    const second = service.generate();
    expect(first.plain).toMatch(/^[0-9a-f]{64}$/);
    expect(first.plain).not.toBe(second.plain);
    expect(first.encrypted).not.toContain(first.plain);
    expect(SecretCipher.decrypt(first.encrypted, keyA)).toBe(first.plain);
    expect(service.reveal(first.encrypted)).toBe(first.plain);
  });

  it('refuses to issue a secret without a valid 32-byte key', () => {
    for (const raw of ['', Buffer.alloc(16, 1).toString('base64'), 'not base64 !!']) {
      const service = serviceWith(raw);
      expect(() => service.generate()).toThrow(AutomationError);
      const thrown = (() => {
        try {
          service.assertConfigured();
          return null;
        } catch (error) {
          return error as AutomationError;
        }
      })();
      expect(thrown?.code).toBe(AUTOMATION_ERROR.SECRET_KEY_MISSING);
    }
  });

  it('reveals nothing without the key, with another key, for tampered or empty input', () => {
    const encrypted = SecretCipher.encrypt('segredo', keyA);
    expect(serviceWith('').reveal(encrypted)).toBeNull();
    expect(serviceWith(keyB.toString('base64')).reveal(encrypted)).toBeNull();
    expect(serviceWith(keyA.toString('base64')).reveal('a:b:c')).toBeNull();
    expect(serviceWith(keyA.toString('base64')).reveal(null)).toBeNull();
  });
});
