import { Global, Module } from '@nestjs/common';
import { AUTOMATION_WEBHOOK_SENDER_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationWebhookHttpSender } from '@infrastructure/automation/automation-webhook-http.sender';

@Global()
@Module({
  providers: [{ provide: AUTOMATION_WEBHOOK_SENDER_TOKEN, useClass: AutomationWebhookHttpSender }],
  exports: [AUTOMATION_WEBHOOK_SENDER_TOKEN],
})
export class AutomationWebhookModule {}
