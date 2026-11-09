import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { SESSION_COOKIE_NAME } from '@domain/constants/auth.constant';
import { SESSION_TTL_SECONDS } from '@domain/constants/app.constant';

@Injectable()
export class SessionCookieService {
  constructor(private readonly env: EnvConfigService) {}

  set(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE_NAME, token, { ...this.options(), maxAge: SESSION_TTL_SECONDS * 1000 });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, this.options());
  }

  private options() {
    return { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: !this.env.isSessionCookieInsecure() };
  }
}
