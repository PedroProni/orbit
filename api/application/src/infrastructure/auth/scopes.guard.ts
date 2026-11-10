import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserRole } from '@domain/enums/user.enums';
import { ANY_SCOPES_KEY, GUEST_READABLE_KEY, REQUIRED_SCOPES_KEY } from '@infrastructure/auth/auth.constants';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const anyOf = this.reflector.getAllAndOverride<string[]>(ANY_SCOPES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const principal: AuthPrincipal | undefined = context.switchToHttp().getRequest().principal;
    if (!principal) throw new ForbiddenException('No principal');
    if (principal.role === UserRole.GUEST && !this.reflector.getAllAndOverride<boolean>(GUEST_READABLE_KEY, [context.getHandler(), context.getClass()]))
      throw new ForbiddenException('Guests cannot use this endpoint');
    if (required.some(scope => !principal.scopes.includes(scope))) throw new ForbiddenException('Insufficient scope');
    if (anyOf.length && !anyOf.some(scope => principal.scopes.includes(scope))) throw new ForbiddenException('Insufficient scope');
    return true;
  }
}
