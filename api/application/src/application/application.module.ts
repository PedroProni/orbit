import { Module } from '@nestjs/common';
import useCases from '@application/use-cases/export-all.use-cases';
import { DomainModule } from '@domain/domain.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { AuthModule } from '@infrastructure/auth/auth.module';

@Module({
  imports: [DomainModule, AuthModule, StorageModule],
  providers: [...useCases],
  exports: [...useCases],
})
export class ApplicationModule {}
