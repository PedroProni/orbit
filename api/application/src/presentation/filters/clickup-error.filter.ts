import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ClickupErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof raw === 'string' ? raw : Array.isArray((raw as any)?.message) ? (raw as any).message.join('; ') : ((raw as any)?.message ?? 'Internal error');
    const ecode = status === 401 ? 'OAUTH_017' : status === 403 ? 'OAUTH_027' : status === 404 ? 'ITEM_015' : status === 400 ? 'INPUT_001' : 'SERVER_001';
    response.status(status).json({ err: message, ECODE: ecode });
  }
}
