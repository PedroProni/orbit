import { INestApplication } from '@nestjs/common';
import { CorsService } from './cors.service';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { CSRF_HEADER } from '@domain/constants/auth.constant';

type Middleware = (request: { headers: { origin?: string } }, response: unknown, next: () => void) => void;
type CorsOptions = { origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void; allowedHeaders: string[]; credentials: boolean };

describe('CorsService', () => {
  const setup = (domains: { prod?: string; mobile?: string; local?: string }) => {
    const env = { getProdDomain: () => domains.prod ?? '', getMobileDomain: () => domains.mobile ?? '', getLocalDomain: () => domains.local ?? 'http://localhost:3000' } as unknown as EnvConfigService;
    const middlewares: Middleware[] = [];
    let options: CorsOptions | undefined;
    const app = { use: (fn: Middleware) => middlewares.push(fn), enableCors: (value: CorsOptions) => (options = value) } as unknown as INestApplication;
    new CorsService(env).setCors(app);
    const call = (origin?: string) => {
      const response = {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(body: unknown) {
          this.body = body;
          return this;
        },
      };
      const next = jest.fn();
      middlewares[0]({ headers: { origin } }, response, next);
      return { response, next };
    };
    const allows = (origin?: string) => {
      let allowed: boolean | undefined;
      options!.origin(origin, (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      return allowed;
    };
    return { call, allows, options: () => options! };
  };

  it('refuses an unknown origin with a 403 JSON body and never reaches the route', () => {
    const { call, allows } = setup({ local: 'https://orbit-demo.proni.dev' });
    const { response, next } = call('https://evil.example');
    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ statusCode: 403, message: 'CORS_ORIGIN_NOT_ALLOWED', error: 'Forbidden' });
    expect(allows('https://evil.example')).toBe(false);
  });

  it('lets the configured origins through, with a trailing slash or different case, and requests with no Origin', () => {
    const { call, allows } = setup({ prod: 'https://orbit.example/', mobile: 'https://m.orbit.example', local: 'https://orbit-demo.proni.dev' });
    for (const origin of ['https://orbit.example', 'https://m.orbit.example', 'https://orbit-demo.proni.dev', 'https://ORBIT-demo.proni.dev/', undefined]) {
      expect(call(origin).next).toHaveBeenCalledTimes(1);
      expect(allows(origin)).toBe(true);
    }
  });

  it('does not treat an empty optional domain as an allowed origin', () => {
    const { call } = setup({});
    expect(call('null').next).not.toHaveBeenCalled();
    expect(call('http://localhost:3000').next).toHaveBeenCalledTimes(1);
  });

  it('accepts the CSRF header in preflight and keeps credentials on', () => {
    const { options } = setup({});
    expect(options().allowedHeaders).toContain(CSRF_HEADER);
    expect(options().credentials).toBe(true);
  });
});
