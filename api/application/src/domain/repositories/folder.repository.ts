import { FolderEntity } from '@domain/entities/folder.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface FolderRepository extends BaseRepository<FolderEntity> {}
