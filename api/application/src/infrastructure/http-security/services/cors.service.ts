import { Injectable, Logger } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name);

  constructor(private readonly envService: EnvConfigService) {}

  async setCors(app: any) {
    const allowedOrigins = [this.envService.getProdDomain().trim().replace(/\/$/, ''), this.envService.getMobileDomain().trim().replace(/\/$/, ''), this.envService.getLocalDomain().trim().replace(/\/$/, '')];

    app.enableCors({
      origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        const sanitizedOrigin = origin?.trim().replace(/\/$/, '');

        if (!origin || allowedOrigins.includes(sanitizedOrigin)) {
          callback(null, true);
        } else {
          this.logger.warn(`Blocked CORS origin: ${origin}`);
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-api-key', 'user-token'],
      credentials: true,
    });

    this.logger.log('CORS has been configured');
  }
}
