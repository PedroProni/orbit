import { KeysetCursorPolicy } from './keyset-cursor.policy';

const raw = (value: unknown) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value), 'utf8').toString('base64url');

describe('KeysetCursorPolicy', () => {
  it('round-trips a position', () => {
    const position = { createdAt: new Date('2026-11-10T12:00:00.123Z'), id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427' };
    expect(KeysetCursorPolicy.decode(KeysetCursorPolicy.encode(position))).toEqual(position);
  });

  it.each([
    ['empty', ''],
    ['not base64url', 'abc$%^'],
    ['too long', 'a'.repeat(201)],
    ['not json', raw('not json')],
    ['array', raw([1, 'a'])],
    ['null', raw(null)],
    ['missing id', raw({ t: 1 })],
    ['missing time', raw({ i: 'a' })],
    ['string time', raw({ t: '1', i: 'a' })],
    ['negative time', raw({ t: -1, i: 'a' })],
    ['fractional time', raw({ t: 1.5, i: 'a' })],
    ['operator id', raw({ t: 1, i: { $gt: '' } })],
    ['id with symbols', raw({ t: 1, i: '$where' })],
    ['time out of range', raw({ t: 9e15, i: 'a' })],
  ])('rejects a cursor that is %s', (_name, cursor) => {
    expect(KeysetCursorPolicy.decode(cursor)).toBeNull();
  });
});
