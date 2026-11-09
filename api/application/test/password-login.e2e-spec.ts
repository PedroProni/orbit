import { createHash } from 'node:crypto';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { applyTrustProxy } from '../src/infrastructure/http-security/apply-trust-proxy';
import { MAIL_SENDER_TOKEN, PASSWORD_HASHER_TOKEN } from '../src/domain/constants/inject-token.constant';
import { issueAccessLinks } from '../src/cli/access/access-link.runner';

const PASSWORD = 'uma-senha-bem-longa-1';
const OTHER_PASSWORD = 'outra-senha-bem-longa-2';
const CSRF = 'x-orbit-csrf';

describe('Password login (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let member: { token: string; id: string };
  let guest: { token: string; id: string };
  let sequence = 0;

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
  const nextEmail = (prefix = 'pessoa') => `${prefix}${++sequence}@acme.test`;
  const cookieOf = (res: { headers: Record<string, any> }): string => {
    const header = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find(value => value.startsWith('orbit_session=') && !value.startsWith('orbit_session=;'));
    if (!header) throw new Error('no session cookie');
    return header.split(';')[0];
  };
  const login = (email: string, password = PASSWORD, ip = '10.0.0.1') => ctx.http().post('/auth/login').set('X-Forwarded-For', ip).send({ email, password });
  const invite = async (email = nextEmail(), role = 'member', by = owner.token) => {
    const res = await ctx.http().post('/users/invite').set(bearer(by)).send({ email, name: 'Pessoa', role }).expect(201);
    return { email, id: res.body.user.id as string, token: res.body.link.token as string };
  };
  const account = async (email = nextEmail(), role = 'member') => {
    const invited = await invite(email, role);
    await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(204);
    return invited;
  };
  const signIn = async (email: string, password = PASSWORD) => cookieOf(await login(email, password).expect(200));

  beforeAll(async () => {
    ctx = await createTestApp(app => applyTrustProxy(app, 1));
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin', 'admin');
    member = await ctx.login('member@acme.test', 'Member');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  beforeEach(async () => {
    await db.collection('login_attempts').deleteMany({});
    jest.restoreAllMocks();
  });

  describe('happy flow', () => {
    it('invite, set password, sign in with a secure HttpOnly cookie and no token in the body', async () => {
      const invited = await invite();
      const check = await ctx.http().post('/auth/password/link').send({ token: invited.token }).expect(200);
      expect(check.body).toMatchObject({ kind: 'invite', email: invited.email });
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(204);
      const res = await login(invited.email).expect(200);
      expect(JSON.stringify(res.body)).not.toMatch(/token|eyJ/i);
      expect(res.body.user.email).toBe(invited.email);
      const header = ([] as string[]).concat(res.headers['set-cookie'] as any).join(';');
      expect(header).toMatch(/HttpOnly/);
      expect(header).toMatch(/Secure/);
      expect(header).toMatch(/SameSite=Lax/);
      const me = await ctx.http().get('/auth/me').set('Cookie', cookieOf(res)).expect(200);
      expect(me.body.email).toBe(invited.email);
      expect(me.body.role).toBe('member');
    });

    it('accepts the email in another case', async () => {
      const { email } = await account();
      await login(email.toUpperCase()).expect(200);
    });

    it('a user with no password, like an imported one, cannot sign in', async () => {
      await login('member@acme.test').expect(401);
    });

    it('stores only an argon2id hash and only the hash of the link', async () => {
      const invited = await invite();
      const stored = await db.collection('auth_tokens').findOne({ user_id: invited.id });
      expect(stored?.token_hash).toBe(createHash('sha256').update(invited.token).digest('hex'));
      expect(JSON.stringify(stored)).not.toContain(invited.token);
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(204);
      const credential = await db.collection('user_credentials').findOne({ _id: invited.id as any });
      expect(credential?.password_hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
      expect(JSON.stringify(credential)).not.toContain(PASSWORD);
    });

    it('never returns the hash and never writes secrets to the audit log', async () => {
      const invited = await account();
      const users = await ctx.http().get('/users').set(bearer(owner.token)).expect(200);
      const access = await ctx.http().get('/users/access').set(bearer(owner.token)).expect(200);
      expect(JSON.stringify(users.body)).not.toContain('argon2');
      expect(JSON.stringify(access.body)).not.toContain('argon2');
      expect(access.body.find((row: { id: string }) => row.id === invited.id).hasPassword).toBe(true);
      expect(access.body.find((row: { id: string }) => row.id === member.id).hasPassword).toBe(false);
      const logs = JSON.stringify(await db.collection('audit_logs').find({ entity_id: invited.id }).toArray());
      expect(logs).toContain('user.invited');
      expect(logs).toContain('auth.password_set');
      expect(logs).not.toContain(PASSWORD);
      expect(logs).not.toContain(invited.token);
    });
  });

  describe('links', () => {
    it('refuses a link used twice', async () => {
      const invited = await invite();
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(204);
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: OTHER_PASSWORD }).expect(410);
      await ctx.http().post('/auth/password/link').send({ token: invited.token }).expect(410);
      await login(invited.email, OTHER_PASSWORD).expect(401);
    });

    it('lets only one of many parallel uses win', async () => {
      const invited = await invite();
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          ctx
            .http()
            .post('/auth/password/set')
            .send({ token: invited.token, password: `${PASSWORD}-${i}` }),
        ),
      );
      expect(results.filter(res => res.status === 204)).toHaveLength(1);
      expect(results.filter(res => res.status === 410)).toHaveLength(5);
    });

    it('refuses an expired link', async () => {
      const invited = await invite();
      await db.collection('auth_tokens').updateOne({ user_id: invited.id }, { $set: { expires_at: new Date(Date.now() - 1000) } });
      await ctx.http().post('/auth/password/link').send({ token: invited.token }).expect(410);
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(410);
      expect(await db.collection('user_credentials').countDocuments({ _id: invited.id as any })).toBe(0);
    });

    it('refuses a made up link with the same answer', async () => {
      const made = await ctx.http().post('/auth/password/set').send({ token: 'nope', password: PASSWORD }).expect(410);
      expect(made.body.message).toBe('INVALID_LINK');
    });

    it('a newer link cancels the older one', async () => {
      const invited = await invite();
      const again = await ctx.http().post(`/users/${invited.id}/access-link`).set(bearer(owner.token)).expect(201);
      expect(again.body.kind).toBe('invite');
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(410);
      await ctx.http().post('/auth/password/set').send({ token: again.body.token, password: PASSWORD }).expect(204);
    });

    it('a weak password does not burn the link', async () => {
      const invited = await invite();
      const short = await ctx.http().post('/auth/password/set').send({ token: invited.token, password: 'curta' }).expect(400);
      expect(short.body.message).toBe('PASSWORD_TOO_SHORT');
      const same = await ctx.http().post('/auth/password/set').send({ token: invited.token, password: invited.email }).expect(400);
      expect(same.body.message).toBe('PASSWORD_EQUALS_EMAIL');
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(204);
    });

    it('generates a reset link when the password exists, and using it ends every session', async () => {
      const { id, email } = await account();
      const cookie = await signIn(email);
      const link = await ctx.http().post(`/users/${id}/access-link`).set(bearer(owner.token)).expect(201);
      expect(link.body.kind).toBe('reset');
      await ctx.http().post('/auth/password/set').send({ token: link.body.token, password: OTHER_PASSWORD }).expect(204);
      await ctx.http().get('/auth/me').set('Cookie', cookie).expect(401);
      await login(email).expect(401);
      await login(email, OTHER_PASSWORD).expect(200);
    });

    it('the command line tool issues invite and reset links that work', async () => {
      const pending = await invite();
      const ready = await account();
      const rows = await issueAccessLinks(db, { all: true, baseUrl: 'https://orbit.test/', now: new Date() });
      const forPending = rows.find(row => row.email === pending.email)!;
      const forReady = rows.find(row => row.email === ready.email)!;
      expect(forPending.kind).toBe('invite');
      expect(forReady.kind).toBe('reset');
      expect(forPending.link).toMatch(/^https:\/\/orbit\.test\/set-password#token=/);
      await ctx.http().post('/auth/password/set').send({ token: pending.token, password: PASSWORD }).expect(410);
      await ctx
        .http()
        .post('/auth/password/set')
        .send({ token: forPending.link.split('#token=')[1], password: PASSWORD })
        .expect(204);
      await login(pending.email).expect(200);
      await expect(issueAccessLinks(db, { all: false, baseUrl: 'https://orbit.test', now: new Date() })).rejects.toThrow('--email');
    });
  });

  describe('brute force', () => {
    it('blocks an account after ten failures, even with the right password', async () => {
      const { email } = await account();
      for (let i = 0; i < 10; i += 1) await login(email, 'senha-errada-numero').expect(401);
      const blocked = await login(email).expect(429);
      expect(blocked.body.message).toBe('TOO_MANY_ATTEMPTS');
    });

    it('blocks an unknown email the same way', async () => {
      for (let i = 0; i < 10; i += 1) await login('ninguem@acme.test', 'senha-errada-numero').expect(401);
      await login('ninguem@acme.test', 'senha-errada-numero').expect(429);
    });

    it('parallel guesses cannot pass the limit', async () => {
      const { email } = await account();
      const results = await Promise.all(Array.from({ length: 16 }, () => login(email, 'senha-errada-numero')));
      expect(results.filter(res => res.status === 401)).toHaveLength(10);
      expect(results.filter(res => res.status === 429)).toHaveLength(6);
    });

    it('rotating the address does not reset the account limit', async () => {
      const { email } = await account();
      for (let i = 0; i < 10; i += 1) await login(email, 'senha-errada-numero', `10.1.0.${i}`).expect(401);
      await login(email, PASSWORD, '10.1.0.99').expect(429);
    });

    it('blocks an address after thirty failures across accounts, other addresses keep working', async () => {
      const { email } = await account();
      for (let i = 0; i < 30; i += 1) await login(`alvo${i}@acme.test`, 'senha-errada-numero', '10.2.0.1').expect(401);
      await login(email, PASSWORD, '10.2.0.1').expect(429);
      await login(email, PASSWORD, '10.2.0.2').expect(200);
    });

    it('a success clears the account count and gives back only its own address hit', async () => {
      const { email } = await account();
      for (let i = 0; i < 9; i += 1) await login(email, 'senha-errada-numero').expect(401);
      await login(email).expect(200);
      for (let i = 0; i < 10; i += 1) await login(email, 'senha-errada-numero').expect(401);
      await login(email).expect(429);
    });

    it('a new password opens a blocked account', async () => {
      const { id, email } = await account();
      for (let i = 0; i < 11; i += 1) await login(email, 'senha-errada-numero').expect(i < 10 ? 401 : 429);
      const link = await ctx.http().post(`/users/${id}/access-link`).set(bearer(owner.token)).expect(201);
      await ctx.http().post('/auth/password/set').send({ token: link.body.token, password: OTHER_PASSWORD }).expect(204);
      await login(email, OTHER_PASSWORD, '10.3.0.1').expect(200);
    });

    it('a stolen session cannot guess the current password forever', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      for (let i = 0; i < 10; i += 1)
        await ctx.http().post('/auth/password/change').set('Cookie', cookie).set(CSRF, '1').send({ currentPassword: 'senha-errada-numero', newPassword: OTHER_PASSWORD }).expect(400);
      await ctx.http().post('/auth/password/change').set('Cookie', cookie).set(CSRF, '1').send({ currentPassword: PASSWORD, newPassword: OTHER_PASSWORD }).expect(429);
    });
  });

  describe('enumeration', () => {
    it('answers the same for wrong password, unknown email, no password and disabled user', async () => {
      const wrong = await account();
      const disabled = await account();
      const pending = await invite();
      await ctx.http().patch(`/users/${disabled.id}/status`).set(bearer(owner.token)).send({ status: 'disabled' }).expect(200);
      const answers = await Promise.all([
        login(wrong.email, 'senha-errada-numero'),
        login('nao-existe@acme.test', 'senha-errada-numero'),
        login(pending.email, 'senha-errada-numero'),
        login(disabled.email, PASSWORD),
      ]);
      for (const res of answers) {
        expect(res.status).toBe(401);
        expect({ ...res.body, requestId: null, timestamp: null }).toEqual({ ...answers[0].body, requestId: null, timestamp: null });
        expect(res.headers['set-cookie']).toBeUndefined();
      }
      expect(answers[0].body.message).toBe('INVALID_CREDENTIALS');
    });

    it('spends the same hashing work when there is nothing to compare', async () => {
      const hasher = ctx.app.get(PASSWORD_HASHER_TOKEN);
      const burn = jest.spyOn(hasher, 'burn');
      await login('nao-existe@acme.test', 'senha-errada-numero').expect(401);
      const pending = await invite();
      await login(pending.email, 'senha-errada-numero').expect(401);
      expect(burn).toHaveBeenCalledTimes(2);
    });

    it('forgot password answers the same for anyone and creates nothing without a mail provider', async () => {
      const { id, email } = await account();
      const before = await db.collection('auth_tokens').countDocuments({ user_id: id });
      const known = await ctx.http().post('/auth/password/forgot').send({ email }).expect(202);
      const unknown = await ctx.http().post('/auth/password/forgot').send({ email: 'nao-existe@acme.test' }).expect(202);
      expect(known.body).toEqual({ delivery: 'admin' });
      expect(unknown.body).toEqual(known.body);
      expect(await db.collection('auth_tokens').countDocuments({ user_id: id })).toBe(before);
    });

    it('with a mail provider it sends only to a real account with a password, three times at most', async () => {
      const mail = ctx.app.get(MAIL_SENDER_TOKEN);
      const send = jest.spyOn(mail, 'sendPasswordReset').mockResolvedValue(undefined as never);
      jest.spyOn(mail, 'isConfigured').mockReturnValue(true);
      const { email } = await account();
      const pending = await invite();
      const answers = await Promise.all([
        ctx.http().post('/auth/password/forgot').send({ email }),
        ctx.http().post('/auth/password/forgot').send({ email: 'nao-existe@acme.test' }),
        ctx.http().post('/auth/password/forgot').send({ email: pending.email }),
      ]);
      for (const res of answers) expect(res.body).toEqual({ delivery: 'email' });
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(send).toHaveBeenCalledTimes(1);
      const token = send.mock.calls[0][1] as string;
      await ctx.http().post('/auth/password/forgot').send({ email }).expect(202);
      await ctx.http().post('/auth/password/forgot').send({ email }).expect(202);
      await ctx.http().post('/auth/password/forgot').send({ email }).expect(202);
      await ctx.http().post('/auth/password/forgot').send({ email }).expect(202);
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(send).toHaveBeenCalledTimes(3);
      expect(token).toBeTruthy();
      await ctx.http().post('/auth/password/set').send({ token: send.mock.calls[2][1], password: OTHER_PASSWORD }).expect(204);
    });
  });

  describe('sessions', () => {
    it('sign out ends the session, replaying the old cookie fails', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      await ctx.http().get('/auth/me').set('Cookie', cookie).expect(200);
      const out = await ctx.http().post('/auth/logout').set('Cookie', cookie).set(CSRF, '1').expect(204);
      expect(([] as string[]).concat(out.headers['set-cookie'] as any).join(';')).toMatch(/orbit_session=;/);
      await ctx.http().get('/auth/me').set('Cookie', cookie).expect(401);
    });

    it('needs the extra header for a cookie write, not for a read and not for a bearer token', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      await ctx.http().post('/auth/logout').set('Cookie', cookie).expect(403);
      await ctx.http().post('/auth/sessions/revoke-others').set('Cookie', cookie).expect(403);
      await ctx.http().get('/auth/sessions').set('Cookie', cookie).expect(200);
      const dev = await ctx.login(email, 'Pessoa');
      await ctx.http().post('/auth/sessions/revoke-others').set(bearer(dev.token)).expect(200);
    });

    it('refuses a session token with no session id', async () => {
      const { JwtService } = await import('@nestjs/jwt');
      const forged = await ctx.app.get(JwtService).signAsync({ sub: owner.id, ws: 'whatever' }, { expiresIn: 60 });
      await ctx.http().get('/auth/me').set(bearer(forged)).expect(401);
    });

    it('refuses a session id from another user', async () => {
      const { JwtService } = await import('@nestjs/jwt');
      const jwt = ctx.app.get(JwtService);
      const { email } = await account();
      const cookie = await signIn(email);
      const mine = await ctx.http().get('/auth/sessions').set('Cookie', cookie).expect(200);
      const ownerRow = await db.collection('users').findOne({ _id: owner.id as any });
      const forged = await jwt.signAsync({ sub: owner.id, ws: ownerRow?.workspace_id, sid: mine.body[0].id }, { expiresIn: 60 });
      await ctx.http().get('/auth/me').set(bearer(forged)).expect(401);
    });

    it('lists only my sessions and revokes one by id', async () => {
      const { email } = await account();
      const first = await signIn(email);
      const second = await signIn(email);
      const list = await ctx.http().get('/auth/sessions').set('Cookie', first).set('User-Agent', 'agente-a').expect(200);
      expect(list.body).toHaveLength(2);
      expect(list.body.filter((row: { current: boolean }) => row.current)).toHaveLength(1);
      const other = list.body.find((row: { current: boolean }) => !row.current);
      await ctx.http().delete(`/auth/sessions/${other.id}`).set('Cookie', first).set(CSRF, '1').expect(200);
      await ctx.http().get('/auth/me').set('Cookie', second).expect(401);
      await ctx.http().get('/auth/me').set('Cookie', first).expect(200);
    });

    it('cannot revoke or see the session of another user', async () => {
      const a = await account();
      const b = await account();
      const cookieA = await signIn(a.email);
      const cookieB = await signIn(b.email);
      const listB = await ctx.http().get('/auth/sessions').set('Cookie', cookieB).expect(200);
      const listA = await ctx.http().get('/auth/sessions').set('Cookie', cookieA).expect(200);
      expect(listA.body.map((row: { id: string }) => row.id)).not.toContain(listB.body[0].id);
      await ctx.http().delete(`/auth/sessions/${listB.body[0].id}`).set('Cookie', cookieA).set(CSRF, '1').expect(404);
      await ctx.http().get('/auth/me').set('Cookie', cookieB).expect(200);
    });

    it('revoking my current session clears the cookie', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      const list = await ctx.http().get('/auth/sessions').set('Cookie', cookie).expect(200);
      const res = await ctx.http().delete(`/auth/sessions/${list.body[0].id}`).set('Cookie', cookie).set(CSRF, '1').expect(200);
      expect(res.body.current).toBe(true);
      expect(([] as string[]).concat(res.headers['set-cookie'] as any).join(';')).toMatch(/orbit_session=;/);
    });

    it('password change ends the other sessions and keeps this one', async () => {
      const { email } = await account();
      const here = await signIn(email);
      const elsewhere = await signIn(email);
      const changed = await ctx.http().post('/auth/password/change').set('Cookie', here).set(CSRF, '1').send({ currentPassword: PASSWORD, newPassword: OTHER_PASSWORD }).expect(200);
      expect(changed.body.revoked).toBe(1);
      await ctx.http().get('/auth/me').set('Cookie', here).expect(200);
      await ctx.http().get('/auth/me').set('Cookie', elsewhere).expect(401);
      await login(email).expect(401);
      await login(email, OTHER_PASSWORD).expect(200);
    });

    it('a wrong current password is a 400 and changes nothing, the same password is refused', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      const wrong = await ctx.http().post('/auth/password/change').set('Cookie', cookie).set(CSRF, '1').send({ currentPassword: 'senha-errada-numero', newPassword: OTHER_PASSWORD }).expect(400);
      expect(wrong.body.message).toBe('CURRENT_PASSWORD_INVALID');
      const same = await ctx.http().post('/auth/password/change').set('Cookie', cookie).set(CSRF, '1').send({ currentPassword: PASSWORD, newPassword: PASSWORD }).expect(400);
      expect(same.body.message).toBe('PASSWORD_UNCHANGED');
      await login(email).expect(200);
    });

    it('an admin ends the sessions of a member, disabling a user ends them too', async () => {
      const a = await account();
      const b = await account();
      const cookieA = await signIn(a.email);
      const cookieB = await signIn(b.email);
      const ended = await ctx.http().delete(`/users/${a.id}/sessions`).set(bearer(admin.token)).expect(200);
      expect(ended.body.revoked).toBe(1);
      await ctx.http().get('/auth/me').set('Cookie', cookieA).expect(401);
      await ctx.http().patch(`/users/${b.id}/status`).set(bearer(owner.token)).send({ status: 'disabled' }).expect(200);
      await ctx.http().patch(`/users/${b.id}/status`).set(bearer(owner.token)).send({ status: 'active' }).expect(200);
      await ctx.http().get('/auth/me').set('Cookie', cookieB).expect(401);
    });

    it('a disabled user loses unused links and gets no new one', async () => {
      const invited = await invite();
      await ctx.http().patch(`/users/${invited.id}/status`).set(bearer(owner.token)).send({ status: 'disabled' }).expect(200);
      await ctx.http().post('/auth/password/set').send({ token: invited.token, password: PASSWORD }).expect(410);
      await ctx.http().post(`/users/${invited.id}/access-link`).set(bearer(owner.token)).expect(409);
    });
  });

  describe('roles', () => {
    it('member and guest cannot invite, list access, generate links or end sessions', async () => {
      for (const actor of [member, guest]) {
        await ctx.http().post('/users/invite').set(bearer(actor.token)).send({ email: nextEmail(), name: 'X', role: 'member' }).expect(403);
        await ctx.http().get('/users/access').set(bearer(actor.token)).expect(403);
        await ctx.http().post(`/users/${owner.id}/access-link`).set(bearer(actor.token)).expect(403);
        await ctx.http().delete(`/users/${owner.id}/sessions`).set(bearer(actor.token)).expect(403);
      }
    });

    it('anonymous gets 401 on every admin route', async () => {
      await ctx.http().post('/users/invite').send({ email: nextEmail(), name: 'X', role: 'member' }).expect(401);
      await ctx.http().get('/users/access').expect(401);
      await ctx.http().post(`/users/${owner.id}/access-link`).expect(401);
      await ctx.http().delete(`/users/${owner.id}/sessions`).expect(401);
    });

    it('admin invites member and guest only, owner also invites admin, nobody invites an owner', async () => {
      await invite(nextEmail(), 'member', admin.token);
      await invite(nextEmail(), 'guest', admin.token);
      await ctx.http().post('/users/invite').set(bearer(admin.token)).send({ email: nextEmail(), name: 'X', role: 'admin' }).expect(403);
      await ctx.http().post('/users/invite').set(bearer(admin.token)).send({ email: nextEmail(), name: 'X', role: 'owner' }).expect(403);
      await invite(nextEmail(), 'admin', owner.token);
      await ctx.http().post('/users/invite').set(bearer(owner.token)).send({ email: nextEmail(), name: 'X', role: 'owner' }).expect(403);
    });

    it('admin cannot get a link for an admin or the owner, nobody gets a link for themselves', async () => {
      const otherAdmin = await invite(nextEmail(), 'admin');
      await ctx.http().post(`/users/${otherAdmin.id}/access-link`).set(bearer(admin.token)).expect(403);
      await ctx.http().post(`/users/${owner.id}/access-link`).set(bearer(admin.token)).expect(403);
      await ctx.http().delete(`/users/${owner.id}/sessions`).set(bearer(admin.token)).expect(403);
      const own = await ctx.http().post(`/users/${owner.id}/access-link`).set(bearer(owner.token)).expect(400);
      expect(own.body.message).toBe('OWN_ACCESS_LINK');
      await ctx.http().post(`/users/${otherAdmin.id}/access-link`).set(bearer(owner.token)).expect(201);
    });

    it('invited roles stay what was asked, guest signs in, reads and cannot write', async () => {
      const { email } = await account(nextEmail(), 'guest');
      const cookie = await signIn(email);
      const me = await ctx.http().get('/auth/me').set('Cookie', cookie).expect(200);
      expect(me.body.role).toBe('guest');
      await ctx.http().post('/users/invite').set('Cookie', cookie).set(CSRF, '1').send({ email: nextEmail(), name: 'X', role: 'member' }).expect(403);
      await ctx.http().post('/auth/password/change').set('Cookie', cookie).set(CSRF, '1').send({ currentPassword: PASSWORD, newPassword: OTHER_PASSWORD }).expect(200);
      await ctx.http().get('/auth/sessions').set('Cookie', cookie).expect(200);
      await ctx.http().post('/auth/logout').set('Cookie', cookie).set(CSRF, '1').expect(204);
    });

    it('a member with a password signs in with the same scopes as before', async () => {
      const { email } = await account();
      const cookie = await signIn(email);
      const me = await ctx.http().get('/auth/me').set('Cookie', cookie).expect(200);
      expect(me.body.scopes).not.toContain('users:invite');
      expect(me.body.scopes).not.toContain('structure:write');
      await ctx.http().get('/users').set('Cookie', cookie).expect(200);
      await ctx
        .http()
        .get('/audit-logs')
        .set('Cookie', cookie)
        .expect(res => expect([403, 404]).toContain(res.status));
    });

    it('an API token cannot manage access or sessions and survives a password change', async () => {
      const made = await ctx
        .http()
        .post('/api-tokens')
        .set(bearer(owner.token))
        .send({ name: 'robo', scopes: ['users:invite', 'users:read'] });
      expect(made.status).toBe(201);
      const robot = made.body.token as string;
      await ctx.http().post('/users/invite').set(bearer(robot)).send({ email: nextEmail(), name: 'X', role: 'member' }).expect(403);
      await ctx.http().post(`/users/${member.id}/access-link`).set(bearer(robot)).expect(403);
      await ctx.http().delete(`/users/${member.id}/sessions`).set(bearer(robot)).expect(403);
      await ctx.http().get('/auth/sessions').set(bearer(robot)).expect(403);
      await ctx.http().post('/auth/logout').set(bearer(robot)).expect(403);
      await ctx.http().post('/auth/password/change').set(bearer(robot)).send({ currentPassword: 'a', newPassword: 'b' }).expect(403);
      await ctx.http().get('/users').set(bearer(robot)).expect(200);
    });

    it('refuses an email outside the company domain unless the person asks for it, and records it', async () => {
      const refused = await ctx.http().post('/users/invite').set(bearer(admin.token)).send({ email: 'fora@example.com', name: 'X', role: 'member' }).expect(403);
      expect(refused.body.message).toBe('EMAIL_DOMAIN_NOT_ALLOWED');
      const allowed = await ctx.http().post('/users/invite').set(bearer(admin.token)).send({ email: 'fora@example.com', name: 'X', role: 'member', allowExternalEmail: true }).expect(201);
      const log = await db.collection('audit_logs').findOne({ action: 'user.invited', entity_id: allowed.body.user.id });
      expect(log?.meta).toMatchObject({ external: true });
    });

    it('refuses an email already in use without changing that user', async () => {
      const res = await ctx.http().post('/users/invite').set(bearer(owner.token)).send({ email: 'MEMBER@acme.test', name: 'Outro', role: 'admin' }).expect(409);
      expect(res.body.message).toBe('USER_EXISTS');
      const row = await db.collection('users').findOne({ email: 'member@acme.test' });
      expect(row?.role).toBe('member');
      expect(row?.name).toBe('Member');
    });
  });
});
