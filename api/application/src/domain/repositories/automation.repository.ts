import { AutomationEntity } from '@domain/entities/automation.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AutomationRepository extends BaseRepository<AutomationEntity> {}
