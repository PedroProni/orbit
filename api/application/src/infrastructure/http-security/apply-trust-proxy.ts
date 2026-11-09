import { INestApplication } from '@nestjs/common';

export function applyTrustProxy(app: INestApplication, hops: number): void {
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', hops > 0 ? hops : false);
}
