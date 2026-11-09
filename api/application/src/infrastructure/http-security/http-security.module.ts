import { Module } from '@nestjs/common';
import { CorsService } from '@infrastructure/http-security/services/cors.service';
import { EnvConfigModule } from '@common/env/env-config.module';

@Module({
  imports: [EnvConfigModule],
  providers: [CorsService],
  exports: [CorsService],
})
export class HttpSecurityModule {}
