import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
import { AuditLoggerService } from './audit-logger.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { RequestIdMiddleware } from './request-id.middleware';
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    AuditLoggerService,
  ],
  exports: [AuditLoggerService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
