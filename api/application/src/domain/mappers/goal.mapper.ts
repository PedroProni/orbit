import { GoalEntity } from '@domain/entities/goal.entity';

export class DomainGoalMapper {
  static toPersistence(entity: GoalEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      name: entity.getName(),
      description: entity.getDescription(),
      owner_id: entity.getOwnerId(),
      due_date: entity.getDueDate(),
      targets: entity.getTargets(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): GoalEntity {
    return new GoalEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      name: raw.name,
      description: raw.description,
      ownerId: raw.owner_id,
      dueDate: raw.due_date ?? null,
      targets: raw.targets ?? [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
