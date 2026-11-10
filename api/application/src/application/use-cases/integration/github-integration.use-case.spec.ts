import { BadRequestException } from '@nestjs/common';
import { GithubIntegrationUseCase } from './github-integration.use-case';
import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';
import { KeysetCursorPolicy } from '@domain/policies/keyset-cursor.policy';

const CANARY_SECRET = 'canary-webhook-secret-7f3a';
const CANARY_TOKEN = 'canary-github-token-9c1d';

const setup = (secret = CANARY_SECRET, token = CANARY_TOKEN) => {
  const states = { findMany: jest.fn().mockResolvedValue([{ getId: () => 'repo:pedroproni/orbit-api', getLastSuccessAt: () => new Date('2026-11-10T09:00:00Z'), getLockedUntil: () => new Date(Date.now() + 60000) }]) };
  const deliveries = { findKeyset: jest.fn().mockResolvedValue({ items: [], next: null }) };
  const sync = { repositories: () => ['PedroProni/orbit-api', 'PedroProni/orbit-frontend'], repositoryKey: (repository: string) => `repo:${repository.toLowerCase()}` };
  const env = { getGithubWebhookSecret: () => secret, getGithubToken: () => token, getGithubSyncIntervalMs: () => 300000 };
  return { useCase: new GithubIntegrationUseCase(states as never, deliveries as never, sync as never, env as never), states, deliveries };
};

describe('GithubIntegrationUseCase', () => {
  it('reports the secret and the token only as booleans, with each repository sync state', async () => {
    const { useCase } = setup();
    const status = await useCase.status();
    expect(status).toEqual({
      secretConfigured: true,
      tokenConfigured: true,
      webhookPath: '/webhooks/github',
      syncIntervalMs: 300000,
      repositories: [
        { fullName: 'PedroProni/orbit-api', lastSuccessAt: new Date('2026-11-10T09:00:00Z'), syncing: true },
        { fullName: 'PedroProni/orbit-frontend', lastSuccessAt: null, syncing: false },
      ],
    });
    expect(JSON.stringify(status)).not.toContain(CANARY_SECRET);
    expect(JSON.stringify(status)).not.toContain(CANARY_TOKEN);
  });

  it('reports not configured when the secret and the token are empty', async () => {
    const status = await setup('', '').useCase.status();
    expect([status.secretConfigured, status.tokenConfigured]).toEqual([false, false]);
  });

  it('lists deliveries with filters and cursor and never returns headers or payload', async () => {
    const { useCase, deliveries } = setup();
    const row = new WebhookDeliveryEntity({
      _id: 'd-row',
      deliveryId: 'gh-1',
      event: 'pull_request',
      action: 'opened',
      repository: 'PedroProni/orbit-api',
      outcome: WebhookDeliveryOutcome.PROCESSED,
      linkedTasks: 1,
      duplicates: 2,
      failureCode: null,
      finishedAt: new Date(1),
      createdAt: new Date(0),
      updatedAt: new Date(1),
    });
    const next = { createdAt: new Date(0), id: 'd-row' };
    deliveries.findKeyset.mockResolvedValueOnce({ items: [row], next });
    const position = { createdAt: new Date(5), id: 'x' };
    const page = await useCase.listDeliveries({ event: 'pull_request', outcome: WebhookDeliveryOutcome.PROCESSED, limit: 10, cursor: KeysetCursorPolicy.encode(position) });
    expect(deliveries.findKeyset).toHaveBeenCalledWith({ event: 'pull_request', outcome: 'processed' }, position, 10);
    expect(Object.keys(page.items[0]).sort()).toEqual(['action', 'deliveryId', 'duplicates', 'event', 'failureCode', 'finishedAt', 'id', 'linkedTasks', 'outcome', 'receivedAt', 'repository']);
    expect(page.nextCursor).toBe(KeysetCursorPolicy.encode(next));
  });

  it('refuses a broken cursor without reading', async () => {
    const { useCase, deliveries } = setup();
    await expect(useCase.listDeliveries({ cursor: 'e30' })).rejects.toBeInstanceOf(BadRequestException);
    expect(deliveries.findKeyset).not.toHaveBeenCalled();
  });
});
