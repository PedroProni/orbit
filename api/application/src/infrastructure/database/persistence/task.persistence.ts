import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument } from '@infrastructure/database/schemas/task.schema';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { DomainTaskMapper } from '@domain/mappers/task.mapper';
import { TaskSetModifications } from '@domain/types/set-modification.type';
import { AssigneeCounts } from '@domain/types/assignee-counts.type';
import { AssigneeCountFacets } from '@domain/types/assignee-count-facets.type';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TaskPersistence extends BaseMongoPersistence<TaskEntity, TaskDocument> implements TaskRepository {
  constructor(@InjectModel(Task.name) model: Model<TaskDocument>) {
    super(model, DomainTaskMapper.toDomain, DomainTaskMapper.toPersistence);
  }

  async modifySets(id: string, workspaceId: string, modifications: TaskSetModifications): Promise<void> {
    const fields: Array<[string, { add: string[]; remove: string[] } | undefined]> = [
      ['tags', modifications.tags],
      ['assignee_ids', modifications.assigneeIds],
    ];
    for (const [field, change] of fields) {
      if (!change) continue;
      if (change.remove.length) await this.model.updateOne({ _id: id, workspace_id: workspaceId }, { $pull: { [field]: { $in: change.remove } } }).exec();
      if (change.add.length) await this.model.updateOne({ _id: id, workspace_id: workspaceId }, { $addToSet: { [field]: { $each: change.add } }, $set: { updated_at: new Date() } }).exec();
    }
  }

  async countByAssignee(filter: Record<string, unknown>): Promise<AssigneeCounts> {
    const [result] = await this.model
      .aggregate<AssigneeCountFacets>([
        { $match: filter },
        {
          $facet: {
            total: [{ $count: 'n' }],
            unassigned: [{ $match: { assignee_ids: { $in: [null, []] } } }, { $count: 'n' }],
            byAssignee: [{ $unwind: '$assignee_ids' }, { $group: { _id: '$assignee_ids', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
          },
        },
      ])
      .exec();
    return {
      total: result?.total[0]?.n ?? 0,
      unassigned: result?.unassigned[0]?.n ?? 0,
      byAssignee: (result?.byAssignee ?? []).map(item => ({ assigneeId: item._id, count: item.count })),
    };
  }
}
