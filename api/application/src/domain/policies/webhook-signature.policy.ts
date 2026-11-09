import { createHmac, timingSafeEqual } from 'node:crypto';

export class WebhookSignaturePolicy {
  static isValid(secret: string, rawBody: Buffer | undefined, header: string | undefined): boolean {
    if (!secret || !rawBody || !header || !header.startsWith('sha256=')) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest();
    const received = Buffer.from(header.slice(7), 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  }
}
