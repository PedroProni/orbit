import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { AuditLoggerService } from './audit-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { requestId?: string; user?: { id: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    const path = req.url?.split('?')[0];
    if (path === '/health') return next.handle();

    const startTime = performance.now();
    this.audit.request('HTTP_REQUEST', {
      requestId: req.requestId,
      method: req.method,
      path,
      ip: req.ip,
    });

    res.on('finish', () => {
      this.audit.request('HTTP_RESPONSE', {
        requestId: req.requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: Math.round(performance.now() - startTime),
        userId: (req as any).user?.id,
      });
    });

    return next.handle();
  }
}
