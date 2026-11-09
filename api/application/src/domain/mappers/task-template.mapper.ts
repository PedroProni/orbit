import { TaskTemplateEntity } from '@domain/entities/task-template.entity';

export class DomainTaskTemplateMapper {
  static toPersistence(entity: TaskTemplateEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      name: entity.getName(),
      title_template: entity.getTitleTemplate(),
      description_md: entity.getDescriptionMd(),
      tags: entity.getTags(),
      priority: entity.getPriority(),
      task_kind: entity.getTaskKind(),
      estimate_minutes: entity.getEstimateMinutes(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TaskTemplateEntity {
    return new TaskTemplateEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id,
      name: raw.name,
      titleTemplate: raw.title_template,
      descriptionMd: raw.description_md,
      tags: raw.tags ?? [],
      priority: raw.priority ?? null,
      taskKind: raw.task_kind,
      estimateMinutes: raw.estimate_minutes ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
