import { AutomationRunOutcome } from '@domain/types/automation-run-outcome.type';
import { AutomationWebhookPayload } from '@domain/types/automation-webhook-payload.type';

export interface AutomationWebhookSender {
  send(url: string, secret: string, payload: AutomationWebhookPayload): Promise<AutomationRunOutcome>;
}
