import { FormEntity } from '@domain/entities/form.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface FormRepository extends BaseRepository<FormEntity> {}
