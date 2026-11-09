import { Module } from '@nestjs/common';
import { EnvConfigModule } from '@common/env/env-config.module';

@Module({
  imports: [EnvConfigModule],
  providers: [],
  exports: [],
})
export class HelperModule {}
