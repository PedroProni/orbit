import { GithubSyncStateEntity } from '@domain/entities/github-sync-state.entity';
import { BaseRepository } from '@domain/repositories/base.repository';
import { GithubSyncCursors } from '@domain/types/github-sync-cursors.type';

export interface GithubSyncStateRepository extends BaseRepository<GithubSyncStateEntity> {
  claim(key: string, now: Date, holdMs: number): Promise<boolean>;
  finish(key: string, now: Date, cursors: GithubSyncCursors): Promise<void>;
  release(key: string): Promise<void>;
  lastSuccess(keys: string[]): Promise<Date | null>;
}
