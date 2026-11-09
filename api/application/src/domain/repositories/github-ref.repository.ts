import { GithubRefEntity } from '@domain/entities/github-ref.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface GithubRefRepository extends BaseRepository<GithubRefEntity> {
  upsertRef(entity: GithubRefEntity): Promise<void>;
  removeBranchesNotIn(repository: string, keep: string[], seenBefore: Date): Promise<number>;
  removeBranch(repository: string, name: string): Promise<number>;
}
