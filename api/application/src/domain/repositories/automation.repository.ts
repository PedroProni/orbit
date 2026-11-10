import { AutomationEntity } from '@domain/entities/automation.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AutomationRepository extends BaseRepository<AutomationEntity> {
  moveDateCursor(id: string, armedAt: Date, cursor: Date): Promise<void>;
}
