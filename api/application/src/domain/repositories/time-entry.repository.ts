import { TimeEntryEntity } from '@domain/entities/time-entry.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface TimeEntryRepository extends BaseRepository<TimeEntryEntity> {}
