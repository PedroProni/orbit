import { DocEntity } from '@domain/entities/doc.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface DocRepository extends BaseRepository<DocEntity> {}
