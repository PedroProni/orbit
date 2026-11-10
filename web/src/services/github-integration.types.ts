export type WebhookDeliveryOutcome = 'processed' | 'ignored' | 'failed';

export interface GithubRepositoryStatus {
  fullName: string;
  lastSuccessAt: string | null;
  syncing: boolean;
}

export interface GithubIntegration {
  secretConfigured: boolean;
  tokenConfigured: boolean;
  webhookPath: string;
  syncIntervalMs: number;
  repositories: GithubRepositoryStatus[];
}

export interface WebhookDelivery {
  id: string;
  deliveryId: string;
  event: string;
  action: string | null;
  repository: string | null;
  outcome: WebhookDeliveryOutcome | null;
  failureCode: string | null;
  linkedTasks: number;
  duplicates: number;
  receivedAt: string;
  finishedAt: string | null;
}

export interface WebhookDeliveryFilters {
  event?: string;
  outcome?: string;
}
