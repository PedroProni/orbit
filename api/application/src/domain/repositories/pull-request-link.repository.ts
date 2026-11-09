import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface PullRequestLinkRepository extends BaseRepository<PullRequestLinkEntity> {
  findForTask(taskId: string, repository: string, number: number): Promise<PullRequestLinkEntity | null>;
  findInRepository(repository: string, filter: Record<string, unknown>, limit: number): Promise<PullRequestLinkEntity[]>;
}
