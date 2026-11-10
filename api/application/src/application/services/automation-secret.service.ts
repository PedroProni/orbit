import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { SecretCipher } from '@common/helpers/functions/secret-cipher.helper';
import { AutomationError } from '@domain/errors/automation.error';
import { AUTOMATION_ERROR } from '@domain/constants/automation-error.constant';
import { AUTOMATION_SECRET_BYTES } from '@domain/constants/automation.constant';
import { AutomationSecret } from '@domain/types/automation-secret.type';

@Injectable()
export class AutomationSecretService {
  constructor(private readonly env: EnvConfigService) {}

  assertConfigured(): Buffer {
    const key = SecretCipher.parseKey(this.env.getAutomationSecretKey());
    if (!key) throw new AutomationError(AUTOMATION_ERROR.SECRET_KEY_MISSING, 'Webhook automations need AUTOMATION_SECRET_KEY configured on the server');
    return key;
  }

  generate(): AutomationSecret {
    const key = this.assertConfigured();
    const plain = randomBytes(AUTOMATION_SECRET_BYTES).toString('hex');
    return { plain, encrypted: SecretCipher.encrypt(plain, key) };
  }

  reveal(encrypted: string | null): string | null {
    if (!encrypted) return null;
    const key = SecretCipher.parseKey(this.env.getAutomationSecretKey());
    return key ? SecretCipher.decrypt(encrypted, key) : null;
  }
}
