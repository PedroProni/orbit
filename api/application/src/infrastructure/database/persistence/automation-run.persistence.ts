import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AutomationRun, AutomationRunDocument } from '@infrastructure/database/schemas/automation-run.schema';
import { AutomationRunRepository } from '@domain/repositories/automation-run.repository';
import { AutomationRunEntity } from '@domain/entities/automation-run.entity';
import { DomainAutomationRunMapper } from '@domain/mappers/automation-run.mapper';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AutomationLastRun } from '@domain/types/automation-last-run.type';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { AUTOMATION_RUN_FINISHED_STATUSES } from '@domain/constants/automation-run.constant';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class AutomationRunPersistence extends BaseMongoPersistence<AutomationRunEntity, AutomationRunDocument> implements AutomationRunRepository {
  constructor(@InjectModel(AutomationRun.name) model: Model<AutomationRunDocument>) {
    super(model, DomainAutomationRunMapper.toDomain, DomainAutomationRunMapper.toPersistence);
  }

  async claim(run: AutomationRunEntity): Promise<boolean> {
    try {
      await this.model.create(DomainAutomationRunMapper.toPersistence(run) as any);
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_CODE) return false;
      throw error;
    }
  }

  async finish(id: string, status: AutomationRunStatus, reason: string | null): Promise<void> {
    await this.model.updateOne({ _id: id, status: AutomationRunStatus.RUNNING } as any, { $set: { status, reason } }).exec();
  }

  async recentFinished(automationId: string, limit: number): Promise<AutomationRunEntity[]> {
    const rows = await this.model
      .find({ automation_id: automationId, status: { $in: AUTOMATION_RUN_FINISHED_STATUSES } } as any)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
    return rows.map(row => DomainAutomationRunMapper.toDomain(row));
  }

  async lastFinished(automationIds: string[]): Promise<Map<string, AutomationLastRun>> {
    const out = new Map<string, AutomationLastRun>();
    if (!automationIds.length) return out;
    const rows = await this.model
      .aggregate<{ _id: string; status: AutomationRunStatus; reason: string | null; at: Date }>([
        { $match: { automation_id: { $in: automationIds }, status: { $in: AUTOMATION_RUN_FINISHED_STATUSES } } },
        { $sort: { created_at: -1, _id: -1 } },
        { $group: { _id: '$automation_id', status: { $first: '$status' }, reason: { $first: '$reason' }, at: { $first: '$created_at' } } },
      ])
      .exec();
    for (const row of rows) out.set(row._id, { status: row.status, reason: row.reason ?? null, at: row.at });
    return out;
  }

  async removeForAutomation(automationId: string): Promise<void> {
    await this.model.deleteMany({ automation_id: automationId } as any).exec();
  }
}
