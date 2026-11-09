import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { LOGIN_ATTEMPT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FORGOT_ACCOUNT_LIMIT, LOGIN_ACCOUNT_LIMIT, LOGIN_IP_LIMIT, PASSWORD_CHANGE_LIMIT, THROTTLE_WINDOW_SECONDS } from '@domain/constants/auth.constant';
import { LoginAttemptRepository } from '@domain/repositories/login-attempt.repository';

const key = (scope: string, value: string): string => `${scope}:${createHash('sha256').update(value).digest('hex')}`;

@Injectable()
export class LoginThrottleService {
  constructor(@Inject(LOGIN_ATTEMPT_INJECT_TOKEN) private readonly attempts: LoginAttemptRepository) {}

  async reserveLogin(email: string, ip: string | null): Promise<boolean> {
    const now = new Date();
    const [account, address] = await Promise.all([
      this.attempts.hit(key('login-account', email), THROTTLE_WINDOW_SECONDS, now),
      this.attempts.hit(key('login-ip', ip ?? 'unknown'), THROTTLE_WINDOW_SECONDS, now),
    ]);
    return account <= LOGIN_ACCOUNT_LIMIT && address <= LOGIN_IP_LIMIT;
  }

  async settleLogin(email: string, ip: string | null): Promise<void> {
    await Promise.all([this.attempts.clear(key('login-account', email)), this.attempts.release(key('login-ip', ip ?? 'unknown'))]);
  }

  clearAccount(email: string): Promise<void> {
    return this.attempts.clear(key('login-account', email));
  }

  async reserveForgot(email: string): Promise<boolean> {
    return (await this.attempts.hit(key('forgot-account', email), THROTTLE_WINDOW_SECONDS, new Date())) <= FORGOT_ACCOUNT_LIMIT;
  }

  async reservePasswordChange(userId: string): Promise<boolean> {
    return (await this.attempts.hit(key('password-change', userId), THROTTLE_WINDOW_SECONDS, new Date())) <= PASSWORD_CHANGE_LIMIT;
  }

  clearPasswordChange(userId: string): Promise<void> {
    return this.attempts.clear(key('password-change', userId));
  }
}
