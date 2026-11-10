import { SecretCipher } from '@common/helpers/functions/secret-cipher.helper';

const keyA = Buffer.alloc(32, 1);
const keyB = Buffer.alloc(32, 2);

describe('SecretCipher', () => {
  it('round-trips a secret and never stores it in clear', () => {
    const encoded = SecretCipher.encrypt('segredo-do-webhook', keyA);
    expect(encoded.split(':')).toHaveLength(3);
    expect(encoded).not.toContain('segredo');
    expect(SecretCipher.decrypt(encoded, keyA)).toBe('segredo-do-webhook');
  });

  it('uses a fresh IV each time', () => {
    expect(SecretCipher.encrypt('x', keyA)).not.toBe(SecretCipher.encrypt('x', keyA));
  });

  it('refuses the wrong key and tampered or malformed input', () => {
    const encoded = SecretCipher.encrypt('segredo', keyA);
    expect(SecretCipher.decrypt(encoded, keyB)).toBeNull();
    const [iv, tag, data] = encoded.split(':');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 0xff;
    expect(SecretCipher.decrypt([iv, tag, flipped.toString('base64')].join(':'), keyA)).toBeNull();
    expect(SecretCipher.decrypt('abc', keyA)).toBeNull();
    expect(SecretCipher.decrypt('a:b:c', keyA)).toBeNull();
  });

  it('accepts only a base64 key of exactly 32 bytes', () => {
    expect(SecretCipher.parseKey(keyA.toString('base64'))?.equals(keyA)).toBe(true);
    expect(SecretCipher.parseKey(Buffer.alloc(16, 1).toString('base64'))).toBeNull();
    expect(SecretCipher.parseKey('')).toBeNull();
    expect(SecretCipher.parseKey(undefined)).toBeNull();
    expect(SecretCipher.parseKey('not base64 !!')).toBeNull();
  });
});
