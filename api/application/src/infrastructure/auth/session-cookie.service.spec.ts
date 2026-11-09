import { Response } from 'express';
import { SessionCookieService } from './session-cookie.service';
import { SESSION_COOKIE_NAME } from '@domain/constants/auth.constant';
import { SESSION_TTL_SECONDS } from '@domain/constants/app.constant';

const response = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });
const service = (insecure: boolean) => new SessionCookieService({ isSessionCookieInsecure: () => insecure } as never);

describe('SessionCookieService', () => {
  it('sets an HttpOnly, Secure, SameSite Lax cookie with the session lifetime', () => {
    const res = response();
    service(false).set(res as unknown as Response, 'token');
    expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, 'token', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS * 1000 });
  });

  it('drops Secure only when the local flag asks for it, and stays HttpOnly', () => {
    const res = response();
    service(true).set(res as unknown as Response, 'token');
    expect(res.cookie.mock.calls[0][2]).toMatchObject({ httpOnly: true, secure: false });
  });

  it('clears with the same attributes, so the browser really removes it', () => {
    const res = response();
    service(false).clear(res as unknown as Response);
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  });
});
