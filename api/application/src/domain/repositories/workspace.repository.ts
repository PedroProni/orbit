import { WorkspaceEntity } from '@domain/entities/workspace.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface WorkspaceRepository extends BaseRepository<WorkspaceEntity> {}
