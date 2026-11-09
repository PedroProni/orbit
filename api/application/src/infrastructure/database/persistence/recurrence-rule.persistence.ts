import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RecurrenceRule, RecurrenceRuleDocument } from '@infrastructure/database/schemas/recurrence-rule.schema';
import { RecurrenceRuleRepository } from '@domain/repositories/recurrence-rule.repository';
import { RecurrenceRuleEntity } from '@domain/entities/recurrence-rule.entity';
import { DomainRecurrenceRuleMapper } from '@domain/mappers/recurrence-rule.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class RecurrenceRulePersistence extends BaseMongoPersistence<RecurrenceRuleEntity, RecurrenceRuleDocument> implements RecurrenceRuleRepository {
  constructor(@InjectModel(RecurrenceRule.name) model: Model<RecurrenceRuleDocument>) {
    super(model, DomainRecurrenceRuleMapper.toDomain, DomainRecurrenceRuleMapper.toPersistence);
  }

  async claimDue(id: string, expectedNextRunAt: Date, nextRunAt: Date): Promise<boolean> {
    const result = await this.model.updateOne({ _id: id, active: true, next_run_at: expectedNextRunAt }, { $set: { next_run_at: nextRunAt, updated_at: new Date() } }).exec();
    return result.modifiedCount === 1;
  }
}
