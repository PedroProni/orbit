import { Injectable } from '@nestjs/common';
import { LookupAddress, LookupOptions, lookup as dnsLookup } from 'node:dns';
import { LookupFunction } from 'node:net';
import { ClientRequest, IncomingMessage, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createHmac } from 'node:crypto';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { AutomationWebhookSender } from '@domain/services/automation-webhook-sender.service';
import { AutomationWebhookPayload } from '@domain/types/automation-webhook-payload.type';
import { AutomationRunOutcome } from '@domain/types/automation-run-outcome.type';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { NetworkAddressPolicy } from '@domain/policies/network-address.policy';
import { WebhookUrlPolicy } from '@domain/policies/webhook-url.policy';
import { AUTOMATION_RUN_REASON } from '@domain/constants/automation-run-reason.constant';
import { AUTOMATION_WEBHOOK_BLOCKED_ERROR_CODE, AUTOMATION_WEBHOOK_DELIVERY_HEADER, AUTOMATION_WEBHOOK_SIGNATURE_HEADER, AUTOMATION_WEBHOOK_SIGNATURE_PREFIX, AUTOMATION_WEBHOOK_TIMEOUT_ERROR_CODE, AUTOMATION_WEBHOOK_TIMEOUT_MS, AUTOMATION_WEBHOOK_USER_AGENT } from '@domain/constants/automation-webhook.constant';

@Injectable()
export class AutomationWebhookHttpSender implements AutomationWebhookSender {
  constructor(private readonly env: EnvConfigService) {}

  async send(url: string, secret: string, payload: AutomationWebhookPayload): Promise<AutomationRunOutcome> {
    const allowPrivate = this.env.isAutomationWebhookPrivateAllowed();
    if (WebhookUrlPolicy.check(url, allowPrivate) !== null) return AutomationWebhookHttpSender.failed(AUTOMATION_RUN_REASON.WEBHOOK_BLOCKED_ADDRESS);
    const target = new URL(url.trim());
    const body = JSON.stringify(payload);
    const signature = AUTOMATION_WEBHOOK_SIGNATURE_PREFIX + createHmac('sha256', secret).update(body).digest('hex');
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
      'User-Agent': AUTOMATION_WEBHOOK_USER_AGENT,
      [AUTOMATION_WEBHOOK_SIGNATURE_HEADER]: signature,
      [AUTOMATION_WEBHOOK_DELIVERY_HEADER]: payload.delivery,
    };
    const send = target.protocol === 'https:' ? httpsRequest : httpRequest;
    return new Promise<AutomationRunOutcome>(resolve => {
      let settled = false;
      const finish = (outcome: AutomationRunOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(outcome);
      };
      const req: ClientRequest = send(target, { method: 'POST', headers, lookup: AutomationWebhookHttpSender.lookupFor(allowPrivate), agent: false }, (res: IncomingMessage) => {
        const status = res.statusCode ?? 0;
        res.destroy();
        req.destroy();
        finish(status >= 200 && status < 300 ? { status: AutomationRunStatus.DONE, reason: null } : AutomationWebhookHttpSender.failed(`${AUTOMATION_RUN_REASON.WEBHOOK_STATUS_PREFIX}${status}`));
      });
      const timer = setTimeout(() => req.destroy(Object.assign(new Error('Webhook timed out'), { code: AUTOMATION_WEBHOOK_TIMEOUT_ERROR_CODE })), AUTOMATION_WEBHOOK_TIMEOUT_MS);
      timer.unref();
      req.on('error', (error: NodeJS.ErrnoException) => finish(AutomationWebhookHttpSender.failed(AutomationWebhookHttpSender.reasonFor(error))));
      req.end(body);
    });
  }

  private static lookupFor(allowPrivate: boolean): LookupFunction {
    return (hostname: string, options: LookupOptions, callback: (...args: any[]) => void) => {
      const family = options.family === 'IPv6' ? 6 : options.family === 'IPv4' ? 4 : (options.family ?? 0);
      dnsLookup(hostname, { all: true, verbatim: true, family }, (error, addresses: LookupAddress[]) => {
        if (error) return callback(error);
        if (!addresses.length) return callback(Object.assign(new Error('No address'), { code: 'ENOTFOUND' }));
        if (!allowPrivate && addresses.some(entry => !NetworkAddressPolicy.isPublic(entry.address)))
          return callback(Object.assign(new Error('Blocked address'), { code: AUTOMATION_WEBHOOK_BLOCKED_ERROR_CODE }));
        if (options.all) return callback(null, addresses);
        return callback(null, addresses[0].address, addresses[0].family);
      });
    };
  }

  private static reasonFor(error: NodeJS.ErrnoException): string {
    if (error.code === AUTOMATION_WEBHOOK_TIMEOUT_ERROR_CODE) return AUTOMATION_RUN_REASON.WEBHOOK_TIMEOUT;
    if (error.code === AUTOMATION_WEBHOOK_BLOCKED_ERROR_CODE) return AUTOMATION_RUN_REASON.WEBHOOK_BLOCKED_ADDRESS;
    return AUTOMATION_RUN_REASON.ERROR;
  }

  private static failed(reason: string): AutomationRunOutcome {
    return { status: AutomationRunStatus.FAILED, reason };
  }
}
