import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { createMetricsLogger, Unit } from 'aws-embedded-metrics';
import { Request, Response } from 'express';
import { ROUTE_TIER_MAP } from './route-tiers.config';
import { RouteTier } from './route-tier.enum';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    if (request.url === '/health') {
      return next.handle();
    }

    response.on('finish', () => {
      this.recordMetrics(request, response, startTime);
    });

    return next.handle();
  }

  private recordMetrics(request: Request, response: Response, startTime: number): void {
    const durationMs = performance.now() - startTime;
    const method = request.method;
    const route = this.normalizeRoute(request);
    const routeKey = `${method} ${route}`;
    const statusCode = response.statusCode;
    const tierConfig = ROUTE_TIER_MAP[routeKey];
    const tier = tierConfig?.tier ?? RouteTier.UNCLASSIFIED;

    const metrics = createMetricsLogger();
    metrics.setNamespace('Application');

    metrics.setDimensions({ Route: routeKey, Tier: tier });
    metrics.putDimensions({ Tier: tier });

    metrics.putMetric('RequestLatencyMs', durationMs, Unit.Milliseconds);
    metrics.putMetric('RequestCount', 1, Unit.Count);

    if (statusCode >= 400 && statusCode < 500) {
      metrics.putMetric('4xxErrorCount', 1, Unit.Count);
    } else if (statusCode >= 500) {
      metrics.putMetric('5xxErrorCount', 1, Unit.Count);
    }

    metrics.setProperty('StatusCode', statusCode);
    metrics.setProperty('Method', method);
    metrics.setProperty('Path', request.url);

    metrics.flush().catch(() => {});
  }

  private normalizeRoute(request: Request): string {
    const routePath = (request as any).route?.path as string | undefined;
    if (routePath) {
      return `${request.baseUrl}${routePath}`;
    }
    return request.url.split('?')[0];
  }
}
