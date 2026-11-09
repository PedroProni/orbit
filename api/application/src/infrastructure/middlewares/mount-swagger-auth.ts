import { INestApplication } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { SWAGGER_API_ROOT } from '@infrastructure/documentation/config/swagger-constants.config';
import { authMiddlewareFactory } from '@infrastructure/middlewares/swagger-auth.middleware';

export function mountSwaggerAuth(app: INestApplication): void {
  app.use(`/${SWAGGER_API_ROOT}`, authMiddlewareFactory(app.get(EnvConfigService)));
}
