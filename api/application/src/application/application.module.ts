import { Module } from '@nestjs/common';
import useCases from '@application/use-cases/export-all.use-cases';
import { DomainModule } from '@domain/domain.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { GithubModule } from '@infrastructure/github/github.module';
import { AutomationWebhookModule } from '@infrastructure/automation/automation-webhook.module';
import { AuthModule } from '@infrastructure/auth/auth.module';

@Module({
  imports: [DomainModule, AuthModule, StorageModule, GithubModule, AutomationWebhookModule],
  providers: [...useCases],
  exports: [...useCases],
})
export class ApplicationModule {}
