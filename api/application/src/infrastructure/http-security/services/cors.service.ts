import { ForbiddenException, INestApplication, Injectable, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { CORS_ALLOWED_HEADERS, CORS_METHODS, CORS_ORIGIN_NOT_ALLOWED } from '@domain/constants/cors.constant';

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name);

  constructor(private readonly envService: EnvConfigService) {}

  setCors(app: INestApplication): void {
    const allowedOrigins = new Set([this.envService.getProdDomain(), this.envService.getMobileDomain(), this.envService.getLocalDomain()].map(origin => this.normalize(origin)).filter(Boolean));
    const isAllowed = (origin?: string) => !origin || allowedOrigins.has(this.normalize(origin));

    app.use((request: Request, response: Response, next: NextFunction) => {
      const origin = request.headers.origin;
      if (isAllowed(origin)) return next();
      this.logger.warn(`Blocked CORS origin: ${String(origin).slice(0, 200)}`);
      const refusal = new ForbiddenException(CORS_ORIGIN_NOT_ALLOWED);
      response.status(refusal.getStatus()).json(refusal.getResponse());
    });

    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => callback(null, isAllowed(origin)),
      methods: [...CORS_METHODS],
      allowedHeaders: [...CORS_ALLOWED_HEADERS],
      credentials: true,
    });

    this.logger.log('CORS has been configured');
  }

  private normalize(origin: string): string {
    return origin.trim().replace(/\/$/, '').toLowerCase();
  }
}
