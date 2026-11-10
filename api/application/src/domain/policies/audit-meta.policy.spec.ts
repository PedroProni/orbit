import { AuditMetaPolicy } from './audit-meta.policy';

describe('AuditMetaPolicy', () => {
  it('drops sensitive keys at any depth, inside arrays and with any letter case or separator', () => {
    const meta = {
      name: 'deploy bot',
      Secret: 's1',
      TOKEN: 't1',
      plainToken: 'p1',
      nested: {
        Password: 'x',
        deeper: {
          'Set-Cookie': 'sid=1',
          set_cookie: 'sid=2',
          Cookie: 'c',
          keep: 'yes',
          list: [
            { Authorization: 'Bearer a', JWT: 'j', ok: 1 },
            { refresh: 'r', Bearer: 'b' },
          ],
        },
      },
      items: [{ private: 'k', Credential: 'c', credentials: ['a'], label: 'fine' }, 'plain', 3],
      apiKey: 'k1',
      clientSecret: 'cs',
      privateKey: 'pk',
      refreshToken: 'rt',
      signature: 'sha256=1',
      hash: 'h',
      KEY: 'k2',
    };
    expect(AuditMetaPolicy.sanitize(meta)).toEqual({ name: 'deploy bot', nested: { deeper: { keep: 'yes', list: [{ ok: 1 }, {}] } }, items: [{ label: 'fine' }, 'plain', 3] });
  });

  it('keeps the fields the application writes today', () => {
    const meta = { name: 'CI', scopes: ['tasks:read'], secretIssued: true, triggerType: 'status_changed', changed: ['title'], diff: { title: { before: 'a', after: 'b' } }, ip: '10.0.0.1', from: 'u1', to: 'u2', before: 'member', after: 'admin' };
    expect(AuditMetaPolicy.sanitize(meta)).toEqual(meta);
  });

  it('cuts objects nested deeper than the limit and returns an empty object for non-object meta', () => {
    let deep: Record<string, unknown> = { leaf: 1 };
    for (let i = 0; i < 12; i += 1) deep = { child: deep };
    expect(JSON.stringify(AuditMetaPolicy.sanitize(deep))).not.toContain('leaf');
    expect(AuditMetaPolicy.sanitize(null)).toEqual({});
    expect(AuditMetaPolicy.sanitize(['a'])).toEqual({});
    expect(AuditMetaPolicy.sanitize(undefined)).toEqual({});
  });

  it('does not change the stored object', () => {
    const meta = { token: 't', keep: { secret: 's' } };
    AuditMetaPolicy.sanitize(meta);
    expect(meta).toEqual({ token: 't', keep: { secret: 's' } });
  });

  it('hides the token name in the meta of a token entry when the reader cannot see that token', () => {
    const meta = { name: 'token do owner', scopes: ['tasks:read'] };
    expect(AuditMetaPolicy.redactTokenName(meta, 'api_token', false)).toEqual({ scopes: ['tasks:read'] });
    expect(AuditMetaPolicy.redactTokenName(meta, 'api_token', true)).toEqual(meta);
    expect(AuditMetaPolicy.redactTokenName({ name: 'Lista' }, 'list', false)).toEqual({ name: 'Lista' });
    expect(meta).toEqual({ name: 'token do owner', scopes: ['tasks:read'] });
  });
});
