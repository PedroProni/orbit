import { RecurrenceRuleEntity } from '@domain/entities/recurrence-rule.entity';

export class DomainRecurrenceRuleMapper {
  static toPersistence(entity: RecurrenceRuleEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      frequency: entity.getFrequency(),
      interval: entity.getInterval(),
      next_run_at: entity.getNextRunAt(),
      active: entity.getActive(),
      last_created_task_id: entity.getLastCreatedTaskId(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): RecurrenceRuleEntity {
    return new RecurrenceRuleEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      frequency: raw.frequency,
      interval: raw.interval,
      nextRunAt: raw.next_run_at,
      active: raw.active,
      lastCreatedTaskId: raw.last_created_task_id ?? null,
      createdBy: raw.created_by,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
