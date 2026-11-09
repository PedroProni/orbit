import { RecurrenceRuleEntity } from '@domain/entities/recurrence-rule.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface RecurrenceRuleRepository extends BaseRepository<RecurrenceRuleEntity> {
  claimDue(id: string, expectedNextRunAt: Date, nextRunAt: Date): Promise<boolean>;
}
