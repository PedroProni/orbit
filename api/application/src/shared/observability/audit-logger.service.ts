import { Injectable } from '@nestjs/common';
import { AuditContext } from './audit-context.type';
import { LogLevel } from './log-level.type';

@Injectable()
export class AuditLoggerService {
  private write(level: LogLevel, domain: string, event: string, ctx: AuditContext, err?: Error): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      domain,
      event,
      ...ctx,
    };
    if (err) {
      entry.error = err.message;
      if (process.env.NODE_ENV !== 'production') {
        entry.errorStack = err.stack;
      }
    }
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  info(domain: string, event: string, ctx: AuditContext): void {
    this.write('info', domain, event, ctx);
  }

  warn(domain: string, event: string, ctx: AuditContext): void {
    this.write('warn', domain, event, ctx);
  }

  error(domain: string, event: string, ctx: AuditContext, err?: Error): void {
    this.write('error', domain, event, ctx, err);
  }

  request(event: string, ctx: AuditContext): void {
    this.write('info', 'http', event, ctx);
  }
}
