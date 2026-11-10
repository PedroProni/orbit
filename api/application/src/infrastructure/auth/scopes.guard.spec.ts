import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@domain/enums/user.enums';
import { ScopesGuard } from '@infrastructure/auth/scopes.guard';
import { ANY_SCOPES_KEY, GUEST_READABLE_KEY, REQUIRED_SCOPES_KEY } from '@infrastructure/auth/auth.constants';

describe('ScopesGuard', () => {
  const contextFor = (metadata: Record<string, unknown>, principal: unknown): { guard: ScopesGuard; context: ExecutionContext } => {
    const handler = () => undefined;
    for (const [key, value] of Object.entries(metadata)) Reflect.defineMetadata(key, value, handler);
    const context = { getHandler: () => handler, getClass: () => class {}, switchToHttp: () => ({ getRequest: () => ({ principal }) }) } as unknown as ExecutionContext;
    return { guard: new ScopesGuard(new Reflector()), context };
  };
  const principal = (scopes: string[], role = UserRole.MEMBER) => ({ userId: 'u1', workspaceId: 'w1', role, scopes });

  it('requires every scope of Authenticated', () => {
    const { guard, context } = contextFor({ [REQUIRED_SCOPES_KEY]: ['tasks:read', 'tasks:write'] }, principal(['tasks:read']));
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    const ok = contextFor({ [REQUIRED_SCOPES_KEY]: ['tasks:read', 'tasks:write'] }, principal(['tasks:read', 'tasks:write']));
    expect(ok.guard.canActivate(ok.context)).toBe(true);
  });

  it('accepts any one scope of AuthenticatedAny and refuses a principal with none of them', () => {
    const metadata = { [ANY_SCOPES_KEY]: ['workspace:read', 'tasks:read'] };
    for (const scopes of [['workspace:read'], ['tasks:read'], ['tasks:read', 'tasks:write']]) {
      const { guard, context } = contextFor(metadata, principal(scopes));
      expect(guard.canActivate(context)).toBe(true);
    }
    for (const scopes of [[], ['tasks:write'], ['comments:write', 'users:read']]) {
      const { guard, context } = contextFor(metadata, principal(scopes));
      expect(() => guard.canActivate(context)).toThrow('Insufficient scope');
    }
  });

  it('keeps refusing guests on routes that are not guest readable, whatever the scopes', () => {
    const refused = contextFor({ [ANY_SCOPES_KEY]: ['tasks:read'] }, principal(['tasks:read'], UserRole.GUEST));
    expect(() => refused.guard.canActivate(refused.context)).toThrow('Guests cannot use this endpoint');
    const allowed = contextFor({ [ANY_SCOPES_KEY]: ['tasks:read'], [GUEST_READABLE_KEY]: true }, principal(['tasks:read'], UserRole.GUEST));
    expect(allowed.guard.canActivate(allowed.context)).toBe(true);
  });

  it('refuses a request without a principal', () => {
    const { guard, context } = contextFor({ [ANY_SCOPES_KEY]: ['tasks:read'] }, undefined);
    expect(() => guard.canActivate(context)).toThrow('No principal');
  });
});
