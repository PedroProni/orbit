import { NetworkAddressPolicy } from '@domain/policies/network-address.policy';
import { AUTOMATION_ERROR } from '@domain/constants/automation-error.constant';
import { AUTOMATION_WEBHOOK_LOCAL_HOSTNAME, AUTOMATION_WEBHOOK_URL_MAX_LENGTH } from '@domain/constants/automation-webhook.constant';

export class WebhookUrlPolicy {
  static check(raw: string, allowPrivate: boolean): string | null {
    const value = raw.trim();
    if (!value || value.length > AUTOMATION_WEBHOOK_URL_MAX_LENGTH) return AUTOMATION_ERROR.WEBHOOK_URL_INVALID;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return AUTOMATION_ERROR.WEBHOOK_URL_INVALID;
    }
    if (url.protocol !== 'https:' && !(allowPrivate && url.protocol === 'http:')) return AUTOMATION_ERROR.WEBHOOK_URL_INVALID;
    if (url.username || url.password || !url.hostname) return AUTOMATION_ERROR.WEBHOOK_URL_INVALID;
    if (allowPrivate) return null;
    const host = WebhookUrlPolicy.hostOf(url);
    if (host === AUTOMATION_WEBHOOK_LOCAL_HOSTNAME || host.endsWith(`.${AUTOMATION_WEBHOOK_LOCAL_HOSTNAME}`)) return AUTOMATION_ERROR.WEBHOOK_URL_PRIVATE;
    if (NetworkAddressPolicy.isIp(host) && !NetworkAddressPolicy.isPublic(host)) return AUTOMATION_ERROR.WEBHOOK_URL_PRIVATE;
    return null;
  }

  static hostOf(url: URL): string {
    const host = url.hostname.toLowerCase();
    return host.endsWith('.') ? host.slice(0, -1) : host;
  }
}
