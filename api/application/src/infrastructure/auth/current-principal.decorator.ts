import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

export const CurrentPrincipal = createParamDecorator((_data: unknown, context: ExecutionContext): AuthPrincipal => context.switchToHttp().getRequest().principal);
