import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '@infrastructure/documentation/swagger';
import { CorsService } from '@infrastructure/http-security/services/cors.service';
import { mountSwaggerAuth } from '@infrastructure/middlewares/mount-swagger-auth';
import { applyTrustProxy } from '@infrastructure/http-security/apply-trust-proxy';
import { EnvConfigService } from '@common/env/services/env-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const hops = app.get(EnvConfigService).getTrustProxyHops();
  if (hops === 0) logger.warn('TRUST_PROXY_HOPS is not set: behind a proxy every client shares the same login limit by address');
  applyTrustProxy(app, hops);

  const corsService = app.get(CorsService);
  corsService.setCors(app);

  mountSwaggerAuth(app);

  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  const host = process.env.BIND_HOST;
  await (host ? app.listen(port, host) : app.listen(port));
  logger.log(`Application running on port ${port}`);
}
bootstrap();
