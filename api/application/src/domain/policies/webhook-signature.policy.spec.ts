import { createHmac } from 'crypto';
import { WebhookSignaturePolicy } from '@domain/policies/webhook-signature.policy';

const sign = (secret: string, body: Buffer) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

describe('WebhookSignaturePolicy', () => {
  const body = Buffer.from('{"a":1}');

  it('accepts a valid signature', () => {
    expect(WebhookSignaturePolicy.isValid('s', body, sign('s', body))).toBe(true);
  });

  it('rejects wrong secret, tampered body, missing header and missing body', () => {
    expect(WebhookSignaturePolicy.isValid('s', body, sign('other', body))).toBe(false);
    expect(WebhookSignaturePolicy.isValid('s', Buffer.from('{"a":2}'), sign('s', body))).toBe(false);
    expect(WebhookSignaturePolicy.isValid('s', body, undefined)).toBe(false);
    expect(WebhookSignaturePolicy.isValid('s', undefined, sign('s', body))).toBe(false);
  });
});
