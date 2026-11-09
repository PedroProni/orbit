import { generateKeyPairSync } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { CloudflareAccessIdentityVerifier } from '@infrastructure/auth/cloudflare-access-identity.verifier';

const TEAM = 'team.example.com';
const AUD = 'aud-orbit';
const keyPair = () => generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const main = keyPair();
const other = keyPair();
const signer = new JwtService({});

const sign = (payload: Record<string, unknown>, options: { kid?: string; key?: string; algorithm?: 'RS256' | 'HS256'; audience?: string; issuer?: string; expiresIn?: number } = {}) =>
  signer.sign(payload, {
    secret: options.key ?? main.privateKey,
    algorithm: options.algorithm ?? 'RS256',
    audience: options.audience ?? AUD,
    issuer: options.issuer ?? `https://${TEAM}`,
    expiresIn: options.expiresIn ?? 300,
    ...(options.kid === undefined ? { keyid: 'k1' } : options.kid ? { keyid: options.kid } : {}),
  });

const certsResponse = (certs: { kid: string; cert: string }[], status = 200) => new Response(JSON.stringify({ public_certs: certs }), { status });

const build = (team = TEAM, aud = AUD) =>
  new CloudflareAccessIdentityVerifier({ getCfAccessTeamDomain: () => team, getCfAccessAud: () => aud } as unknown as EnvConfigService, new JwtService({ secret: 'module-session-secret' }));

describe('CloudflareAccessIdentityVerifier', () => {
  let fetchMock: jest.SpyInstance;
  let now: number;

  beforeEach(() => {
    now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(certsResponse([{ kid: 'k1', cert: main.publicKey }]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a valid assertion, lowercases the email and caches the team certificates', async () => {
    const verifier = build();
    const identity = await verifier.verify(sign({ email: 'Dev.Person@Grupo.Test', type: 'app' }));
    expect(identity).toEqual({ email: 'dev.person@grupo.test', name: 'dev.person', avatarUrl: null, emailVerified: true });
    await verifier.verify(sign({ email: 'other@grupo.test' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`https://${TEAM}/cdn-cgi/access/certs`);
  });

  it('rejects wrong audience, wrong issuer and expired assertions', async () => {
    const verifier = build();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { audience: 'another-app' }))).rejects.toThrow();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { issuer: 'https://evil.cloudflareaccess.com' }))).rejects.toThrow();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { expiresIn: -10 }))).rejects.toThrow();
  });

  it('rejects an assertion signed by another key and an HS256 assertion keyed with the public certificate', async () => {
    const verifier = build();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { key: other.privateKey }))).rejects.toThrow();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { key: main.publicKey, algorithm: 'HS256' }))).rejects.toThrow();
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { key: 'module-session-secret', algorithm: 'HS256' }))).rejects.toThrow();
  });

  it('rejects assertions without email, without key id and garbage', async () => {
    const verifier = build();
    await expect(verifier.verify(sign({ common_name: 'service-token' }))).rejects.toThrow('Assertion without email');
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }, { kid: '' }))).rejects.toThrow('Assertion without key id');
    await expect(verifier.verify('not-a-jwt')).rejects.toThrow('Assertion without key id');
  });

  it('refuses everything without calling Cloudflare when Access is not configured', async () => {
    await expect(build('', AUD).verify(sign({ email: 'a@grupo.test' }))).rejects.toThrow('Cloudflare Access not configured');
    await expect(build(TEAM, '').verify(sign({ email: 'a@grupo.test' }))).rejects.toThrow('Cloudflare Access not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refetches for an unknown key id only after the minimum refresh window', async () => {
    const verifier = build();
    await verifier.verify(sign({ email: 'a@grupo.test' }));
    fetchMock.mockResolvedValue(
      certsResponse([
        { kid: 'k1', cert: main.publicKey },
        { kid: 'k2', cert: other.publicKey },
      ]),
    );
    const rotated = sign({ email: 'a@grupo.test' }, { kid: 'k2', key: other.privateKey });
    await expect(verifier.verify(rotated)).rejects.toThrow('Unknown key id');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    now += 61_000;
    await expect(verifier.verify(rotated)).resolves.toMatchObject({ email: 'a@grupo.test' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reloads the certificates after the cache lifetime and drops removed keys', async () => {
    const verifier = build();
    await verifier.verify(sign({ email: 'a@grupo.test' }));
    fetchMock.mockResolvedValue(certsResponse([{ kid: 'k2', cert: other.publicKey }]));
    now += 3_600_000;
    await expect(verifier.verify(sign({ email: 'a@grupo.test' }))).rejects.toThrow('Unknown key id');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails when the certificates endpoint fails and shares one fetch between concurrent logins', async () => {
    fetchMock.mockResolvedValue(certsResponse([], 500));
    await expect(build().verify(sign({ email: 'a@grupo.test' }))).rejects.toThrow('Access certs unavailable: 500');
    fetchMock.mockClear();
    fetchMock.mockResolvedValue(certsResponse([{ kid: 'k1', cert: main.publicKey }]));
    const verifier = build();
    const results = await Promise.all([1, 2, 3, 4].map(n => verifier.verify(sign({ email: `u${n}@grupo.test` }))));
    expect(results.map(r => r.email)).toEqual(['u1@grupo.test', 'u2@grupo.test', 'u3@grupo.test', 'u4@grupo.test']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
