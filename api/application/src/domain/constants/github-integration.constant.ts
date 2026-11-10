import { GITHUB_EVENT } from '@domain/constants/github-webhook-event.constant';

export const GITHUB_WEBHOOK_PATH = '/webhooks/github';
export const GITHUB_DELIVERY_EVENTS = [...Object.values(GITHUB_EVENT), 'ping'] as const;
