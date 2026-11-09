import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { USER_AGENT_MAX_LENGTH } from '@domain/constants/auth.constant';
import { SessionContext } from '@domain/types/session-context.type';

export const ClientContext = createParamDecorator((_: unknown, context: ExecutionContext): SessionContext => {
  const request = context.switchToHttp().getRequest<Request>();
  return { ip: request.ip ?? null, userAgent: request.headers['user-agent']?.slice(0, USER_AGENT_MAX_LENGTH) ?? null };
});
