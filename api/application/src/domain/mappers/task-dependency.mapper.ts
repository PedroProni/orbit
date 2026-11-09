import { TaskDependencyEntity } from '@domain/entities/task-dependency.entity';

export class DomainTaskDependencyMapper {
  static toPersistence(entity: TaskDependencyEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      depends_on_id: entity.getDependsOnId(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TaskDependencyEntity {
    return new TaskDependencyEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      dependsOnId: raw.depends_on_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
