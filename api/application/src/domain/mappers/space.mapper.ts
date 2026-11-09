import { SpaceEntity } from '@domain/entities/space.entity';

export class DomainSpaceMapper {
  static toPersistence(entity: SpaceEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      name: entity.getName(),
      statuses: entity.getStatuses(),
      required_tags: entity.getRequiredTags(),
      title_prefixes: entity.getTitlePrefixes(),
      next_task_seq: entity.getNextTaskSeq(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): SpaceEntity {
    return new SpaceEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      name: raw.name,
      statuses: raw.statuses ?? [],
      requiredTags: raw.required_tags ?? [],
      titlePrefixes: raw.title_prefixes ?? [],
      nextTaskSeq: raw.next_task_seq,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
