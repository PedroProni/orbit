import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@domain/errors/domain.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId ?? request.header('x-request-id');

    const reply = (statusCode: number, payload: Record<string, unknown>) =>
      response.status(statusCode).json({
        ...payload,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(requestId ? { requestId } : {}),
      });

    const logError = (statusCode: number, payload: Record<string, unknown>) => {
      const entry = {
        requestId,
        statusCode,
        method: request.method,
        path: request.url,
        ip: request.ip,
        ...payload,
      };

      const line = JSON.stringify(entry);
      if (statusCode >= 500) this.logger.error(line);
      else this.logger.warn(line);
    };

    if (exception instanceof DomainError) {
      logError(exception.status, { code: exception.code, message: exception.message, context: exception.context });
      reply(exception.status, {
        statusCode: exception.status,
        code: exception.code,
        message: exception.message,
        ...(exception.context ? { context: exception.context } : {}),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      logError(status, { message: exception.message, response: res });

      reply(status, {
        statusCode: status,
        message: typeof res === 'string' ? res : ((res as any).message ?? exception.message),
      });
      return;
    }

    if (exception instanceof Error) {
      const isDev = process.env.NODE_ENV !== 'production';
      logError(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: exception.message,
        ...(isDev ? { stack: exception.stack } : {}),
      });

      reply(HttpStatus.INTERNAL_SERVER_ERROR, {
        statusCode: 500,
        message: isDev ? exception.message : 'Internal server error',
      });
      return;
    }

    logError(HttpStatus.INTERNAL_SERVER_ERROR, { message: 'Non-error exception thrown' });
    reply(HttpStatus.INTERNAL_SERVER_ERROR, {
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
