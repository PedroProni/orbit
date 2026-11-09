import { Inject, Injectable } from '@nestjs/common';
import { PULL_REQUEST_LINK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSeed } from '@domain/types/pull-request-link-seed.type';
import { PullRequestLinkWrite } from '@domain/types/pull-request-link-write.type';
import { EnvConfigService } from '@common/env/services/env-config.service';

@Injectable()
export class PullRequestLinkWriterService {
  constructor(
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    private readonly env: EnvConfigService,
  ) {}

  canonical(repository: string): string {
    const wanted = repository.toLowerCase();
    return this.env.getGithubRepositories().find(name => name.toLowerCase() === wanted) ?? repository;
  }

  async upsert(seed: PullRequestLinkSeed, apply: (link: PullRequestLinkEntity) => string[]): Promise<PullRequestLinkWrite> {
    const repository = this.canonical(seed.repository);
    const existing = await this.links.findForTask(seed.taskId, repository, seed.number);
    if (existing) return this.patch(existing, apply);
    const entity = PullRequestLinkEntity.fromSeed({ ...seed, repository });
    apply(entity);
    try {
      const saved = await this.links.create(entity);
      return { link: saved ?? entity, previous: undefined, created: true };
    } catch (error) {
      if ((error as { code?: number }).code !== DUPLICATE_KEY_CODE) throw error;
      const raced = await this.links.findForTask(seed.taskId, repository, seed.number);
      if (!raced) throw error;
      return this.patch(raced, apply);
    }
  }

  async save(link: PullRequestLinkEntity, changed: string[]): Promise<PullRequestLinkEntity> {
    if (!changed.length) return link;
    return (await this.links.patch(link, changed)) ?? link;
  }

  private async patch(link: PullRequestLinkEntity, apply: (link: PullRequestLinkEntity) => string[]): Promise<PullRequestLinkWrite> {
    const previous = link.getState();
    const saved = await this.save(link, apply(link));
    return { link: saved, previous, created: false };
  }
}
