import { KEYSET_CURSOR_MAX_LENGTH, KEYSET_CURSOR_PATTERN, KEYSET_ID_PATTERN } from '@domain/constants/keyset-cursor.constant';
import { KeysetPosition } from '@domain/types/keyset-position.type';

export class KeysetCursorPolicy {
  static encode(position: KeysetPosition): string {
    return Buffer.from(JSON.stringify({ t: position.createdAt.getTime(), i: position.id }), 'utf8').toString('base64url');
  }

  static decode(raw: string): KeysetPosition | null {
    if (raw.length === 0 || raw.length > KEYSET_CURSOR_MAX_LENGTH || !KEYSET_CURSOR_PATTERN.test(raw)) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const { t, i } = parsed as Record<string, unknown>;
    if (typeof t !== 'number' || !Number.isSafeInteger(t) || t < 0 || typeof i !== 'string' || !KEYSET_ID_PATTERN.test(i)) return null;
    const createdAt = new Date(t);
    return Number.isNaN(createdAt.getTime()) ? null : { createdAt, id: i };
  }
}
