import { Module } from '@nestjs/common';
import { HttpSecurityModule } from '@infrastructure/http-security/http-security.module';
import { HealthModule } from '@infrastructure/health/health.module';
import { EnvConfigModule } from '@common/env/env-config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { HelperModule } from '@common/helpers/helper.module';
import { CorsService } from '@infrastructure/http-security/services/cors.service';

@Module({
  imports: [HttpSecurityModule, HealthModule, EnvConfigModule, DatabaseModule, HelperModule],
  providers: [CorsService],
  exports: [HttpSecurityModule, HealthModule, DatabaseModule],
})
export class InfrastructureModule {}
