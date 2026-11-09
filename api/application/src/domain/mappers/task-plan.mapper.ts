import { TaskPlanEntity } from '@domain/entities/task-plan.entity';

export class DomainTaskPlanMapper {
  static toPersistence(entity: TaskPlanEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      estimate_minutes: entity.getEstimateMinutes(),
      task_kind: entity.getTaskKind(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TaskPlanEntity {
    return new TaskPlanEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      estimateMinutes: raw.estimate_minutes ?? null,
      taskKind: raw.task_kind,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
