import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GITHUB_SYNC_STATE_INJECT_TOKEN, WEBHOOK_DELIVERY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GITHUB_WEBHOOK_PATH } from '@domain/constants/github-integration.constant';
import { KEYSET_DEFAULT_LIMIT } from '@domain/constants/keyset-cursor.constant';
import { GithubSyncStateRepository } from '@domain/repositories/github-sync-state.repository';
import { WebhookDeliveryRepository } from '@domain/repositories/webhook-delivery.repository';
import { KeysetCursorPolicy } from '@domain/policies/keyset-cursor.policy';
import { GithubIntegrationView } from '@domain/types/github-integration-view.type';
import { WebhookDeliveryView } from '@domain/types/webhook-delivery-view.type';
import { KeysetView } from '@domain/types/keyset-view.type';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { GithubSyncService } from '@application/services/github-sync.service';
import { WebhookDeliveryPresenter } from '@application/presenters/webhook-delivery.presenter';
import { ListGithubDeliveriesQueryDto } from '@shared/dtos/integration/list-github-deliveries-query.dto';

@Injectable()
export class GithubIntegrationUseCase {
  constructor(
    @Inject(GITHUB_SYNC_STATE_INJECT_TOKEN) private readonly states: GithubSyncStateRepository,
    @Inject(WEBHOOK_DELIVERY_INJECT_TOKEN) private readonly deliveries: WebhookDeliveryRepository,
    private readonly sync: GithubSyncService,
    private readonly env: EnvConfigService,
  ) {}

  async status(): Promise<GithubIntegrationView> {
    const repositories = this.sync.repositories();
    const keys = repositories.map((repository) => this.sync.repositoryKey(repository));
    const states = new Map((await this.states.findMany({ _id: { $in: keys } }, undefined, keys.length)).map((state) => [state.getId(), state]));
    const now = Date.now();
    return {
      secretConfigured: this.env.getGithubWebhookSecret().length > 0,
      tokenConfigured: this.env.getGithubToken().length > 0,
      webhookPath: GITHUB_WEBHOOK_PATH,
      syncIntervalMs: this.env.getGithubSyncIntervalMs(),
      repositories: repositories.map((fullName, index) => {
        const state = states.get(keys[index]);
        const lockedUntil = state?.getLockedUntil();
        return { fullName, lastSuccessAt: state?.getLastSuccessAt() ?? null, syncing: Boolean(lockedUntil && lockedUntil.getTime() > now) };
      }),
    };
  }

  async listDeliveries(query: ListGithubDeliveriesQueryDto): Promise<KeysetView<WebhookDeliveryView>> {
    const after = query.cursor ? KeysetCursorPolicy.decode(query.cursor) : null;
    if (query.cursor && !after) throw new BadRequestException('Invalid cursor');
    const filter: Record<string, unknown> = {};
    if (query.event) filter.event = query.event;
    if (query.outcome) filter.outcome = query.outcome;
    const page = await this.deliveries.findKeyset(filter, after, query.limit ?? KEYSET_DEFAULT_LIMIT);
    return { items: page.items.map(WebhookDeliveryPresenter.toView), nextCursor: page.next ? KeysetCursorPolicy.encode(page.next) : null };
  }
}
