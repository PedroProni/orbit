import { PaginatedResult } from '@domain/repositories/paginated-result';
import { KeysetPage } from '@domain/types/keyset-page.type';
import { KeysetPosition } from '@domain/types/keyset-position.type';

export interface BaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByIdInWorkspace(id: string, workspaceId: string): Promise<T | null>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  findMany(filter: Record<string, unknown>, sort?: Record<string, 1 | -1>, limit?: number): Promise<T[]>;
  findPaged(filter: Record<string, unknown>, page: number, limit: number, sort?: Record<string, 1 | -1>): Promise<PaginatedResult<T>>;
  findKeyset(filter: Record<string, unknown>, after: KeysetPosition | null, limit: number): Promise<KeysetPage<T>>;
  count(filter: Record<string, unknown>): Promise<number>;
  update(entity: T): Promise<T>;
  patch(entity: T, changedProps: string[]): Promise<T>;
  delete(id: string): Promise<void>;
}
