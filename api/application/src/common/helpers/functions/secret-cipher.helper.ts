import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AUTOMATION_SECRET_KEY_BYTES } from '@domain/constants/automation.constant';
import { SECRET_CIPHER_ALGORITHM, SECRET_CIPHER_IV_BYTES, SECRET_CIPHER_SEPARATOR, SECRET_CIPHER_TAG_BYTES } from '@domain/constants/secret-cipher.constant';

export class SecretCipher {
  static parseKey(raw: string | undefined | null): Buffer | null {
    const value = (raw ?? '').trim();
    if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
    const key = Buffer.from(value, 'base64');
    return key.length === AUTOMATION_SECRET_KEY_BYTES ? key : null;
  }

  static encrypt(plain: string, key: Buffer): string {
    const iv = randomBytes(SECRET_CIPHER_IV_BYTES);
    const cipher = createCipheriv(SECRET_CIPHER_ALGORITHM, key, iv, { authTagLength: SECRET_CIPHER_TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64')).join(SECRET_CIPHER_SEPARATOR);
  }

  static decrypt(encoded: string, key: Buffer): string | null {
    const parts = encoded.split(SECRET_CIPHER_SEPARATOR);
    if (parts.length !== 3) return null;
    try {
      const [iv, tag, ciphertext] = parts.map(part => Buffer.from(part, 'base64'));
      if (iv.length !== SECRET_CIPHER_IV_BYTES || tag.length !== SECRET_CIPHER_TAG_BYTES) return null;
      const decipher = createDecipheriv(SECRET_CIPHER_ALGORITHM, key, iv, { authTagLength: SECRET_CIPHER_TAG_BYTES });
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      return null;
    }
  }
}
