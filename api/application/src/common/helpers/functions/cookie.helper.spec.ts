import { readCookie } from '@common/helpers/functions/cookie.helper';

describe('readCookie', () => {
  it('returns the named cookie among others', () => {
    expect(readCookie('a=1; CF_Authorization=eyJ.abc.def; b=2', 'CF_Authorization')).toBe('eyJ.abc.def');
  });

  it('returns empty for a missing header, a missing cookie and a prefix match', () => {
    expect(readCookie(undefined, 'CF_Authorization')).toBe('');
    expect(readCookie('a=1; b=2', 'CF_Authorization')).toBe('');
    expect(readCookie('CF_AuthorizationX=1; XCF_Authorization=2', 'CF_Authorization')).toBe('');
  });

  it('decodes encoded values and keeps malformed ones as they are', () => {
    expect(readCookie('k=a%3Db', 'k')).toBe('a=b');
    expect(readCookie('k=%E0%A4%A', 'k')).toBe('%E0%A4%A');
  });
});
