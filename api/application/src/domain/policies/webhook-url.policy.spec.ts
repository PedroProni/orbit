import { WebhookUrlPolicy } from '@domain/policies/webhook-url.policy';

const INVALID = 'AUTOMATION_WEBHOOK_URL_INVALID';
const PRIVATE = 'AUTOMATION_WEBHOOK_URL_PRIVATE';

describe('WebhookUrlPolicy', () => {
  it('accepts a public https URL', () => {
    expect(WebhookUrlPolicy.check('https://hooks.example.com/orbit?x=1', false)).toBeNull();
    expect(WebhookUrlPolicy.check('https://8.8.8.8/hook', false)).toBeNull();
  });

  it.each([
    ['http://hooks.example.com/x', INVALID],
    ['ftp://hooks.example.com/x', INVALID],
    ['not a url', INVALID],
    ['', INVALID],
    ['https://user:pass@hooks.example.com/x', INVALID],
    ['https://user@hooks.example.com/x', INVALID],
    [`https://hooks.example.com/${'a'.repeat(2048)}`, INVALID],
    ['https://localhost/x', PRIVATE],
    ['https://LOCALHOST./x', PRIVATE],
    ['https://api.localhost/x', PRIVATE],
    ['https://127.0.0.1/x', PRIVATE],
    ['https://169.254.169.254/latest/meta-data', PRIVATE],
    ['https://0.0.0.0/x', PRIVATE],
    ['https://[::1]/x', PRIVATE],
    ['https://[::ffff:127.0.0.1]/x', PRIVATE],
    ['https://[fe80::1]/x', PRIVATE],
    ['https://2130706433/x', PRIVATE],
    ['https://0x7f000001/x', PRIVATE],
    ['https://0177.0.0.1/x', PRIVATE],
    ['https://127.1/x', PRIVATE],
    ['https://10.0.0.5:8443/x', PRIVATE],
  ])('refuses %s with %s', (url, code) => {
    expect(WebhookUrlPolicy.check(url, false)).toBe(code);
  });

  it('allows http and private hosts only when private delivery is allowed, still refusing credentials', () => {
    expect(WebhookUrlPolicy.check('http://127.0.0.1:4000/hook', true)).toBeNull();
    expect(WebhookUrlPolicy.check('http://localhost:4000/hook', true)).toBeNull();
    expect(WebhookUrlPolicy.check('http://u:p@127.0.0.1/hook', true)).toBe(INVALID);
    expect(WebhookUrlPolicy.check('ftp://127.0.0.1/hook', true)).toBe(INVALID);
  });
});
